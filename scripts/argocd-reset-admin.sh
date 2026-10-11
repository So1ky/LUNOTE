#!/bin/sh
# ArgoCD admin 비밀번호 재설정 — 원본은 Secrets Manager lunote/shared/argocd, 클러스터(argocd-secret)에는 bcrypt 해시만.
# 비밀번호는 화면에 출력하지 않고 클립보드로만 넘긴다. 사용: sh scripts/argocd-reset-admin.sh (tailnet 접속 상태에서)
set -eu
umask 077

# 1) 무작위 비밀번호(영숫자 24자 — JSON·셸 이스케이프 불필요)
PW=$(openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | cut -c1-24)
[ ${#PW} -eq 24 ] || { echo "비밀번호 생성 실패"; exit 1; }

# 2) bcrypt 해시(cost 10). htpasswd는 $2y$를 내므로 ArgoCD 문서대로 $2a$로 바꾼다
HASH=$(printf '%s' "$PW" | htpasswd -niBC 10 admin | cut -d: -f2- | tr -d '\n' | sed 's/^\$2y/$2a/')
case "$HASH" in '$2a$10$'*) ;; *) echo "해시 생성 실패"; exit 1 ;; esac

# 3) 원본을 Secrets Manager에 (임시 파일은 끝나면 지운다)
TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT
printf '{"admin-password":"%s"}' "$PW" > "$TMP"
AWS_PROFILE=lunote aws secretsmanager put-secret-value --secret-id lunote/shared/argocd --secret-string "file://$TMP" > /dev/null
AWS_PROFILE=lunote aws secretsmanager get-secret-value --secret-id lunote/shared/argocd --query SecretString --output text \
  | PW="$PW" python3 -c 'import json,os,sys; print("① Secrets Manager 저장:", "일치" if json.load(sys.stdin)["admin-password"] == os.environ["PW"] else "불일치")'

# 4) 해시를 argocd-secret에 — passwordMtime을 갱신하면 기존 로그인 세션이 무효화된다.
#    이 필드는 git(차트)에 없으므로 ArgoCD selfHeal이 되돌리지 않는다(UI의 Update Password와 같은 필드)
kubectl --context lunote -n argocd patch secret argocd-secret --type merge \
  -p "{\"stringData\":{\"admin.password\":\"$HASH\",\"admin.passwordMtime\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}}" > /dev/null
echo "② argocd-secret 해시 갱신: 완료"

# 5) 새 비밀번호로 실제 로그인되는지(토큰은 버린다)
sleep 3
CODE=$(printf '{"username":"admin","password":"%s"}' "$PW" | curl -s -o /dev/null -w '%{http_code}' \
  -H 'Content-Type: application/json' --data @- https://argocd.tail3e8320.ts.net/api/v1/session)
echo "③ 로그인 API: HTTP $CODE (200이면 성공)"

printf '%s' "$PW" | pbcopy
echo "④ 새 비밀번호를 클립보드에 복사했다 — 비밀번호 관리자에 붙여 넣고 브라우저에서 로그인"

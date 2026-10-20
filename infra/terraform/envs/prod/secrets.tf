# 환경별 앱 시크릿 (DATABASE_URL, 추후 JWT/PortOne/OAuth 키도 같은 시크릿에 키 추가).
# 리소스(그릇)만 Terraform으로 만들고 값은 CLI로만 주입한다 — git/state에 평문을 남기지 않기 위함.
# DB·앱 계정 자체는 AWS 리소스가 아니라 psql로 생성 (Plan 2 결정 표).
resource "aws_secretsmanager_secret" "app_staging" {
  name = "lunote/staging/app"
}

resource "aws_secretsmanager_secret" "app_prod" {
  name = "lunote/prod/app"
}

# ArgoCD 관리자 비밀번호 원본(admin-password). ArgoCD는 bcrypt 해시만 argocd-secret에 두므로 원문을 여기 보관한다.
# ESO로 동기화하지 않는다 — 바꿀 때 이 값을 갱신하고 해시를 argocd-secret에 patch한다(infra/k8s/README.md "관리 UI 접속").
resource "aws_secretsmanager_secret" "argocd" {
  name = "lunote/shared/argocd"
}

# EAS Update(앱 OTA) 코드 서명 개인키 원본 — PEM 본문 그대로(apps/mobile/keys/private-key.pem). 공개 인증서는 저장소에 커밋.
# 잃어버리면 새 인증서로 앱을 다시 빌드해야 하므로 여기가 유일한 백업이다. 값 주입은 CLI(put-secret-value --secret-string file://).
resource "aws_secretsmanager_secret" "eas_update" {
  name = "lunote/shared/eas-update"
}

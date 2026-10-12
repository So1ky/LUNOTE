#!/bin/sh
# 관리자 웹 수동 릴리스 — 이미지를 arm64로 빌드·ECR push하고 kustomization의 newTag를 바꾼다. 커밋·PR은 사람이(develop은 PR 필수).
#   sh scripts/admin-web-release.sh
# 전제: Docker Desktop(buildx), AWS 프로필 lunote, apps/admin-web 워킹 트리 깨끗함(배포본 = 커밋 SHA 보장).
# CI(Jenkins)는 API 전용이다 — 빌드 빈도가 낮아 수동으로 둔다(docs/ARCHITECTURE.md "관리자 웹 상시 배포").
set -eu

export AWS_PROFILE=lunote AWS_REGION=ap-northeast-2
ROOT=$(cd "$(dirname "$0")/.." && pwd)
APP_DIR="$ROOT/apps/admin-web"
KUSTOMIZATION="$ROOT/infra/k8s/workloads/admin-web/kustomization.yaml"
REPO=lunote/admin-web
API_URL=https://api.lunoteapp.com # Vite가 빌드 시 정적으로 박는다(공개값). 바꾸면 재빌드.

if [ -n "$(git -C "$ROOT" status --porcelain -- apps/admin-web)" ]; then
  echo "중단: apps/admin-web에 커밋되지 않은 변경이 있다 — 배포본은 커밋 SHA와 같아야 한다" >&2
  exit 1
fi
TAG=$(git -C "$ROOT" rev-parse --short=12 HEAD)
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
REGISTRY="$ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com"
IMAGE="$REGISTRY/$REPO:$TAG"

# 불변 태그 — 같은 커밋을 다시 push하면 ECR이 거부한다. 먼저 있는지 본다
if aws ecr describe-images --repository-name "$REPO" --image-ids imageTag="$TAG" >/dev/null 2>&1; then
  echo "이미 push된 커밋: $IMAGE — 빌드를 건너뛰고 kustomization만 맞춘다"
else
  aws ecr get-login-password | docker login --username AWS --password-stdin "$REGISTRY" >/dev/null
  # --provenance=false --sbom=false: attestation 없는 단일 매니페스트로 push한다. 기본값(OCI 인덱스 + attestation)이면 ECR 기본 스캔이
  # 인덱스를 지원하지 않아 스캔이 아예 안 되고(ScanNotFound, 2026-10-12 실측) untagged 잔재 2개가 함께 남는다
  docker buildx build --platform linux/arm64 --provenance=false --sbom=false \
    --build-arg "VITE_API_URL=$API_URL" -t "$IMAGE" --push "$APP_DIR"
  echo "push 완료: $IMAGE"
  # ECR push 스캔 결과(최대 2분 대기). 차단하지 않는다 — 정적 파일 서버라 운영 판단(설계 §3-3)
  i=0; STATUS=IN_PROGRESS
  while [ $i -lt 24 ]; do
    STATUS=$(aws ecr describe-image-scan-findings --repository-name "$REPO" --image-id imageTag="$TAG" \
      --query 'imageScanStatus.status' --output text 2>/dev/null || echo IN_PROGRESS)
    [ "$STATUS" = "COMPLETE" ] && break
    sleep 5; i=$((i + 1))
  done
  if [ "$STATUS" = "COMPLETE" ]; then
    echo "ECR 스캔 결과(심각도별 건수):"
    aws ecr describe-image-scan-findings --repository-name "$REPO" --image-id imageTag="$TAG" \
      --query 'imageScanFindings.findingSeverityCounts' --output json
  else
    echo "스캔 미완료(상태 $STATUS) — ECR 콘솔에서 나중에 확인"
  fi
fi

# newTag는 항상 따옴표로 — 숫자만인 SHA가 YAML 숫자로 읽히면 kustomize가 거부한다
sed -i '' -E "s|^( +newTag: ).*$|\1\"$TAG\" # scripts/admin-web-release.sh가 push한 git SHA — 사람이 PR로 배포|" "$KUSTOMIZATION"
kubectl kustomize "$(dirname "$KUSTOMIZATION")" | grep 'image:'
git -C "$ROOT" --no-pager diff --stat -- "$KUSTOMIZATION"
echo "다음: 커밋 → PR → 머지하면 ArgoCD admin-web-prod가 배포한다(3~5분). 롤백은 그 PR revert."

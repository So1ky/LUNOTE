#!/bin/sh
# 출시 전 비용 절감용 — 작업하지 않는 동안 노드·NAT·RDS를 내렸다가 다시 올린다.
#   sh scripts/infra-power.sh sleep    내리기 (약 10분)
#   sh scripts/infra-power.sh wake     올리기 (약 15분, 끝에 staging 헬스체크)
#   sh scripts/infra-power.sh status   현재 상태
# 내리는 것: Karpenter 노드, 코어 노드그룹(0대), NAT Gateway, RDS(정지)
# 유지되는 것: EKS 컨트롤 플레인, ALB, ElastiCache(정지 기능 없음), 데이터·설정 전부
# 주의: 정지한 RDS는 7일 뒤 AWS가 자동으로 다시 시작한다. 실사용자가 생기면 이 스크립트를 쓰지 않는다.
set -eu

export AWS_PROFILE=lunote AWS_REGION=ap-northeast-2
CLUSTER=lunote
DB=lunote
ROOT=$(cd "$(dirname "$0")/.." && pwd)
TF_DIR="$ROOT/infra/terraform/envs/prod"

k() { kubectl --context lunote "$@"; }
nodegroup() { aws eks list-nodegroups --cluster-name "$CLUSTER" --query "nodegroups[0]" --output text; }
node_count() { k get nodes --no-headers 2>/dev/null | wc -l | tr -d ' '; }
karpenter_instances() {
  aws ec2 describe-instances \
    --filters "Name=tag-key,Values=karpenter.sh/nodepool" "Name=instance-state-name,Values=pending,running" \
    --query "length(Reservations[].Instances[])" --output text
}
rds_status() { aws rds describe-db-instances --db-instance-identifier "$DB" --query "DBInstances[0].DBInstanceStatus" --output text; }
nat_count() {
  aws ec2 describe-nat-gateways --filter "Name=state,Values=available,pending" \
    --query "length(NatGateways)" --output text
}
# wait_for "설명" 명령... — 명령이 성공할 때까지 10초 간격으로 기다린다
wait_for() {
  desc=$1
  shift
  printf '… %s' "$desc"
  until "$@" >/dev/null 2>&1; do
    printf '.'
    sleep 10
  done
  echo ' 완료'
}

no_karpenter_instances() { [ "$(karpenter_instances)" = "0" ]; }
no_nodes() { [ "$(node_count)" = "0" ]; }
core_node_ready() { k get nodes --no-headers | grep -q ' Ready '; }
rds_settled() { s=$(rds_status); [ "$s" = "available" ] || [ "$s" = "stopped" ]; }
rds_available() { [ "$(rds_status)" = "available" ]; }
platform_ready() {
  [ "$(k get deploy karpenter -n karpenter -o jsonpath='{.status.availableReplicas}')" = "1" ] &&
    [ "$(k get deploy argocd-repo-server -n argocd -o jsonpath='{.status.availableReplicas}')" = "1" ]
}
staging_healthy() { curl -sf https://api-staging.lunoteapp.com/health; }

status() {
  echo "노드: $(node_count)대 (Karpenter 인스턴스 $(karpenter_instances)대)"
  echo "NAT Gateway: $(nat_count)개"
  echo "RDS: $(rds_status)"
}

sleep_infra() {
  # 1. ArgoCD가 아래 변경을 되돌리지 못하게 먼저 멈춘다
  k scale statefulset argocd-application-controller -n argocd --replicas=0
  # 2. 워크로드를 내려 Karpenter가 새 노드를 만들 이유를 없앤다
  for ns in staging prod; do
    # Deployment가 없는 네임스페이스에서는 scale이 오류로 끝나므로 건너뛴다
    if [ -n "$(k get deployment -n "$ns" -o name)" ]; then
      k scale deployment --all -n "$ns" --replicas=0
    fi
  done
  # 3. Karpenter 노드를 먼저 지운다 — 코어 노드를 먼저 내리면 Karpenter가 죽어 Spot 노드가 주인 없이 남는다
  k delete nodeclaims --all --wait=true --timeout=10m
  wait_for "Karpenter 인스턴스 종료" no_karpenter_instances
  # 4. 코어 노드그룹 0대 (desired는 Terraform이 관리하지 않는 운영 값)
  aws eks update-nodegroup-config --cluster-name "$CLUSTER" --nodegroup-name "$(nodegroup)" \
    --scaling-config minSize=0,maxSize=2,desiredSize=0 >/dev/null
  wait_for "코어 노드 종료" no_nodes
  # 5. RDS 정지
  wait_for "RDS 상태 안정" rds_settled
  if rds_available; then
    aws rds stop-db-instance --db-instance-identifier "$DB" >/dev/null
    echo "RDS 정지 요청"
  fi
  # 6. NAT Gateway 제거 (노드가 없으므로 아웃바운드 불필요)
  terraform -chdir="$TF_DIR" apply -auto-approve -var enable_nat_gateway=false
  status
}

wake_infra() {
  # 1. NAT 복원 — 노드가 이미지 pull·AWS API 호출을 하려면 먼저 있어야 한다
  terraform -chdir="$TF_DIR" apply -auto-approve
  # 2. RDS 시작 (비동기 — 아래에서 기다린다)
  wait_for "RDS 상태 안정" rds_settled
  if ! rds_available; then
    aws rds start-db-instance --db-instance-identifier "$DB" >/dev/null
    echo "RDS 시작 요청"
  fi
  # 3. 코어 노드 1대
  aws eks update-nodegroup-config --cluster-name "$CLUSTER" --nodegroup-name "$(nodegroup)" \
    --scaling-config minSize=0,maxSize=2,desiredSize=1 >/dev/null
  wait_for "코어 노드 Ready" core_node_ready
  wait_for "플랫폼 파드(Karpenter·ArgoCD) 준비" platform_ready
  wait_for "RDS available" rds_available
  # 4. ArgoCD 재개 — selfHeal이 워크로드 replicas를 git 상태로 되돌리고 Karpenter가 노드를 만든다
  k scale statefulset argocd-application-controller -n argocd --replicas=1
  wait_for "staging API 응답" staging_healthy
  staging_healthy
  echo
  status
}

case "${1:-}" in
  sleep) sleep_infra ;;
  wake) wake_infra ;;
  status) status ;;
  *)
    echo "사용: sh scripts/infra-power.sh sleep|wake|status" >&2
    exit 1
    ;;
esac

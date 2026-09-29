module "vpc" {
  source       = "../../modules/vpc"
  name         = "lunote"
  cluster_name = "lunote"

  # 노드 없는 구축 기간 NAT 비용 절약 (2026-09-23) — EKS 노드 올리기 전에 true로 복원
  enable_nat_gateway = false
}

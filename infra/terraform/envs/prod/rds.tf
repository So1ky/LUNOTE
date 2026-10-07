module "rds" {
  source     = "../../modules/rds"
  name       = "lunote"
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids

  # node: EKS node SG — 코어 노드의 Grafana(PostgreSQL 데이터소스)용. Karpenter 노드는 이미 app SG가 있어 실질 변화는 코어 노드뿐.
  # 노드 단위 허용이라 monitoring NetworkPolicy가 Grafana Pod만 5432를 열어 보완 (ARCHITECTURE §12)
  ingress_security_group_ids = { app = aws_security_group.app.id, bastion = aws_security_group.bastion.id, node = module.eks.node_security_group_id }

  # 2026-10-04 결정: 누적 실결제 10건 도달 시 true로 복원 (ARCHITECTURE.md §12 가용성 방침)
  multi_az = false
}

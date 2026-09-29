# EKS 노드(Plan 3)가 달게 될 SG — RDS/Redis 인그레스는 전부 이 SG를 참조한다 (스펙 §보안: SG 참조 방식만).
# 노드보다 먼저 만들어 두면 데이터 계층 SG 규칙이 Plan 3에서 변경 없이 그대로 유효하다.
resource "aws_security_group" "app" {
  name        = "lunote-app"
  description = "Workloads needing data-layer access (EKS nodes attach this)"
  vpc_id      = module.vpc.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name                     = "lunote-app"
    "karpenter.sh/discovery" = "lunote"
  }
}

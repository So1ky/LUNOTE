module "rds" {
  source     = "../../modules/rds"
  name       = "lunote"
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids

  ingress_security_group_ids = { app = aws_security_group.app.id, bastion = aws_security_group.bastion.id }

  # 2026-10-04 결정: 누적 실결제 10건 도달 시 true로 복원 (ARCHITECTURE.md §12 가용성 방침)
  multi_az = false
}

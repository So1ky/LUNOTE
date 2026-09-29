module "rds" {
  source     = "../../modules/rds"
  name       = "lunote"
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids

  # Task 6에서 aws_security_group.bastion.id 추가 예정
  ingress_security_group_ids = [aws_security_group.app.id]
}

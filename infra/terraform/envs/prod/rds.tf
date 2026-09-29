module "rds" {
  source     = "../../modules/rds"
  name       = "lunote"
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids

  ingress_security_group_ids = { app = aws_security_group.app.id, bastion = aws_security_group.bastion.id }
}

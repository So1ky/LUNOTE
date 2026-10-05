module "vpc" {
  source       = "../../modules/vpc"
  name         = "lunote"
  cluster_name = "lunote"

  enable_nat_gateway = var.enable_nat_gateway
}

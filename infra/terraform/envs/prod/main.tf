module "vpc" {
  source       = "../../modules/vpc"
  name         = "lunote"
  cluster_name = "lunote"
}

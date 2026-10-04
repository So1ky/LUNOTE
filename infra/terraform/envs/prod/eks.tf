module "eks" {
  source             = "../../modules/eks"
  name               = "lunote"
  kubernetes_version = "1.36" # standard support 최신 중 Karpenter 1.14 호환 상한 (1.37은 미지원)
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.private_subnet_ids
}

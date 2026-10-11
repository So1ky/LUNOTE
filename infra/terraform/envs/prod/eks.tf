module "eks" {
  source             = "../../modules/eks"
  name               = "lunote"
  kubernetes_version = "1.36" # standard support 최신 중 Karpenter 1.14 호환 상한 (1.37은 미지원)
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.private_subnet_ids
  # 코어 노드그룹은 PV(EBS)가 있는 AZ에 고정 (ARCHITECTURE §12)
  core_subnet_ids = [module.vpc.private_subnet_ids_by_az["ap-northeast-2c"]]
  # 관측성 스택(Plan 8)을 올리기 위해 medium→large. 2대 증설과 비용이 같고 1대면 전원 스크립트·PV 구조가 그대로다 (ARCHITECTURE §12)
  core_instance_type = "t4g.large"
}

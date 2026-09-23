module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 6.0"

  name = var.name
  cidr = "10.0.0.0/16"

  azs             = ["ap-northeast-2a", "ap-northeast-2c"]
  public_subnets  = ["10.0.0.0/20", "10.0.16.0/20"]
  private_subnets = ["10.0.128.0/20", "10.0.144.0/20"]

  # 비용: NAT는 단일 AZ 1개로 시작 (ARCHITECTURE.md §4, 2026-09-22 SPOF 검토에서 유지 재확정)
  enable_nat_gateway = true
  single_nat_gateway = true

  enable_dns_support   = true
  enable_dns_hostnames = true

  # EKS/Karpenter가 서브넷을 자동 발견하기 위한 태그 (Plan 3 선행 준비)
  public_subnet_tags = {
    "kubernetes.io/role/elb" = "1"
  }
  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = "1"
    "karpenter.sh/discovery"          = var.cluster_name
  }
}

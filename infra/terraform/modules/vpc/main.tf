module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 6.0"

  name = var.name
  cidr = "10.0.0.0/16"

  azs             = ["ap-northeast-2a", "ap-northeast-2c"]
  public_subnets  = ["10.0.0.0/20", "10.0.16.0/20"]
  private_subnets = ["10.0.128.0/20", "10.0.144.0/20"]

  # 비용: NAT는 단일 AZ 1개로 시작 (ARCHITECTURE.md §4, 2026-09-22 SPOF 검토에서 유지 재확정)
  enable_nat_gateway = var.enable_nat_gateway
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

# 같은 리전 S3(Loki·Tempo, ECR 이미지 레이어)를 NAT 처리 요금($0.059/GB) 밖으로 — Gateway 엔드포인트는 무료.
# 프라이빗 라우팅 테이블에 S3 prefix list 경로가 추가된다. NAT를 지우는 수면 모드와 무관하게 유지된다.
data "aws_region" "current" {}

resource "aws_vpc_endpoint" "s3" {
  vpc_id            = module.vpc.vpc_id
  service_name      = "com.amazonaws.${data.aws_region.current.region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = module.vpc.private_route_table_ids

  tags = { Name = "${var.name}-s3" }
}

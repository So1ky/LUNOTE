module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 21.0"

  name               = var.name
  kubernetes_version = var.kubernetes_version

  vpc_id     = var.vpc_id
  subnet_ids = var.subnet_ids

  # 1인 운영·고정 IP 없음 — 퍼블릭 엔드포인트 유지(IAM 인증), 노드는 프라이빗 경로 사용
  endpoint_public_access  = true
  endpoint_private_access = true

  # API 모드 access entries — terraform 실행자(lunote-admin)에게 admin 부여
  enable_cluster_creator_admin_permissions = true

  enable_irsa = true # 체크리스트 2-1: IRSA용 OIDC provider

  # Karpenter EC2NodeClass의 SG selector가 이 태그로 node SG를 발견한다 (app SG에는 Plan 2에서 선반영됨)
  node_security_group_tags = {
    "karpenter.sh/discovery" = var.name
  }

  addons = {
    coredns    = {}
    kube-proxy = {}
    vpc-cni = {
      before_compute = true
      # t4g.medium 기본 max-pods 17 한계 해소 — 코어 노드 1대 결정의 전제
      configuration_values = jsonencode({
        env = { ENABLE_PREFIX_DELEGATION = "true" }
      })
    }
    aws-ebs-csi-driver = {
      service_account_role_arn = aws_iam_role.ebs_csi.arn
    }
  }

  eks_managed_node_groups = {
    core = {
      # 플랫폼 컴포넌트 전용 (스펙 §인프라) — 앱/CI는 Karpenter Spot
      ami_type       = "AL2023_ARM_64_STANDARD"
      instance_types = [var.core_instance_type]

      min_size     = 1
      max_size     = 2
      desired_size = var.core_desired_size
    }
  }
}

# EBS CSI IRSA — Phase 4 Jenkins·Phase 5 Prometheus의 PV 전제 (관리형 정책이라 손 HCL로 충분)
data "aws_iam_policy_document" "ebs_csi_assume" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [module.eks.oidc_provider_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "${module.eks.oidc_provider}:sub"
      values   = ["system:serviceaccount:kube-system:ebs-csi-controller-sa"]
    }

    condition {
      test     = "StringEquals"
      variable = "${module.eks.oidc_provider}:aud"
      values   = ["sts.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ebs_csi" {
  name               = "${var.name}-ebs-csi"
  assume_role_policy = data.aws_iam_policy_document.ebs_csi_assume.json
}

resource "aws_iam_role_policy_attachment" "ebs_csi" {
  role       = aws_iam_role.ebs_csi.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"
}

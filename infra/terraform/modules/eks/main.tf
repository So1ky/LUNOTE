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
    coredns = {
      # 기본값은 hostname anti-affinity가 preferred뿐이라 노드 1대일 때 2개가 같은 Spot 노드에 몰린다 (#154)
      # 이 값을 주면 기본 제약(zone, ScheduleAnyway)이 대체되므로 함께 다시 적는다
      configuration_values = jsonencode({
        topologySpreadConstraints = [
          {
            maxSkew           = 1
            topologyKey       = "kubernetes.io/hostname"
            whenUnsatisfiable = "DoNotSchedule"
            labelSelector     = { matchLabels = { "k8s-app" = "kube-dns" } }
          },
          {
            maxSkew           = 1
            topologyKey       = "topology.kubernetes.io/zone"
            whenUnsatisfiable = "ScheduleAnyway"
            labelSelector     = { matchLabels = { "k8s-app" = "kube-dns" } }
          },
        ]
      })
    }
    kube-proxy = {}
    vpc-cni = {
      before_compute = true
      # t4g.medium 기본 max-pods 17 한계 해소 — 코어 노드 1대 결정의 전제
      configuration_values = jsonencode({
        env = { ENABLE_PREFIX_DELEGATION = "true" }
        # NetworkPolicy 적용 활성화 — 꺼져 있으면 정책을 만들어도 무효 (스펙 §5 기본 거부)
        enableNetworkPolicy = "true"
      })
    }
    aws-ebs-csi-driver = {
      service_account_role_arn = aws_iam_role.ebs_csi.arn
    }

    # HPA가 CPU 사용률을 읽는 곳. 기본 replicas 2는 코어 노드 1대의 예약 여유에 들어가지 않는다.
    # Spot에 두면 회수 때 HPA가 잠시 판단을 못 하므로 코어 노드에 고정한다.
    metrics-server = {
      addon_version = "v0.9.0-eksbuild.11"
      configuration_values = jsonencode({
        replicas            = 1
        podDisruptionBudget = { enabled = false }
        resources = {
          requests = { cpu = "50m", memory = "100Mi" }
          limits   = { memory = "200Mi" }
        }
        affinity = {
          nodeAffinity = {
            requiredDuringSchedulingIgnoredDuringExecution = {
              nodeSelectorTerms = [{
                matchExpressions = [{ key = "karpenter.sh/nodepool", operator = "DoesNotExist" }]
              }]
            }
          }
        }
      })
    }
  }

  eks_managed_node_groups = {
    core = {
      # 플랫폼 컴포넌트 전용 (스펙 §인프라) — 앱/CI는 Karpenter Spot
      ami_type       = "AL2023_ARM_64_STANDARD"
      instance_types = [var.core_instance_type]
      # Jenkins·Prometheus PV(EBS)와 같은 AZ에만 뜨게 한다 — 다른 AZ에 뜨면 Pod가 Pending (ARCHITECTURE §12)
      subnet_ids = var.core_subnet_ids

      min_size     = 0 # 출시 전 비용 절감용으로 0대까지 허용 (scripts/infra-power.sh) — 평소 desired는 1
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

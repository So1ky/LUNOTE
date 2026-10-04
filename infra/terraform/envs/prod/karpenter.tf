# Karpenter의 AWS측 리소스 — 컨트롤러 IRSA 정책/롤, 노드 IAM 롤(+access entry),
# Spot 중단 2분 경고용 SQS 큐 + EventBridge 룰. 차트 설치는 infra/k8s/platform/karpenter/ (CLI).
module "karpenter" {
  source  = "terraform-aws-modules/eks/aws//modules/karpenter"
  version = "~> 21.0"

  cluster_name = module.eks.cluster_name

  # 체크리스트 2-2: IRSA 방식. 서브모듈 v21은 Pod Identity 신뢰 문만 내장하므로
  # 같은 sid의 문을 덮어써 신뢰 정책을 IRSA 전용으로 만든다.
  iam_role_override_assume_policy_documents = [data.aws_iam_policy_document.karpenter_irsa_assume.json]
  create_pod_identity_association           = false

  # 컨트롤러 정책이 관리형 정책 한도(6,144자)를 초과 — 인라인(한도 10,240자)으로 부착
  enable_inline_policy = true

  # 이름 고정 — values.yaml/EC2NodeClass에 결정적 참조
  iam_role_name                 = "lunote-karpenter-controller"
  iam_role_use_name_prefix      = false
  node_iam_role_name            = "lunote-karpenter-node"
  node_iam_role_use_name_prefix = false
}

data "aws_iam_policy_document" "karpenter_irsa_assume" {
  statement {
    sid     = "PodIdentity" # 서브모듈 내장 문과 sid를 맞춰야 override가 교체로 동작한다
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [module.eks.oidc_provider_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "${module.eks.oidc_provider}:sub"
      values   = ["system:serviceaccount:karpenter:karpenter"]
    }

    condition {
      test     = "StringEquals"
      variable = "${module.eks.oidc_provider}:aud"
      values   = ["sts.amazonaws.com"]
    }
  }
}

# 계정에서 Spot을 처음 쓸 때 필요한 서비스 연결 역할 — 없으면 Karpenter의 Spot 요청이
# AuthFailure.ServiceLinkedRoleCreationNotPermitted로 실패한다 (컨트롤러에 생성 권한을 주지 않고 여기서 만든다).
resource "aws_iam_service_linked_role" "spot" {
  aws_service_name = "spot.amazonaws.com"
}

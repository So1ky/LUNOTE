# External Secrets Operator가 환경별 SecretStore로 Secrets Manager를 읽을 때 쓰는 IRSA 롤.
# 환경별로 롤을 나눠 staging 네임스페이스에서는 prod 시크릿을 읽을 수 없게 한다 (스펙 §2·§5).
# ESO 컨트롤러 SA에는 롤을 주지 않는다 — 각 환경 네임스페이스의 SA(eso-reader)만 신뢰한다.
locals {
  eso_envs = toset(["staging", "prod"])
}

data "aws_iam_policy_document" "eso_assume" {
  for_each = local.eso_envs

  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [module.eks.oidc_provider_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "${module.eks.oidc_provider}:sub"
      values   = ["system:serviceaccount:${each.key}:eso-reader"]
    }

    condition {
      test     = "StringEquals"
      variable = "${module.eks.oidc_provider}:aud"
      values   = ["sts.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "eso_read" {
  for_each = local.eso_envs

  statement {
    actions = ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"]
    resources = concat(
      ["arn:aws:secretsmanager:ap-northeast-2:${data.aws_caller_identity.current.account_id}:secret:lunote/${each.key}/*"],
      # ElastiCache는 prod 전용 — staging은 클러스터 내 Redis를 쓴다 (ARCHITECTURE §12)
      each.key == "prod" ? [aws_secretsmanager_secret.redis.arn] : [],
    )
  }
}

resource "aws_iam_role" "eso" {
  for_each = local.eso_envs

  name               = "lunote-eso-${each.key}"
  assume_role_policy = data.aws_iam_policy_document.eso_assume[each.key].json
}

resource "aws_iam_role_policy" "eso_read" {
  for_each = local.eso_envs

  name   = "secrets-read"
  role   = aws_iam_role.eso[each.key].id
  policy = data.aws_iam_policy_document.eso_read[each.key].json
}

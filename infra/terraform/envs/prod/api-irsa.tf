# API 파드가 첨부 버킷에 presigned URL을 서명할 때 쓰는 IRSA 롤 — 환경별 분리.
# 각 환경 네임스페이스의 SA(api)만 신뢰하고 자기 환경 버킷의 객체 Put/Get/Delete와 uploads/ 목록만 허용한다.
locals {
  api_buckets = {
    staging = module.attachments_staging.arn
    prod    = module.attachments_prod.arn
  }
}

data "aws_iam_policy_document" "api_assume" {
  for_each = local.api_buckets

  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [module.eks.oidc_provider_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "${module.eks.oidc_provider}:sub"
      values   = ["system:serviceaccount:${each.key}:api"]
    }

    condition {
      test     = "StringEquals"
      variable = "${module.eks.oidc_provider}:aud"
      values   = ["sts.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "api_s3" {
  for_each = local.api_buckets

  statement {
    actions   = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"]
    resources = ["${each.value}/*"]
  }

  # 탈퇴 사용자 파일 정리(uploads/<userId>/ 일괄 삭제)용 — 목록은 uploads/ 아래로 한정
  statement {
    actions   = ["s3:ListBucket"]
    resources = [each.value]

    condition {
      test     = "StringLike"
      variable = "s3:prefix"
      values   = ["uploads/*"]
    }
  }
}

resource "aws_iam_role" "api" {
  for_each = local.api_buckets

  name               = "lunote-api-${each.key}"
  assume_role_policy = data.aws_iam_policy_document.api_assume[each.key].json
}

resource "aws_iam_role_policy" "api_s3" {
  for_each = local.api_buckets

  name   = "attachments"
  role   = aws_iam_role.api[each.key].id
  policy = data.aws_iam_policy_document.api_s3[each.key].json
}

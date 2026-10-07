# 관측성 스택(Plan 8)용 AWS 리소스 — 시크릿 그릇 4개, Loki·Tempo 버킷, IRSA 롤 5개.
# 값은 CLI로만 주입한다(git/state에 평문 없음). 컨트롤러(ESO·Grafana·Loki·Tempo)마다 자기 것만 읽는 롤을 준다.

# ---- 시크릿 그릇 ----
resource "aws_secretsmanager_secret" "grafana" {
  name = "lunote/shared/grafana" # admin-password
}

resource "aws_secretsmanager_secret" "grafana_db" {
  name = "lunote/shared/grafana-db" # username, password — RDS 읽기 전용 사용자 grafana_ro (psql로 생성)
}

resource "aws_secretsmanager_secret" "alertmanager" {
  name = "lunote/shared/alertmanager" # webhook-url — 디스코드 채널 웹훅
}

resource "aws_secretsmanager_secret" "tailscale" {
  name = "lunote/shared/tailscale" # client_id, client_secret — Operator OAuth 클라이언트(tag:k8s-operator)
}

# ---- 로그·트레이스 버킷 (보존은 Loki 14일·Tempo 7일이 지우고, 만료 규칙은 안전망) ----
module "loki" {
  source          = "../../modules/s3"
  bucket_name     = "lunote-loki-${data.aws_caller_identity.current.account_id}"
  expiration_days = 15
}

module "tempo" {
  source          = "../../modules/s3"
  bucket_name     = "lunote-tempo-${data.aws_caller_identity.current.account_id}"
  expiration_days = 8
}

# ---- IRSA 신뢰 정책 (SA 하나 = 롤 하나) ----
locals {
  observability_subjects = {
    loki           = "system:serviceaccount:monitoring:loki"
    tempo          = "system:serviceaccount:monitoring:tempo"
    grafana        = "system:serviceaccount:monitoring:kube-prometheus-stack-grafana"
    eso-monitoring = "system:serviceaccount:monitoring:eso-reader"
    eso-tailscale  = "system:serviceaccount:tailscale:eso-reader"
  }
}

data "aws_iam_policy_document" "observability_assume" {
  for_each = local.observability_subjects

  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [module.eks.oidc_provider_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "${module.eks.oidc_provider}:sub"
      values   = [each.value]
    }

    condition {
      test     = "StringEquals"
      variable = "${module.eks.oidc_provider}:aud"
      values   = ["sts.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "observability" {
  for_each = local.observability_subjects

  name               = "lunote-${each.key}"
  assume_role_policy = data.aws_iam_policy_document.observability_assume[each.key].json
}

# ---- 권한: Loki·Tempo는 자기 버킷만 ----
data "aws_iam_policy_document" "bucket_rw" {
  for_each = { loki = module.loki.arn, tempo = module.tempo.arn }

  statement {
    actions   = ["s3:ListBucket"]
    resources = [each.value]
  }

  statement {
    actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
    resources = ["${each.value}/*"]
  }
}

resource "aws_iam_role_policy" "bucket_rw" {
  for_each = data.aws_iam_policy_document.bucket_rw

  name   = "bucket-rw"
  role   = aws_iam_role.observability[each.key].id
  policy = each.value.json
}

# ---- 권한: Grafana는 CloudWatch 지표 읽기 + 메타데이터 조회만 (RDS 대시보드·알림) ----
data "aws_iam_policy_document" "grafana_cloudwatch" {
  statement {
    actions = [
      "cloudwatch:ListMetrics",
      "cloudwatch:GetMetricData",
      "cloudwatch:GetMetricStatistics",
      "cloudwatch:DescribeAlarms",
      "ec2:DescribeRegions",
      "tag:GetResources",
      # Grafana CloudWatch 데이터소스 상태 검사·화면이 호출 — 로그 그룹 이름·교차 계정 목록만, 로그 내용은 못 읽는다
      "logs:DescribeLogGroups",
      "oam:ListSinks",
      "oam:ListAttachedLinks",
    ]
    resources = ["*"] # 읽기 전용 조회 API — 리소스 지정 불가
  }
}

resource "aws_iam_role_policy" "grafana_cloudwatch" {
  name   = "cloudwatch-read"
  role   = aws_iam_role.observability["grafana"].id
  policy = data.aws_iam_policy_document.grafana_cloudwatch.json
}

# ---- 권한: ESO — 네임스페이스마다 읽을 시크릿만 ----
data "aws_iam_policy_document" "eso_monitoring_read" {
  statement {
    actions = ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"]
    resources = [
      aws_secretsmanager_secret.grafana.arn,
      aws_secretsmanager_secret.grafana_db.arn,
      aws_secretsmanager_secret.alertmanager.arn,
    ]
  }
}

resource "aws_iam_role_policy" "eso_monitoring_read" {
  name   = "secrets-read"
  role   = aws_iam_role.observability["eso-monitoring"].id
  policy = data.aws_iam_policy_document.eso_monitoring_read.json
}

data "aws_iam_policy_document" "eso_tailscale_read" {
  statement {
    actions   = ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"]
    resources = [aws_secretsmanager_secret.tailscale.arn]
  }
}

resource "aws_iam_role_policy" "eso_tailscale_read" {
  name   = "secrets-read"
  role   = aws_iam_role.observability["eso-tailscale"].id
  policy = data.aws_iam_policy_document.eso_tailscale_read.json
}

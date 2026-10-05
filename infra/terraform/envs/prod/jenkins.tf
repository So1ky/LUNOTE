# Jenkins(CI)용 AWS 리소스 — 시크릿 그릇과 IRSA 롤 2개.
# 컨트롤러에는 AWS 권한을 주지 않는다. ESO가 시크릿을 읽고, 빌드 에이전트 Pod만 ECR에 push한다.

# 값(admin-password, deploy-key, webhook-secret)은 CLI로만 주입한다 — git/state에 평문을 남기지 않기 위함.
resource "aws_secretsmanager_secret" "jenkins" {
  name = "lunote/shared/jenkins"
}

locals {
  jenkins_subjects = {
    eso   = "system:serviceaccount:jenkins:eso-reader"
    agent = "system:serviceaccount:jenkins:jenkins-agent"
  }
}

data "aws_iam_policy_document" "jenkins_assume" {
  for_each = local.jenkins_subjects

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

# ESO — jenkins 네임스페이스에서는 이 시크릿 하나만 읽을 수 있다 (staging/prod 시크릿 접근 불가)
data "aws_iam_policy_document" "jenkins_eso_read" {
  statement {
    actions   = ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"]
    resources = [aws_secretsmanager_secret.jenkins.arn]
  }
}

resource "aws_iam_role" "jenkins_eso" {
  name               = "lunote-eso-jenkins"
  assume_role_policy = data.aws_iam_policy_document.jenkins_assume["eso"].json
}

resource "aws_iam_role_policy" "jenkins_eso_read" {
  name   = "secrets-read"
  role   = aws_iam_role.jenkins_eso.id
  policy = data.aws_iam_policy_document.jenkins_eso_read.json
}

# 빌드 에이전트 — lunote/api 저장소에 이미지 push만
data "aws_iam_policy_document" "jenkins_agent_ecr" {
  statement {
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"] # 계정 단위 API라 리소스 지정 불가
  }

  statement {
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:BatchGetImage",
      "ecr:CompleteLayerUpload",
      "ecr:DescribeImages",
      "ecr:GetDownloadUrlForLayer",
      "ecr:InitiateLayerUpload",
      "ecr:PutImage",
      "ecr:UploadLayerPart",
    ]
    resources = [module.ecr.repository_arn]
  }
}

resource "aws_iam_role" "jenkins_agent" {
  name               = "lunote-jenkins-agent"
  assume_role_policy = data.aws_iam_policy_document.jenkins_assume["agent"].json
}

resource "aws_iam_role_policy" "jenkins_agent_ecr" {
  name   = "ecr-push"
  role   = aws_iam_role.jenkins_agent.id
  policy = data.aws_iam_policy_document.jenkins_agent_ecr.json
}

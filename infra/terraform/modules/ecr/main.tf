resource "aws_ecr_repository" "this" {
  name = var.repository_name

  # git SHA 태그 불변성을 레지스트리에서 강제 (latest 금지 규칙과 합치)
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

# 스펙 §데이터: untagged 즉시 삭제(최소 단위 1일), 태그 이미지 최근 30개 유지
resource "aws_ecr_lifecycle_policy" "this" {
  repository = aws_ecr_repository.this.name
  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "expire untagged after 1 day"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 1
        }
        action = { type = "expire" }
      },
      {
        rulePriority = 2
        description  = "keep last 30 tagged images"
        selection = {
          tagStatus      = "tagged"
          tagPatternList = ["*"]
          countType      = "imageCountMoreThan"
          countNumber    = 30
        }
        action = { type = "expire" }
      }
    ]
  })
}

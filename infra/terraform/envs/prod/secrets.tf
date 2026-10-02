# 환경별 앱 시크릿 (DATABASE_URL, 추후 JWT/PortOne/OAuth 키도 같은 시크릿에 키 추가).
# 리소스(그릇)만 Terraform으로 만들고 값은 CLI로만 주입한다 — git/state에 평문을 남기지 않기 위함.
# DB·앱 계정 자체는 AWS 리소스가 아니라 psql로 생성 (Plan 2 결정 표).
resource "aws_secretsmanager_secret" "app_staging" {
  name = "lunote/staging/app"
}

resource "aws_secretsmanager_secret" "app_prod" {
  name = "lunote/prod/app"
}

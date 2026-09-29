# ElastiCache AUTH 토큰 제약: 특수문자 제한적 — 영숫자만 사용
resource "random_password" "redis_auth" {
  length  = 40
  special = false
}

module "redis" {
  source     = "../../modules/elasticache"
  name       = "lunote"
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids

  # Task 6에서 aws_security_group.bastion.id 추가 예정
  ingress_security_group_ids = [aws_security_group.app.id]
  auth_token                 = random_password.redis_auth.result
}

# staging/prod 공용 — 환경 분리는 논리 DB 번호 + BullMQ prefix (스펙 §데이터).
# ESO(Phase 3-3)가 환경별 ExternalSecret 템플릿에서 DB 번호를 붙인다 (예: prod=/0, staging=/1).
resource "aws_secretsmanager_secret" "redis" {
  name = "lunote/shared/redis"
}

resource "aws_secretsmanager_secret_version" "redis" {
  secret_id = aws_secretsmanager_secret.redis.id
  secret_string = jsonencode({
    REDIS_URL = "rediss://default:${random_password.redis_auth.result}@${module.redis.endpoint}:6379"
  })
}

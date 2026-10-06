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

  ingress_security_group_ids = { app = aws_security_group.app.id, bastion = aws_security_group.bastion.id }
  auth_token                 = random_password.redis_auth.result
}

# prod 전용 (2026-10-06 — staging은 클러스터 내 Redis). 이름의 shared는 생성 당시의 것이다.
# prod ExternalSecret 템플릿이 논리 DB 번호 /0을 붙인다.
resource "aws_secretsmanager_secret" "redis" {
  name = "lunote/shared/redis"
}

resource "aws_secretsmanager_secret_version" "redis" {
  secret_id = aws_secretsmanager_secret.redis.id
  secret_string = jsonencode({
    REDIS_URL = "rediss://default:${random_password.redis_auth.result}@${module.redis.endpoint}:6379"
  })
}

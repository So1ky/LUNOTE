resource "aws_elasticache_subnet_group" "this" {
  name       = var.name
  subnet_ids = var.subnet_ids
}

resource "aws_security_group" "this" {
  name        = "${var.name}-redis"
  description = "ElastiCache Redis - SG-referenced ingress only"
  vpc_id      = var.vpc_id

  tags = { Name = "${var.name}-redis" }
}

resource "aws_vpc_security_group_ingress_rule" "redis" {
  for_each = toset(var.ingress_security_group_ids)

  security_group_id            = aws_security_group.this.id
  referenced_security_group_id = each.value
  from_port                    = 6379
  to_port                      = 6379
  ip_protocol                  = "tcp"
}

# 단일 노드 (2026-09-22 SPOF 검토: Redis는 단일 유지 — 유실 시 BullMQ 잡 재생성 가능).
# replication_group을 쓰는 이유: 이후 노드 추가/failover 전환이 재생성 없이 가능.
resource "aws_elasticache_replication_group" "this" {
  replication_group_id = var.name
  description          = "${var.name} redis (BullMQ + cache)"

  engine               = "redis"
  engine_version       = var.engine_version
  parameter_group_name = "default.redis7"
  node_type            = var.node_type
  num_cache_clusters   = 1

  automatic_failover_enabled = false
  multi_az_enabled           = false

  # 스펙 §보안 "전 구간 TLS" — 앱은 rediss:// 스킴으로 접속
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = var.auth_token

  port               = 6379
  subnet_group_name  = aws_elasticache_subnet_group.this.name
  security_group_ids = [aws_security_group.this.id]

  snapshot_retention_limit = 1
  snapshot_window          = "17:30-18:30"         # KST 02:30-03:30
  maintenance_window       = "sun:19:30-sun:20:30" # KST 월요일 04:30-05:30
}

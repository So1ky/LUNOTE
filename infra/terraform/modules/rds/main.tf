resource "aws_db_subnet_group" "this" {
  name       = var.name
  subnet_ids = var.subnet_ids
}

resource "aws_security_group" "this" {
  name        = "${var.name}-rds"
  description = "RDS PostgreSQL - SG-referenced ingress only"
  vpc_id      = var.vpc_id

  tags = { Name = "${var.name}-rds" }
}

resource "aws_vpc_security_group_ingress_rule" "postgres" {
  for_each = var.ingress_security_group_ids

  security_group_id            = aws_security_group.this.id
  referenced_security_group_id = each.value
  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
}

resource "aws_db_instance" "this" {
  identifier     = var.name
  engine         = "postgres"
  engine_version = var.engine_version
  instance_class = var.instance_class

  multi_az          = var.multi_az
  storage_encrypted = true # AWS 관리형 aws/rds 키 — CMK 불채택 근거는 Plan 2 결정 표

  # 1인 운영 — 변경을 유지보수 윈도까지 미루지 않는다 (provider측 플래그, drift 없음)
  apply_immediately = true

  allocated_storage     = 20
  max_allocated_storage = 50
  storage_type          = "gp3"

  # 마스터 비밀번호는 RDS 관리형 Secrets Manager 시크릿 — state/코드에 평문 없음
  username                    = "lunote_admin"
  manage_master_user_password = true

  db_subnet_group_name   = aws_db_subnet_group.this.name
  vpc_security_group_ids = [aws_security_group.this.id]
  publicly_accessible    = false

  # 자동 백업 활성화 = PITR 5분 단위 (스펙 §데이터: PITR 5분)
  backup_retention_period = 7
  backup_window           = "17:30-18:30"         # KST 02:30-03:30
  maintenance_window      = "sun:18:30-sun:19:30" # KST 월요일 03:30-04:30

  auto_minor_version_upgrade = true
  deletion_protection        = true
  skip_final_snapshot        = false
  final_snapshot_identifier  = "${var.name}-final"
}

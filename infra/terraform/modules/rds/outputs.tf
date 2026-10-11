output "endpoint" {
  value = aws_db_instance.this.address
}

output "port" {
  value = aws_db_instance.this.port
}

output "security_group_id" {
  value = aws_security_group.this.id
}

output "master_user_secret_arn" {
  description = "RDS 관리형 마스터 비밀번호 시크릿 (Phase 3-2에서 psql 접속에 사용)"
  value       = aws_db_instance.this.master_user_secret[0].secret_arn
}

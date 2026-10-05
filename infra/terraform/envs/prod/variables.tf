variable "enable_bastion" {
  description = "SSM 바스천 인스턴스 생성 — RDS/Redis 검증·운영 접속 시에만 true (기본 꺼짐, SG/IAM은 상시 유지)"
  type        = bool
  default     = false
}

variable "enable_nat_gateway" {
  description = "NAT Gateway — 노드를 전부 내린 동안에만 false (scripts/infra-power.sh sleep). 노드가 있으면 반드시 true"
  type        = bool
  default     = true
}

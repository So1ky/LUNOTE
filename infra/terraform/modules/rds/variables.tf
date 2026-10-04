variable "name" {
  description = "리소스 접두사 (identifier, SG 이름)"
  type        = string
}

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  description = "프라이빗 서브넷 — DB 서브넷 그룹"
  type        = list(string)
}

variable "ingress_security_group_ids" {
  description = "인그레스를 허용할 SG 맵 (정적 키 → SG id, SG 참조 방식만 — CIDR 금지)"
  type        = map(string)
}

variable "instance_class" {
  type    = string
  default = "db.t4g.micro"
}

variable "engine_version" {
  description = "메이저만 지정 — auto_minor_version_upgrade와 drift 없이 공존"
  type        = string
  default     = "17"
}

variable "multi_az" {
  description = "가용성 방침은 ARCHITECTURE.md §12 — 전환은 온라인 속성 변경"
  type        = bool
  default     = true
}

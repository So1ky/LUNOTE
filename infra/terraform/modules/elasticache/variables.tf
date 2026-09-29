variable "name" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "ingress_security_group_ids" {
  description = "인그레스를 허용할 SG 맵 (정적 키 → SG id, SG 참조 방식만 — CIDR 금지)"
  type        = map(string)
}

variable "auth_token" {
  type      = string
  sensitive = true
}

variable "node_type" {
  type    = string
  default = "cache.t4g.micro"
}

variable "engine_version" {
  type    = string
  default = "7.1"
}

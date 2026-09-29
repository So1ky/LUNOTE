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
  description = "6379 인그레스를 허용할 SG 목록 (SG 참조 방식만)"
  type        = list(string)
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

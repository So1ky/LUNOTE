variable "name" {
  description = "클러스터명 (karpenter.sh/discovery 태그 값으로도 사용)"
  type        = string
}

variable "kubernetes_version" {
  description = "실행 시점 standard support 최신으로 고정 (extended support 요금 회피)"
  type        = string
}

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  description = "프라이빗 서브넷 — 노드 배치"
  type        = list(string)
}

variable "core_subnet_ids" {
  description = "코어 노드그룹 서브넷 — PV(EBS)가 한 AZ에 묶이므로 그 AZ의 서브넷 하나만 준다"
  type        = list(string)
}

variable "core_instance_type" {
  type    = string
  default = "t4g.medium"
}

variable "core_desired_size" {
  description = "코어 노드 수 — SPOF 프레임상 1로 시작, Phase 3-3에서 증설 검토"
  type        = number
  default     = 1
}

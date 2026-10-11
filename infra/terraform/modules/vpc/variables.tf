variable "name" {
  description = "VPC 이름 (리소스 접두어)"
  type        = string
  default     = "lunote"
}

variable "cluster_name" {
  description = "EKS 클러스터명 — Karpenter 서브넷 디스커버리 태그에 사용"
  type        = string
  default     = "lunote"
}

variable "enable_nat_gateway" {
  description = "NAT Gateway 활성화 — 노드 없는 구축 기간엔 false로 꺼서 비용 절약 (재생성 시 IP 변경됨)"
  type        = bool
  default     = true
}

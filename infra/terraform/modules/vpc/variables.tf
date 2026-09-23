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

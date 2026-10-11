variable "bucket_name" {
  type = string
}

variable "cors_allowed_origins" {
  description = "presigned URL을 브라우저에서 쓰는 오리진 (admin-web). 비면 CORS 미설정"
  type        = list(string)
  default     = []
}

variable "expiration_days" {
  description = "객체 만료 일수. null이면 만료 규칙 없음 (Loki·Tempo처럼 보존 기간이 있는 버킷의 안전망)"
  type        = number
  default     = null
}

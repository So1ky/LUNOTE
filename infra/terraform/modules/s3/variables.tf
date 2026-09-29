variable "bucket_name" {
  type = string
}

variable "cors_allowed_origins" {
  description = "presigned URL을 브라우저에서 쓰는 오리진 (admin-web). 비면 CORS 미설정"
  type        = list(string)
  default     = []
}

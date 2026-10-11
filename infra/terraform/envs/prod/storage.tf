# 첨부 버킷은 staging/prod 분리 — IRSA 환경별 롤이 버킷 단위로 격리됨 (스펙 §시크릿)
module "attachments_staging" {
  source               = "../../modules/s3"
  bucket_name          = "lunote-attachments-staging-${data.aws_caller_identity.current.account_id}"
  cors_allowed_origins = ["http://localhost:5173"]
}

module "attachments_prod" {
  source               = "../../modules/s3"
  bucket_name          = "lunote-attachments-prod-${data.aws_caller_identity.current.account_id}"
  cors_allowed_origins = ["https://admin.lunoteapp.com"]
}

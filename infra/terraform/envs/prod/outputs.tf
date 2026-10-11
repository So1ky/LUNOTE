output "vpc_id" {
  value = module.vpc.vpc_id
}

output "eks_cluster_name" {
  value = module.eks.cluster_name
}

output "eks_oidc_provider" {
  value = module.eks.oidc_provider
}

output "eks_oidc_provider_arn" {
  value = module.eks.oidc_provider_arn
}

output "karpenter_controller_role_arn" {
  value = module.karpenter.iam_role_arn
}

output "karpenter_node_role_name" {
  value = module.karpenter.node_iam_role_name
}

output "karpenter_queue_name" {
  value = module.karpenter.queue_name
}

output "private_subnet_ids" {
  value = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
  value = module.vpc.public_subnet_ids
}

output "rds_endpoint" {
  value = module.rds.endpoint
}

output "rds_master_secret_arn" {
  value = module.rds.master_user_secret_arn
}

output "redis_endpoint" {
  value = module.redis.endpoint
}

output "ecr_repository_url" {
  value = module.ecr.repository_url
}

output "attachment_buckets" {
  value = {
    staging = module.attachments_staging.bucket
    prod    = module.attachments_prod.bucket
  }
}

output "bastion_instance_id" {
  value = one(aws_instance.bastion[*].id)
}

output "eso_role_arns" {
  value = { for env, role in aws_iam_role.eso : env => role.arn }
}

output "api_role_arns" {
  value = { for env, role in aws_iam_role.api : env => role.arn }
}

output "api_certificate_arn" {
  value = aws_acm_certificate_validation.api.certificate_arn
}

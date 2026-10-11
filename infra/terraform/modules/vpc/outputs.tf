output "vpc_id" {
  value = module.vpc.vpc_id
}

output "vpc_cidr" {
  value = module.vpc.vpc_cidr_block
}

output "public_subnet_ids" {
  value = module.vpc.public_subnets
}

output "private_subnet_ids" {
  value = module.vpc.private_subnets
}

output "private_subnet_ids_by_az" {
  description = "AZ 이름 → 프라이빗 서브넷 ID (특정 AZ에 고정해야 하는 리소스용)"
  value       = zipmap(module.vpc.azs, module.vpc.private_subnets)
}

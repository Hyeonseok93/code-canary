output "environment" {
  description = "Active deployment environment."
  value       = var.environment
}

output "name_prefix" {
  description = "Shared resource name prefix for this environment."
  value       = local.name_prefix
}

output "aws_region" {
  description = "AWS region for this environment."
  value       = var.aws_region
}

output "vpc_id" {
  value = module.network.vpc_id
}

output "alb_dns_name" {
  description = "Application URL (HTTP)."
  value       = module.alb.alb_dns_name
}

output "ecs_cluster_name" {
  value = module.ecs.cluster_name
}

output "rds_endpoint" {
  value = module.data.db_endpoint
}

output "redis_endpoint" {
  value = module.data.redis_endpoint
}

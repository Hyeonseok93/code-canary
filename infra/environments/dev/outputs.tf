output "environment" {
  description = "Active deployment environment."
  value       = var.environment
}

output "name_prefix" {
  description = "Shared resource name prefix."
  value       = local.name_prefix
}

output "aws_region" {
  description = "AWS region."
  value       = var.aws_region
}

output "vpc_id" {
  description = "VPC identifier."
  value       = module.network.vpc_id
}

output "alb_dns_name" {
  description = "Application URL (HTTP or HTTPS depending on enable_https)."
  value       = module.alb.alb_dns_name
}

output "ecs_cluster_name" {
  description = "ECS cluster name."
  value       = module.ecs.cluster_name
}

output "ecs_backend_service_name" {
  description = "Backend ECS service name."
  value       = module.ecs.backend_service_name
}

output "ecs_worker_service_name" {
  description = "Worker ECS service name."
  value       = module.ecs.worker_service_name
}

output "ecs_frontend_service_name" {
  description = "Frontend ECS service name."
  value       = module.ecs.frontend_service_name
}

output "rds_endpoint" {
  description = "RDS hostname."
  value       = module.data.db_endpoint
}

output "redis_endpoint" {
  description = "Redis hostname."
  value       = module.data.redis_endpoint
}

output "ecs_log_group_name" {
  description = "CloudWatch log group for ECS tasks."
  value       = module.ecs.log_group_name
}

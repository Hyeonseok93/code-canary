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
  description = "Application load balancer DNS name."
  value       = module.alb.alb_dns_name
}

output "app_url" {
  description = "Primary application URL (custom domain, CloudFront, or ALB)."
  value = var.enable_cloudfront ? (
    var.domain_name != null ? "https://${var.domain_name}" : "https://${module.cloudfront[0].domain_name}"
    ) : (
    var.enable_https && var.domain_name != null ? "https://${var.domain_name}" : "http://${module.alb.alb_dns_name}"
  )
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain (when enable_cloudfront is true)."
  value       = var.enable_cloudfront ? module.cloudfront[0].domain_name : null
}

output "route53_zone_id" {
  description = "Route53 hosted zone ID when DNS is managed."
  value       = local.route53_zone_id
}

output "acm_certificate_arn" {
  description = "Regional ACM certificate ARN when HTTPS is enabled."
  value       = local.acm_certificate_arn
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

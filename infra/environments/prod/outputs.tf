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

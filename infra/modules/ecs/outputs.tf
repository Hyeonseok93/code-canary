output "cluster_name" {
  description = "ECS cluster name."
  value       = aws_ecs_cluster.this.name
}

output "cluster_arn" {
  description = "ECS cluster ARN."
  value       = aws_ecs_cluster.this.arn
}

output "backend_service_name" {
  description = "Backend ECS service name."
  value       = aws_ecs_service.backend.name
}

output "worker_service_name" {
  description = "Worker ECS service name."
  value       = aws_ecs_service.worker.name
}

output "frontend_service_name" {
  description = "Frontend ECS service name."
  value       = aws_ecs_service.frontend.name
}

output "backend_task_definition_arn" {
  description = "Initial backend task definition ARN."
  value       = aws_ecs_task_definition.backend.arn
}

output "worker_task_definition_arn" {
  description = "Initial worker task definition ARN."
  value       = aws_ecs_task_definition.worker.arn
}

output "frontend_task_definition_arn" {
  description = "Initial frontend task definition ARN."
  value       = aws_ecs_task_definition.frontend.arn
}

output "log_group_name" {
  description = "CloudWatch log group for ECS tasks."
  value       = aws_cloudwatch_log_group.this.name
}

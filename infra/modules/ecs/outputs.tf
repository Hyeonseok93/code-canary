output "cluster_name" {
  value = aws_ecs_cluster.this.name
}

output "cluster_arn" {
  value = aws_ecs_cluster.this.arn
}

output "backend_service_name" {
  value = aws_ecs_service.backend.name
}

output "worker_service_name" {
  value = aws_ecs_service.worker.name
}

output "frontend_service_name" {
  value = aws_ecs_service.frontend.name
}

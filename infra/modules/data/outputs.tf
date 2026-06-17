output "db_endpoint" {
  description = "RDS hostname."
  value       = aws_db_instance.postgres.address
}

output "db_port" {
  description = "RDS port."
  value       = aws_db_instance.postgres.port
}

output "db_name" {
  description = "PostgreSQL database name."
  value       = var.db_name
}

output "db_username" {
  description = "PostgreSQL master username."
  value       = var.db_username
}

output "redis_endpoint" {
  description = "Redis hostname."
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
}

output "redis_port" {
  description = "Redis port."
  value       = aws_elasticache_cluster.redis.port
}

output "db_password_secret_arn" {
  description = "Secrets Manager ARN for the database password."
  value       = aws_secretsmanager_secret.db_password.arn
}

output "redis_password_secret_arn" {
  description = "Secrets Manager ARN for the Redis password."
  value       = aws_secretsmanager_secret.redis_password.arn
}

output "jwt_secret_arn" {
  description = "Secrets Manager ARN for the JWT signing secret."
  value       = aws_secretsmanager_secret.jwt_secret.arn
}

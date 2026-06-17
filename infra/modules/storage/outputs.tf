output "file_system_arn" {
  description = "EFS file system ARN."
  value       = aws_efs_file_system.pipeline.arn
}

output "access_point_arn" {
  description = "EFS access point ARN."
  value       = aws_efs_access_point.pipeline.arn
}

output "file_system_id" {
  description = "EFS file system ID."
  value       = aws_efs_file_system.pipeline.id
}

output "access_point_id" {
  description = "EFS access point for /pipeline root."
  value       = aws_efs_access_point.pipeline.id
}

output "security_group_id" {
  description = "EFS security group ID."
  value       = aws_security_group.efs.id
}

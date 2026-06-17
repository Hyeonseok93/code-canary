output "vpc_id" {
  description = "VPC identifier."
  value       = aws_vpc.this.id
}

output "public_subnet_ids" {
  description = "Public subnet identifiers."
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet identifiers."
  value       = aws_subnet.private[*].id
}

output "alb_security_group_id" {
  description = "Security group for the application load balancer."
  value       = aws_security_group.alb.id
}

output "ecs_security_group_id" {
  description = "Security group for ECS tasks."
  value       = aws_security_group.ecs.id
}

output "data_security_group_id" {
  description = "Security group for RDS and Redis."
  value       = aws_security_group.data.id
}

output "nat_gateway_id" {
  description = "NAT gateway identifier when enable_nat_gateway is true."
  value       = try(aws_nat_gateway.this[0].id, null)
}

output "alb_arn" {
  description = "Application load balancer ARN."
  value       = aws_lb.this.arn
}

output "alb_dns_name" {
  description = "Public DNS name of the application load balancer."
  value       = aws_lb.this.dns_name
}

output "backend_target_group_arn" {
  description = "Backend target group ARN."
  value       = aws_lb_target_group.backend.arn
}

output "frontend_target_group_arn" {
  description = "Frontend target group ARN."
  value       = aws_lb_target_group.frontend.arn
}

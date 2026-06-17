output "zone_id" {
  description = "Route53 hosted zone ID."
  value       = local.zone_id
}

output "certificate_arn" {
  description = "Validated ACM certificate ARN."
  value       = aws_acm_certificate_validation.this.certificate_arn
}

output "domain_name" {
  description = "Primary domain name."
  value       = var.domain_name
}

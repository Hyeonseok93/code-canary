variable "project_name" {
  description = "Project name used in resource naming and tags."
  type        = string
  default     = "codecanary"
}

variable "environment" {
  description = "Deployment environment."
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod."
  }
}

variable "aws_region" {
  description = "AWS region."
  type        = string
  default     = "ap-northeast-2"
}

variable "vpc_cidr" {
  description = "VPC CIDR block."
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "Public subnet CIDR blocks."
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "Private subnet CIDR blocks."
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

variable "enable_nat_gateway" {
  description = "Place ECS in private subnets with NAT egress (recommended for staging/prod)."
  type        = bool
  default     = false
}

variable "ecr_registry" {
  description = "ECR registry host without trailing slash."
  type        = string
}

variable "image_tag" {
  description = "Initial container image tag for the first ECS task definition."
  type        = string
  default     = "latest"
}

variable "db_name" {
  description = "PostgreSQL database name."
  type        = string
  default     = "code_canary"
}

variable "db_username" {
  description = "PostgreSQL master username."
  type        = string
  default     = "postgres"
}

variable "db_instance_class" {
  description = "RDS instance class."
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GiB."
  type        = number
  default     = 20
}

variable "db_multi_az" {
  description = "Enable Multi-AZ for RDS."
  type        = bool
  default     = false
}

variable "db_backup_retention_days" {
  description = "RDS backup retention in days."
  type        = number
  default     = 7
}

variable "db_skip_final_snapshot" {
  description = "Skip final snapshot when destroying RDS."
  type        = bool
  default     = true
}

variable "db_deletion_protection" {
  description = "Enable RDS deletion protection."
  type        = bool
  default     = false
}

variable "db_storage_encrypted" {
  description = "Encrypt RDS storage at rest."
  type        = bool
  default     = true
}

variable "redis_node_type" {
  description = "ElastiCache node type."
  type        = string
  default     = "cache.t3.micro"
}

variable "alb_enable_deletion_protection" {
  description = "Enable ALB deletion protection."
  type        = bool
  default     = false
}

variable "enable_https" {
  description = "Enable HTTPS on the ALB (requires acm_certificate_arn or domain_name)."
  type        = bool
  default     = false
}

variable "acm_certificate_arn" {
  description = "Existing ACM certificate ARN for ALB HTTPS (regional). Ignored when domain_name is set."
  type        = string
  default     = null
}

variable "domain_name" {
  description = "Custom domain for Route53 + automatic regional ACM when enable_https is true."
  type        = string
  default     = null
}

variable "domain_subject_alternative_names" {
  description = "Extra names on the ACM certificate (e.g. www.example.com)."
  type        = list(string)
  default     = []
}

variable "create_route53_zone" {
  description = "Create a Route53 hosted zone for domain_name."
  type        = bool
  default     = false
}

variable "route53_zone_id" {
  description = "Existing Route53 zone ID when create_route53_zone is false."
  type        = string
  default     = null
}

variable "enable_waf" {
  description = "Enable AWS WAF (on ALB, or on CloudFront when enable_cloudfront is true)."
  type        = bool
  default     = false
}

variable "enable_cloudfront" {
  description = "Place CloudFront in front of the ALB."
  type        = bool
  default     = false
}

variable "cloudfront_price_class" {
  description = "CloudFront price class."
  type        = string
  default     = "PriceClass_200"
}

variable "enable_pipeline_efs" {
  description = "Provision EFS for worker/backend pipeline staging at /data."
  type        = bool
  default     = true
}

variable "trusted_proxy_cidrs" {
  description = "Override trusted proxy CIDRs for backend rate limiting (defaults to vpc_cidr)."
  type        = string
  default     = null
}

variable "ecs_assign_public_ip" {
  description = "Assign public IPs to ECS tasks when NAT is disabled (dev only)."
  type        = bool
  default     = true
}

variable "ecs_desired_count" {
  description = "Desired task count per ECS service."
  type        = number
  default     = 1
}

variable "ecs_enable_container_insights" {
  description = "Enable ECS Container Insights."
  type        = bool
  default     = false
}

variable "ecs_log_retention_in_days" {
  description = "CloudWatch log retention for ECS tasks."
  type        = number
  default     = 7
}

variable "jwt_cookie_secure" {
  description = "Set secure flag on JWT cookies. Automatically true when enable_https or enable_cloudfront is true."
  type        = bool
  default     = false
}

variable "backend_cpu" {
  type    = number
  default = 512
}

variable "backend_memory" {
  type    = number
  default = 1024
}

variable "worker_cpu" {
  type    = number
  default = 256
}

variable "worker_memory" {
  type    = number
  default = 512
}

variable "frontend_cpu" {
  type    = number
  default = 256
}

variable "frontend_memory" {
  type    = number
  default = 512
}

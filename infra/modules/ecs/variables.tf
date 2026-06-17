variable "name_prefix" {
  description = "Resource name prefix (e.g. codecanary-dev)."
  type        = string
}

variable "aws_region" {
  description = "AWS region for CloudWatch Logs."
  type        = string
}

variable "vpc_id" {
  description = "VPC identifier (reserved for future extensions such as EFS)."
  type        = string
}

variable "subnet_ids" {
  description = "Subnets for ECS tasks (public in dev, private when NAT is enabled)."
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group attached to ECS tasks."
  type        = string
}

variable "ecr_registry" {
  description = "ECR registry host without trailing slash."
  type        = string
}

variable "image_tag" {
  description = "Container image tag applied on initial task definition creation."
  type        = string
  default     = "latest"
}

variable "db_host" {
  type = string
}

variable "db_port" {
  type = number
}

variable "db_name" {
  type = string
}

variable "db_username" {
  type = string
}

variable "redis_host" {
  type = string
}

variable "redis_port" {
  type = number
}

variable "db_password_secret_arn" {
  type = string
}

variable "redis_password_secret_arn" {
  type = string
}

variable "jwt_secret_arn" {
  type = string
}

variable "backend_target_group_arn" {
  type = string
}

variable "frontend_target_group_arn" {
  type = string
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

variable "desired_count" {
  description = "Desired task count for each ECS service."
  type        = number
  default     = 1
}

variable "assign_public_ip" {
  description = "Assign a public IP to Fargate tasks (dev without NAT gateway)."
  type        = bool
  default     = true
}

variable "jwt_cookie_secure" {
  description = "Set JWT_COOKIE_SECURE for the backend container."
  type        = bool
  default     = false
}

variable "enable_container_insights" {
  description = "Enable ECS Container Insights on the cluster."
  type        = bool
  default     = false
}

variable "log_retention_in_days" {
  description = "CloudWatch Logs retention for ECS tasks."
  type        = number
  default     = 7
}

variable "tags" {
  description = "Common tags applied to all resources in this module."
  type        = map(string)
  default     = {}
}

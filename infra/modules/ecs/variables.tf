variable "name_prefix" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  description = "Subnets for ECS tasks (public in dev)."
  type        = list(string)
}

variable "security_group_id" {
  type = string
}

variable "ecr_registry" {
  description = "ECR registry host without trailing slash (e.g. 123456789012.dkr.ecr.ap-northeast-2.amazonaws.com)."
  type        = string
}

variable "image_tag" {
  type    = string
  default = "latest"
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

variable "assign_public_ip" {
  description = "Assign public IP to tasks (dev without NAT)."
  type        = bool
  default     = true
}

variable "project_name" {
  description = "Resource name prefix (e.g. codecanary-dev-ecs)."
  type        = string
  default     = "codecanary"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)."
  type        = string
}

variable "aws_region" {
  description = "AWS region."
  type        = string
  default     = "ap-northeast-2"
}

variable "use_fakecloud" {
  description = "Route AWS API calls to a local fakecloud/LocalStack-compatible endpoint."
  type        = bool
  default     = false
}

variable "fakecloud_endpoint" {
  description = "Base URL for fakecloud when use_fakecloud is true."
  type        = string
  default     = "http://localhost:4566"
}

variable "vpc_cidr" {
  description = "VPC CIDR for this environment."
  type        = string
  default     = "10.0.0.0/16"
}

variable "ecr_registry" {
  description = "ECR registry host (no trailing slash). fakecloud: 123456789012.dkr.ecr.ap-northeast-2.amazonaws.com"
  type        = string
}

variable "image_tag" {
  description = "Container image tag from Phase 2 deploy."
  type        = string
  default     = "latest"
}

variable "db_name" {
  type    = string
  default = "code_canary"
}

variable "db_username" {
  type    = string
  default = "postgres"
}

variable "db_instance_class" {
  type    = string
  default = "db.t3.micro"
}

variable "redis_node_type" {
  type    = string
  default = "cache.t3.micro"
}

variable "ecs_assign_public_ip" {
  description = "Assign public IP to Fargate tasks (dev without NAT gateway)."
  type        = bool
  default     = true
}

variable "project_name" {
  description = "Resource name prefix (e.g. codecanary-prod-ecs)."
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

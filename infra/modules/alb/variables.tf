variable "name_prefix" {
  description = "Resource name prefix (e.g. codecanary-dev)."
  type        = string
}

variable "vpc_id" {
  description = "VPC for target groups."
  type        = string
}

variable "subnet_ids" {
  description = "Public subnets for the ALB."
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group attached to the ALB."
  type        = string
}

variable "backend_target_port" {
  description = "Container port for the backend target group."
  type        = number
  default     = 8080
}

variable "frontend_target_port" {
  description = "Container port for the frontend target group."
  type        = number
  default     = 8080
}

variable "enable_deletion_protection" {
  description = "Enable ALB deletion protection."
  type        = bool
  default     = false
}

variable "enable_https" {
  description = "Enable HTTPS listener and HTTP to HTTPS redirect."
  type        = bool
  default     = false
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for HTTPS. Required when enable_https is true."
  type        = string
  default     = null
}

variable "tags" {
  description = "Common tags applied to all resources in this module."
  type        = map(string)
  default     = {}
}

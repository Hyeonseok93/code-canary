variable "name_prefix" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  description = "Public subnets for the ALB."
  type        = list(string)
}

variable "security_group_id" {
  type = string
}

variable "backend_target_port" {
  type    = number
  default = 8080
}

variable "frontend_target_port" {
  type    = number
  default = 8080
}

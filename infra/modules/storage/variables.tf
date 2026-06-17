variable "name_prefix" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  description = "Private subnets for EFS mount targets (one per AZ)."
  type        = list(string)
}

variable "ecs_security_group_id" {
  description = "ECS tasks security group allowed to mount EFS."
  type        = string
}

variable "posix_uid" {
  description = "POSIX UID for pipeline files (matches worker/backend container user)."
  type        = number
  default     = 10001
}

variable "posix_gid" {
  type    = number
  default = 10001
}

variable "transition_to_ia" {
  description = "EFS lifecycle transition (AFTER_30_DAYS or null to disable)."
  type        = string
  default     = "AFTER_30_DAYS"
}

variable "tags" {
  type    = map(string)
  default = {}
}

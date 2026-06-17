variable "name_prefix" {
  description = "Resource name prefix (e.g. codecanary-dev)."
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnets for RDS and Redis."
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group for RDS and Redis."
  type        = string
}

variable "db_name" {
  description = "Initial PostgreSQL database name."
  type        = string
  default     = "code_canary"
}

variable "db_username" {
  description = "Master username for PostgreSQL."
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
  description = "RDS backup retention in days (0 disables automated backups)."
  type        = number
  default     = 7
}

variable "db_skip_final_snapshot" {
  description = "Skip a final snapshot when the RDS instance is destroyed."
  type        = bool
  default     = true
}

variable "db_deletion_protection" {
  description = "Enable deletion protection on RDS."
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

variable "tags" {
  description = "Common tags applied to all resources in this module."
  type        = map(string)
  default     = {}
}

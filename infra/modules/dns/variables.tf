variable "name_prefix" {
  description = "Resource name prefix."
  type        = string
}

variable "domain_name" {
  description = "Primary domain name for the ACM certificate."
  type        = string
}

variable "subject_alternative_names" {
  description = "Additional domain names on the ACM certificate."
  type        = list(string)
  default     = []
}

variable "create_route53_zone" {
  description = "Create a new Route53 hosted zone for domain_name."
  type        = bool
  default     = false
}

variable "route53_zone_id" {
  description = "Existing Route53 hosted zone ID when create_route53_zone is false."
  type        = string
  default     = null
}

variable "tags" {
  description = "Tags applied to created resources."
  type        = map(string)
  default     = {}
}

variable "name_prefix" {
  description = "Resource name prefix."
  type        = string
}

variable "scope" {
  description = "WAF scope: REGIONAL (ALB) or CLOUDFRONT."
  type        = string
  default     = "REGIONAL"

  validation {
    condition     = contains(["REGIONAL", "CLOUDFRONT"], var.scope)
    error_message = "scope must be REGIONAL or CLOUDFRONT."
  }
}

variable "alb_arn" {
  description = "ALB ARN to associate when scope is REGIONAL."
  type        = string
  default     = null
}

variable "operator_cidrs" {
  description = "Comma-separated operator CIDRs. When set, blocks /roost, /api/auth/login, and /api/admin from other IPs."
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags applied to created resources."
  type        = map(string)
  default     = {}
}

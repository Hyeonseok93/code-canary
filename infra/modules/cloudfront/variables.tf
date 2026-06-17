variable "name_prefix" {
  description = "Resource name prefix."
  type        = string
}

variable "origin_domain_name" {
  description = "Origin hostname (typically the ALB DNS name)."
  type        = string
}

variable "origin_use_https" {
  description = "Use HTTPS when CloudFront connects to the origin."
  type        = bool
  default     = false
}

variable "aliases" {
  description = "Custom domain aliases (requires acm_certificate_arn in us-east-1)."
  type        = list(string)
  default     = []
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN in us-east-1 for custom domain aliases."
  type        = string
  default     = null
}

variable "web_acl_id" {
  description = "Optional global WAF web ACL ID (CLOUDFRONT scope)."
  type        = string
  default     = null
}

variable "price_class" {
  description = "CloudFront price class."
  type        = string
  default     = "PriceClass_200"
}

variable "tags" {
  description = "Tags applied to created resources."
  type        = map(string)
  default     = {}
}

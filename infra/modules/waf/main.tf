locals {
  tags = merge(var.tags, {
    Module = "waf"
  })

  operator_cidrs = compact([
    for cidr in split(",", var.operator_cidrs) : trimspace(cidr)
    if trimspace(cidr) != ""
  ])

  operator_ip_restriction_enabled = length(local.operator_cidrs) > 0
}

resource "aws_wafv2_ip_set" "operator" {
  count = local.operator_ip_restriction_enabled ? 1 : 0

  name               = "${var.name_prefix}-operator-ips"
  description        = "Operator allowlist for admin console paths"
  scope              = var.scope
  ip_address_version = "IPV4"
  addresses          = local.operator_cidrs

  tags = merge(local.tags, {
    Name = "${var.name_prefix}-operator-ips"
  })
}

resource "aws_wafv2_web_acl" "this" {
  name        = "${var.name_prefix}-waf"
  description = "WAF for ${var.name_prefix}"
  scope       = var.scope

  default_action {
    allow {}
  }

  dynamic "rule" {
    for_each = local.operator_ip_restriction_enabled ? [1] : []
    content {
      name     = "BlockSensitivePathsFromNonOperators"
      priority = 0

      action {
        block {}
      }

      statement {
        and_statement {
          statement {
            not_statement {
              statement {
                ip_set_reference_statement {
                  arn = aws_wafv2_ip_set.operator[0].arn
                }
              }
            }
          }

          statement {
            or_statement {
              statement {
                byte_match_statement {
                  field_to_match {
                    uri_path {}
                  }
                  positional_constraint = "STARTS_WITH"
                  search_string         = "/roost"
                  text_transformation {
                    priority = 0
                    type     = "LOWERCASE"
                  }
                }
              }

              statement {
                byte_match_statement {
                  field_to_match {
                    uri_path {}
                  }
                  positional_constraint = "EXACTLY"
                  search_string         = "/api/auth/login"
                  text_transformation {
                    priority = 0
                    type     = "LOWERCASE"
                  }
                }
              }

              statement {
                byte_match_statement {
                  field_to_match {
                    uri_path {}
                  }
                  positional_constraint = "STARTS_WITH"
                  search_string         = "/api/admin"
                  text_transformation {
                    priority = 0
                    type     = "LOWERCASE"
                  }
                }
              }
            }
          }
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "${var.name_prefix}-operator-ip"
        sampled_requests_enabled   = true
      }
    }
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 10

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.name_prefix}-common"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 20

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.name_prefix}-bad-inputs"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.name_prefix}-waf"
    sampled_requests_enabled   = true
  }

  tags = merge(local.tags, {
    Name = "${var.name_prefix}-waf"
  })
}

resource "aws_wafv2_web_acl_association" "alb" {
  count = var.scope == "REGIONAL" && var.alb_arn != null ? 1 : 0

  resource_arn = var.alb_arn
  web_acl_arn  = aws_wafv2_web_acl.this.arn
}

locals {
  tags = merge(var.tags, {
    Module = "cloudfront"
  })

  use_custom_domain = length(var.aliases) > 0 && var.acm_certificate_arn != null

  origin_request_headers = [
    "Accept",
    "Accept-Language",
    "Authorization",
    "Content-Type",
    "Host",
    "Origin",
    "Referer",
    "X-Requested-With",
    "X-XSRF-TOKEN",
  ]
}

resource "aws_cloudfront_distribution" "this" {
  enabled         = true
  is_ipv6_enabled = true
  comment         = "${var.name_prefix} CDN"
  price_class     = var.price_class
  aliases         = local.use_custom_domain ? var.aliases : []
  web_acl_id      = var.web_acl_id

  origin {
    domain_name = var.origin_domain_name
    origin_id   = "alb"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = var.origin_use_https ? "https-only" : "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "alb"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = true
      headers      = local.origin_request_headers

      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  ordered_cache_behavior {
    path_pattern           = "/api/*"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "alb"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = true
      headers      = local.origin_request_headers

      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  dynamic "viewer_certificate" {
    for_each = local.use_custom_domain ? [1] : []
    content {
      acm_certificate_arn      = var.acm_certificate_arn
      ssl_support_method       = "sni-only"
      minimum_protocol_version = "TLSv1.2_2021"
    }
  }

  dynamic "viewer_certificate" {
    for_each = local.use_custom_domain ? [] : [1]
    content {
      cloudfront_default_certificate = true
    }
  }

  tags = merge(local.tags, {
    Name = "${var.name_prefix}-cdn"
  })
}

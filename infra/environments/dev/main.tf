locals {
  name_prefix = "${var.project_name}-${var.environment}"

  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  ecs_subnet_ids       = var.enable_nat_gateway ? module.network.private_subnet_ids : module.network.public_subnet_ids
  ecs_assign_public_ip = var.enable_nat_gateway ? false : var.ecs_assign_public_ip

  manage_dns_tls = var.enable_https && var.domain_name != null

  use_secure_cookies = var.enable_https || var.enable_cloudfront

  acm_certificate_arn = var.enable_https ? (
    local.manage_dns_tls ? module.dns[0].certificate_arn : var.acm_certificate_arn
  ) : null

  jwt_cookie_secure = local.use_secure_cookies ? true : var.jwt_cookie_secure

  route53_zone_id = local.manage_dns_tls ? module.dns[0].zone_id : var.route53_zone_id

  trusted_proxy_cidrs = coalesce(var.trusted_proxy_cidrs, var.vpc_cidr)
}

check "https_requires_certificate" {
  assert {
    condition     = !var.enable_https || local.acm_certificate_arn != null
    error_message = "When enable_https is true, set domain_name (automatic ACM) or acm_certificate_arn."
  }
}

check "managed_dns_requires_zone" {
  assert {
    condition     = !local.manage_dns_tls || var.create_route53_zone || var.route53_zone_id != null
    error_message = "Set create_route53_zone = true or provide route53_zone_id when using domain_name."
  }
}

check "cloudfront_with_domain_requires_zone" {
  assert {
    condition     = !var.enable_cloudfront || var.domain_name == null || local.route53_zone_id != null
    error_message = "Provide route53_zone_id or enable HTTPS with domain_name when CloudFront uses a custom domain."
  }
}

module "network" {
  source = "../../modules/network"

  name_prefix          = local.name_prefix
  vpc_cidr             = var.vpc_cidr
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  enable_nat_gateway   = var.enable_nat_gateway
  tags                 = local.common_tags
}

module "data" {
  source = "../../modules/data"

  name_prefix              = local.name_prefix
  private_subnet_ids       = module.network.private_subnet_ids
  security_group_id        = module.network.data_security_group_id
  db_name                  = var.db_name
  db_username              = var.db_username
  db_instance_class        = var.db_instance_class
  db_allocated_storage     = var.db_allocated_storage
  db_multi_az              = var.db_multi_az
  db_backup_retention_days = var.db_backup_retention_days
  db_skip_final_snapshot   = var.db_skip_final_snapshot
  db_deletion_protection   = var.db_deletion_protection
  db_storage_encrypted     = var.db_storage_encrypted
  redis_node_type          = var.redis_node_type
  tags                     = local.common_tags
}

module "dns" {
  count  = local.manage_dns_tls ? 1 : 0
  source = "../../modules/dns"

  name_prefix               = local.name_prefix
  domain_name               = var.domain_name
  subject_alternative_names = var.domain_subject_alternative_names
  create_route53_zone       = var.create_route53_zone
  route53_zone_id           = var.route53_zone_id
  tags                      = local.common_tags
}

module "alb" {
  source = "../../modules/alb"

  name_prefix                = local.name_prefix
  vpc_id                     = module.network.vpc_id
  subnet_ids                 = module.network.public_subnet_ids
  security_group_id          = module.network.alb_security_group_id
  enable_deletion_protection = var.alb_enable_deletion_protection
  enable_https               = var.enable_https
  acm_certificate_arn        = local.acm_certificate_arn
  tags                       = local.common_tags
}

module "waf" {
  count  = var.enable_waf && !var.enable_cloudfront ? 1 : 0
  source = "../../modules/waf"

  name_prefix    = local.name_prefix
  scope          = "REGIONAL"
  alb_arn        = module.alb.alb_arn
  operator_cidrs = var.frontend_operator_cidrs
  tags           = local.common_tags
}

module "dns_cloudfront_cert" {
  count  = var.enable_cloudfront && var.domain_name != null ? 1 : 0
  source = "../../modules/dns"

  providers = {
    aws = aws.us_east_1
  }

  name_prefix               = "${local.name_prefix}-cf"
  domain_name               = var.domain_name
  subject_alternative_names = var.domain_subject_alternative_names
  create_route53_zone       = false
  route53_zone_id           = local.route53_zone_id
  tags                      = local.common_tags
}

module "waf_cloudfront" {
  count  = var.enable_waf && var.enable_cloudfront ? 1 : 0
  source = "../../modules/waf"

  providers = {
    aws = aws.us_east_1
  }

  name_prefix    = "${local.name_prefix}-cf"
  scope          = "CLOUDFRONT"
  operator_cidrs = var.frontend_operator_cidrs
  tags           = local.common_tags
}

module "cloudfront" {
  count  = var.enable_cloudfront ? 1 : 0
  source = "../../modules/cloudfront"

  name_prefix         = local.name_prefix
  origin_domain_name  = module.alb.alb_dns_name
  origin_use_https    = var.enable_https
  aliases             = var.domain_name != null ? concat([var.domain_name], var.domain_subject_alternative_names) : []
  acm_certificate_arn = var.domain_name != null ? module.dns_cloudfront_cert[0].certificate_arn : null
  web_acl_id          = var.enable_waf ? module.waf_cloudfront[0].web_acl_arn : null
  price_class         = var.cloudfront_price_class
  tags                = local.common_tags

  depends_on = [module.alb]
}

resource "aws_route53_record" "app" {
  count = local.manage_dns_tls ? 1 : 0

  zone_id = local.route53_zone_id
  name    = var.domain_name
  type    = "A"

  dynamic "alias" {
    for_each = var.enable_cloudfront ? [1] : []
    content {
      name                   = module.cloudfront[0].domain_name
      zone_id                = module.cloudfront[0].hosted_zone_id
      evaluate_target_health = false
    }
  }

  dynamic "alias" {
    for_each = var.enable_cloudfront ? [] : [1]
    content {
      name                   = module.alb.alb_dns_name
      zone_id                = module.alb.alb_zone_id
      evaluate_target_health = true
    }
  }
}

module "storage" {
  count  = var.enable_pipeline_efs ? 1 : 0
  source = "../../modules/storage"

  name_prefix           = local.name_prefix
  vpc_id                = module.network.vpc_id
  subnet_ids            = module.network.private_subnet_ids
  ecs_security_group_id = module.network.ecs_security_group_id
  tags                  = local.common_tags
}

module "ecs" {
  source = "../../modules/ecs"

  name_prefix = local.name_prefix
  aws_region  = var.aws_region
  vpc_id      = module.network.vpc_id

  subnet_ids        = local.ecs_subnet_ids
  security_group_id = module.network.ecs_security_group_id

  ecr_registry = var.ecr_registry
  image_tag    = var.image_tag

  db_host     = module.data.db_endpoint
  db_port     = module.data.db_port
  db_name     = module.data.db_name
  db_username = module.data.db_username

  redis_host = module.data.redis_endpoint
  redis_port = module.data.redis_port

  db_password_secret_arn    = module.data.db_password_secret_arn
  redis_password_secret_arn = module.data.redis_password_secret_arn
  jwt_secret_arn            = module.data.jwt_secret_arn

  frontend_target_group_arn = module.alb.frontend_target_group_arn

  assign_public_ip          = local.ecs_assign_public_ip
  desired_count             = var.ecs_desired_count
  jwt_cookie_secure         = local.jwt_cookie_secure
  frontend_hsts_enabled     = local.use_secure_cookies
  frontend_operator_cidrs   = var.frontend_operator_cidrs
  trusted_proxy_cidrs       = local.trusted_proxy_cidrs
  efs_file_system_id        = var.enable_pipeline_efs ? module.storage[0].file_system_id : null
  efs_access_point_id       = var.enable_pipeline_efs ? module.storage[0].access_point_id : null
  efs_file_system_arn       = var.enable_pipeline_efs ? module.storage[0].file_system_arn : null
  efs_access_point_arn      = var.enable_pipeline_efs ? module.storage[0].access_point_arn : null
  enable_container_insights = var.ecs_enable_container_insights
  log_retention_in_days     = var.ecs_log_retention_in_days

  backend_cpu     = var.backend_cpu
  backend_memory  = var.backend_memory
  worker_cpu      = var.worker_cpu
  worker_memory   = var.worker_memory
  frontend_cpu    = var.frontend_cpu
  frontend_memory = var.frontend_memory

  tags = local.common_tags

  depends_on = [module.alb, module.data, module.storage]
}

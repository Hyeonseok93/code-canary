locals {
  name_prefix = "${var.project_name}-${var.environment}"

  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  ecs_subnet_ids       = var.enable_nat_gateway ? module.network.private_subnet_ids : module.network.public_subnet_ids
  ecs_assign_public_ip = var.enable_nat_gateway ? false : var.ecs_assign_public_ip
}

check "https_requires_certificate" {
  assert {
    condition     = !var.enable_https || var.acm_certificate_arn != null
    error_message = "Set acm_certificate_arn when enable_https is true."
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

module "alb" {
  source = "../../modules/alb"

  name_prefix                = local.name_prefix
  vpc_id                     = module.network.vpc_id
  subnet_ids                 = module.network.public_subnet_ids
  security_group_id          = module.network.alb_security_group_id
  enable_deletion_protection = var.alb_enable_deletion_protection
  enable_https               = var.enable_https
  acm_certificate_arn        = var.acm_certificate_arn
  tags                       = local.common_tags
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

  backend_target_group_arn  = module.alb.backend_target_group_arn
  frontend_target_group_arn = module.alb.frontend_target_group_arn

  assign_public_ip          = local.ecs_assign_public_ip
  desired_count             = var.ecs_desired_count
  jwt_cookie_secure         = var.jwt_cookie_secure
  enable_container_insights = var.ecs_enable_container_insights
  log_retention_in_days     = var.ecs_log_retention_in_days

  backend_cpu     = var.backend_cpu
  backend_memory  = var.backend_memory
  worker_cpu      = var.worker_cpu
  worker_memory   = var.worker_memory
  frontend_cpu    = var.frontend_cpu
  frontend_memory = var.frontend_memory

  tags = local.common_tags

  depends_on = [module.alb, module.data]
}

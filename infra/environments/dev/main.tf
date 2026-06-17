locals {
  name_prefix = "${var.project_name}-${var.environment}"
}

module "network" {
  source = "../../modules/network"

  name_prefix = local.name_prefix
  vpc_cidr    = var.vpc_cidr
}

module "data" {
  source = "../../modules/data"

  name_prefix        = local.name_prefix
  private_subnet_ids = module.network.private_subnet_ids
  security_group_id  = module.network.data_security_group_id
  db_name            = var.db_name
  db_username        = var.db_username
  db_instance_class  = var.db_instance_class
  redis_node_type    = var.redis_node_type
}

module "alb" {
  source = "../../modules/alb"

  name_prefix       = local.name_prefix
  vpc_id            = module.network.vpc_id
  subnet_ids        = module.network.public_subnet_ids
  security_group_id = module.network.alb_security_group_id
}

module "ecs" {
  source = "../../modules/ecs"

  name_prefix = local.name_prefix
  aws_region  = var.aws_region

  vpc_id            = module.network.vpc_id
  subnet_ids        = module.network.public_subnet_ids
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

  assign_public_ip = var.ecs_assign_public_ip

  depends_on = [module.alb]
}

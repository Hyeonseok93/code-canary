environment  = "prod"
aws_region   = "ap-northeast-2"
project_name = "codecanary"

ecr_registry = "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com"
image_tag    = "latest"

vpc_cidr             = "10.2.0.0/16"
public_subnet_cidrs  = ["10.2.1.0/24", "10.2.2.0/24"]
private_subnet_cidrs = ["10.2.11.0/24", "10.2.12.0/24"]
enable_nat_gateway   = true

db_instance_class        = "db.t3.medium"
db_allocated_storage     = 50
db_multi_az              = true
db_backup_retention_days = 14
db_skip_final_snapshot   = false
db_deletion_protection   = true

redis_node_type = "cache.t3.small"

alb_enable_deletion_protection = true
enable_https                   = false
# acm_certificate_arn = "arn:aws:acm:ap-northeast-2:123456789012:certificate/..."

ecs_desired_count             = 2
ecs_enable_container_insights = true
ecs_log_retention_in_days     = 30
jwt_cookie_secure             = false

backend_cpu     = 1024
backend_memory  = 2048
worker_cpu      = 512
worker_memory   = 1024
frontend_cpu    = 512
frontend_memory = 1024

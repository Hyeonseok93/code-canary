environment  = "staging"
aws_region   = "ap-northeast-2"
project_name = "codecanary"

ecr_registry = "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com"
image_tag    = "latest"

vpc_cidr             = "10.1.0.0/16"
public_subnet_cidrs  = ["10.1.1.0/24", "10.1.2.0/24"]
private_subnet_cidrs = ["10.1.11.0/24", "10.1.12.0/24"]
enable_nat_gateway   = true

db_instance_class        = "db.t3.small"
db_allocated_storage     = 20
db_multi_az              = false
db_backup_retention_days = 7
db_skip_final_snapshot   = false
db_deletion_protection   = false

redis_node_type = "cache.t3.small"

alb_enable_deletion_protection = false
enable_https                   = false

# --- HTTPS / DNS / edge (staging) ---
# domain_name                      = "staging.example.com"
# create_route53_zone              = false
# route53_zone_id                  = "Z1234567890ABC"
# enable_https                     = true
# enable_waf                       = true
# enable_cloudfront                = false

# Operator IP allowlist (staging/prod — required for go-live)
# frontend_operator_cidrs = "203.0.113.0/24"

ecs_desired_count             = 1
ecs_enable_container_insights = true
ecs_log_retention_in_days     = 14

backend_cpu     = 512
backend_memory  = 1024
worker_cpu      = 256
worker_memory   = 512
frontend_cpu    = 256
frontend_memory = 512

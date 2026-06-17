environment  = "dev"
aws_region   = "ap-northeast-2"
project_name = "codecanary"

# Replace 123456789012 with your AWS account ID (aws sts get-caller-identity).
ecr_registry = "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com"
image_tag    = "latest"

vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24"]
enable_nat_gateway   = false
ecs_assign_public_ip = true

db_instance_class        = "db.t3.micro"
db_allocated_storage     = 20
db_multi_az              = false
db_backup_retention_days = 1
db_skip_final_snapshot   = true
db_deletion_protection   = false

redis_node_type = "cache.t3.micro"

alb_enable_deletion_protection = false
enable_https                   = false
# jwt_cookie_secure / NGINX HSTS follow enable_https or enable_cloudfront automatically.

# enable_pipeline_efs = true  # EFS mount at /data for worker + backend (default: true)

# --- HTTPS / DNS / edge (optional; keep off for one-day dev test) ---
# domain_name                    = "app.example.com"
# domain_subject_alternative_names = ["www.example.com"]
# create_route53_zone            = true
# route53_zone_id                = "Z1234567890ABC"
# enable_waf                       = false
# enable_cloudfront                = false
# acm_certificate_arn            = "arn:aws:acm:ap-northeast-2:123456789012:certificate/..."

ecs_desired_count             = 1
ecs_enable_container_insights = false
ecs_log_retention_in_days     = 7

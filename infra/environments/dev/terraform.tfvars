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

ecs_desired_count             = 1
ecs_enable_container_insights = false
ecs_log_retention_in_days     = 7
jwt_cookie_secure             = false

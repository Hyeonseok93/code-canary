environment        = "dev"
use_fakecloud      = true
fakecloud_endpoint = "http://localhost:4566"
aws_region         = "ap-northeast-2"
project_name       = "codecanary"

# ECR images from Phase 2 deploy (fakecloud account id is often 123456789012)
ecr_registry = "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com"
image_tag    = "latest"

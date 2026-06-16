provider "aws" {
  region = var.aws_region

  access_key = var.use_fakecloud ? "test" : null
  secret_key = var.use_fakecloud ? "test" : null

  skip_credentials_validation = var.use_fakecloud
  skip_metadata_api_check     = var.use_fakecloud
  skip_requesting_account_id  = var.use_fakecloud

  dynamic "endpoints" {
    for_each = var.use_fakecloud ? [var.fakecloud_endpoint] : []
    content {
      apigateway     = endpoints.value
      dynamodb       = endpoints.value
      ec2            = endpoints.value
      ecr            = endpoints.value
      ecs            = endpoints.value
      elasticache    = endpoints.value
      elbv2          = endpoints.value
      iam            = endpoints.value
      rds            = endpoints.value
      s3             = endpoints.value
      secretsmanager = endpoints.value
      sts            = endpoints.value
    }
  }
}

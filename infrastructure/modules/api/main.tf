resource "aws_appsync_graphql_api" "main" {
  name                = "${var.project_name}-api-${var.environment}"
  authentication_type = "AMAZON_COGNITO_USER_POOLS"

  user_pool_config {
    user_pool_id   = var.user_pool_id
    aws_region     = var.aws_region
    default_action = "ALLOW"
  }

  schema = file("${path.root}/../backend/schema.graphql")

  additional_authentication_provider {
    authentication_type = "AWS_IAM"
  }

  log_config {
    cloudwatch_logs_role_arn = aws_iam_role.appsync_logs.arn
    field_log_level          = "ERROR"
  }
}

resource "aws_appsync_api_key" "example" {
  api_id  = aws_appsync_graphql_api.main.id
  expires = timeadd(timestamp(), "365d") # 1 Year expiry
}

resource "aws_iam_role" "appsync_logs" {
  name = "${var.project_name}-appsync-logs-${var.environment}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "appsync.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "appsync_logs" {
  role       = aws_iam_role.appsync_logs.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSAppSyncPushToCloudWatchLogs"
}

resource "aws_wafv2_web_acl_association" "main" {
  resource_arn = aws_appsync_graphql_api.main.arn
  web_acl_arn  = var.waf_acl_arn
}

output "api_url" {
  value = aws_appsync_graphql_api.main.uris["GRAPHQL"]
}

output "api_id" {
  value = aws_appsync_graphql_api.main.id
}

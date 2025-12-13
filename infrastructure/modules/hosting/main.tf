resource "aws_amplify_app" "frontend" {
  name       = "${var.project_name}-${var.environment}"
  repository = var.repository_url

  # GitHub Access Token (Should be a secret)
  access_token = var.github_token

  # Build settings
  build_spec = <<-EOT
    version: 1
    frontend:
      phases:
        preBuild:
          commands:
            - cd frontend
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: frontend/dist
        files:
          - '**/*'
      cache:
        paths:
          - frontend/node_modules/**/*
  EOT

  # Environment Variables for the Frontend
  environment_variables = {
    ENV                      = var.environment
    VITE_API_URL             = var.api_url
    VITE_USER_POOL_ID        = var.user_pool_id
    VITE_USER_POOL_CLIENT_ID = var.user_pool_client_id
    VITE_REGION              = var.aws_region
  }

  enable_auto_branch_creation = true
  enable_branch_auto_build    = true
  enable_branch_auto_deletion = true

  tags = {
    Name = "${var.project_name}-hosting-${var.environment}"
  }
}

resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.frontend.id
  branch_name = "main"

  enable_auto_build = true
  stage             = var.environment == "prod" ? "PRODUCTION" : "DEVELOPMENT"
  
  framework = "React"
}

output "default_domain" {
  value = aws_amplify_app.frontend.default_domain
}

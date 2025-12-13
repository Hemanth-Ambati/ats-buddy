module "bootstrap" {
  source = "./modules/bootstrap"

  project_name = var.project_name
  environment  = var.environment
}

module "auth" {
  source = "./modules/auth"

  project_name         = var.project_name
  environment          = var.environment
  enable_google_auth   = true
  google_client_id     = var.google_client_id
  google_client_secret = var.google_client_secret
}

module "storage" {
  source = "./modules/storage"

  project_name = var.project_name
  environment  = var.environment
}

module "api" {
  source = "./modules/api"

  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region
  user_pool_id = module.auth.user_pool_id
}

module "hosting" {
  source = "./modules/hosting"

  project_name        = var.project_name
  environment         = var.environment
  aws_region          = var.aws_region
  repository_url      = var.repo_url
  github_token        = var.github_token
  api_url             = module.api.api_url
  user_pool_id        = module.auth.user_pool_id
  user_pool_client_id = module.auth.user_pool_client_id
}

module "functions" {
  source = "./modules/functions"

  project_name   = var.project_name
  environment    = var.environment
  gemini_api_key = var.gemini_api_key
  user_pool_arn  = module.auth.user_pool_arn
}

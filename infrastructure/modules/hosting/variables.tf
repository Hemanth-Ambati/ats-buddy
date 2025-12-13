variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "repository_url" {
  type = string
}

variable "github_token" {
  type      = string
  sensitive = true
}

variable "api_url" {
  type = string
}

variable "user_pool_id" {
  type = string
}

variable "user_pool_client_id" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "identity_pool_id" {
  type        = string
  description = "Cognito Identity Pool ID"
}

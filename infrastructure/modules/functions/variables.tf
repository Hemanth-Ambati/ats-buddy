variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "gemini_api_key" {
  type      = string
  sensitive = true
}

variable "user_pool_arn" {
  type        = string
  description = "ARN of the User Pool to allow invocation"
}

# Add IAM policy variables if needed later

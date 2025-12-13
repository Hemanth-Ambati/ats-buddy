variable "aws_region" {
  description = "AWS Region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment Name (dev, prod)"
  type        = string
}

variable "project_name" {
  description = "Project Name"
  type        = string
  default     = "ats-buddy"
}

variable "repo_url" {
  description = "GitHub Repository URL"
  type        = string
}

variable "github_token" {
  description = "GitHub Access Token"
  type        = string
  sensitive   = true
}

variable "gemini_api_key" {
  description = "Google Gemini API Key"
  type        = string
  sensitive   = true
}

variable "google_client_id" {
  description = "Google OAuth Client ID"
  type        = string
  default     = ""
}

variable "google_client_secret" {
  description = "Google OAuth Client Secret"
  type        = string
  default     = ""
  sensitive   = true
}

variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "callback_urls" {
  type    = list(string)
  default = ["http://localhost:3000/"]
}

variable "logout_urls" {
  type    = list(string)
  default = ["http://localhost:3000/"]
}

variable "enable_google_auth" {
  type    = bool
  default = false
}

variable "google_client_id" {
  type    = string
  default = ""
}

variable "google_client_secret" {
  type    = string
  default = ""
  sensitive = true
}

output "gemini_proxy_arn" {
  value = aws_lambda_function.gemini_proxy.arn
}

output "pre_signup_arn" {
  value = aws_lambda_function.pre_signup.arn
}

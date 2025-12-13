data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "lambda_exec" {
  name               = "${var.project_name}-lambda-role-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# --- Gemini Proxy Function ---
data "archive_file" "gemini_proxy" {
  type        = "zip"
  source_dir  = "${path.root}/../backend/functions/atsbuddyGeminiProxy/src"
  output_path = "${path.module}/build/gemini_proxy.zip"
}

resource "aws_lambda_function" "gemini_proxy" {
  filename         = data.archive_file.gemini_proxy.output_path
  function_name    = "${var.project_name}-gemini-proxy-${var.environment}"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.gemini_proxy.output_base64sha256
  runtime          = "nodejs18.x"
  timeout          = 30

  environment {
    variables = {
      ENV            = var.environment
      GEMINI_API_KEY = var.gemini_api_key
    }
  }
}

# --- Pre Signup Functions ---
data "archive_file" "pre_signup" {
  type        = "zip"
  source_dir  = "${path.root}/../backend/functions/atsbuddyc5ca7e0bPreSignup/src"
  output_path = "${path.module}/build/pre_signup.zip"
}

resource "aws_lambda_function" "pre_signup" {
  filename         = data.archive_file.pre_signup.output_path
  function_name    = "${var.project_name}-pre-signup-${var.environment}"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "custom.handler"
  source_code_hash = data.archive_file.pre_signup.output_base64sha256
  runtime          = "nodejs18.x"

  environment {
    variables = {
      ENV = var.environment
    }
  }
}

# --- Cleanup Users Function ---
data "archive_file" "cleanup" {
  type        = "zip"
  source_dir  = "${path.root}/../backend/functions/cleanupUnverifiedUsers/src"
  output_path = "${path.module}/build/cleanup.zip"
}

resource "aws_lambda_function" "cleanup" {
  filename         = data.archive_file.cleanup.output_path
  function_name    = "${var.project_name}-cleanup-${var.environment}"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.cleanup.output_base64sha256
  runtime          = "nodejs18.x"
  timeout          = 300 # 5 mins

  environment {
    variables = {
      ENV = var.environment
    }
  }
}

# Permission for Cognito to invoke PreSignup
resource "aws_lambda_permission" "allow_cognito" {
  statement_id  = "AllowExecutionFromCognito"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.pre_signup.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = var.user_pool_arn
}

output "pre_signup_arn" {
  value = aws_lambda_function.pre_signup.arn
}

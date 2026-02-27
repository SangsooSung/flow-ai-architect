# Flow AI Bot Pipeline - Variables

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "flow-ai"
}

# Networking
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

# Bot Producer Configuration
variable "chunk_duration_seconds" {
  description = "Audio chunk duration in seconds"
  type        = number
  default     = 30
}

variable "audio_sample_rate" {
  description = "Audio sample rate in Hz"
  type        = number
  default     = 16000
}

# Whisper Consumer Configuration
variable "whisper_model" {
  description = "Whisper model to use (large-v3-turbo, large-v3, medium, etc.)"
  type        = string
  default     = "large-v3-turbo"
}

variable "whisper_compute_type" {
  description = "Compute type for Whisper (float16, int8, etc.)"
  type        = string
  default     = "float16"
}

variable "whisper_asg_min_size" {
  description = "Minimum number of Whisper GPU instances"
  type        = number
  default     = 0
}

variable "whisper_asg_max_size" {
  description = "Maximum number of Whisper GPU instances"
  type        = number
  default     = 10
}

variable "gpu_instance_types" {
  description = "GPU instance types in order of preference"
  type        = list(string)
  default     = ["g4dn.xlarge", "g4dn.2xlarge", "g5.xlarge"]
}

# SQS Configuration
variable "sqs_visibility_timeout" {
  description = "SQS visibility timeout in seconds"
  type        = number
  default     = 300
}

variable "sqs_max_receive_count" {
  description = "Maximum receive count before DLQ"
  type        = number
  default     = 3
}

# Supabase Configuration
variable "supabase_url" {
  description = "Supabase project URL"
  type        = string
  sensitive   = true
}

variable "supabase_service_key" {
  description = "Supabase service role key"
  type        = string
  sensitive   = true
}

# HuggingFace Configuration
variable "huggingface_token" {
  description = "HuggingFace API token for pyannote"
  type        = string
  sensitive   = true
}

# ECR Repository URIs (created separately or passed in)
variable "bot_producer_image" {
  description = "Docker image URI for bot producer"
  type        = string
  default     = ""
}

variable "whisper_consumer_image" {
  description = "Docker image URI for whisper consumer"
  type        = string
  default     = ""
}

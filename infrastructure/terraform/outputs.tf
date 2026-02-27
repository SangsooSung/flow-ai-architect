# Flow AI Bot Pipeline - Terraform Outputs

# ============================================================================
# ECR Repositories
# ============================================================================

output "ecr_bot_producer_url" {
  description = "ECR repository URL for bot producer image"
  value       = aws_ecr_repository.bot_producer.repository_url
}

output "ecr_whisper_consumer_url" {
  description = "ECR repository URL for whisper consumer image"
  value       = aws_ecr_repository.whisper_consumer.repository_url
}

# ============================================================================
# ECS Cluster
# ============================================================================

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "ECS cluster ARN"
  value       = aws_ecs_cluster.main.arn
}

# ============================================================================
# Task Definitions
# ============================================================================

output "bot_producer_task_definition_arn" {
  description = "Bot producer task definition ARN"
  value       = aws_ecs_task_definition.bot_producer.arn
}

output "whisper_consumer_task_definition_arn" {
  description = "Whisper consumer task definition ARN"
  value       = aws_ecs_task_definition.whisper_consumer.arn
}

# ============================================================================
# Lambda Functions
# ============================================================================

output "coordinator_lambda_arn" {
  description = "Coordinator Lambda function ARN"
  value       = aws_lambda_function.coordinator.arn
}

output "coordinator_lambda_url" {
  description = "Coordinator Lambda function URL"
  value       = aws_lambda_function_url.coordinator.function_url
}

# ============================================================================
# Storage
# ============================================================================

output "audio_chunks_bucket" {
  description = "S3 bucket name for audio chunks"
  value       = aws_s3_bucket.audio_chunks.id
}

output "transcription_queue_url" {
  description = "SQS queue URL for transcription jobs"
  value       = aws_sqs_queue.transcription.url
}

output "chunk_state_table" {
  description = "DynamoDB table name for chunk state"
  value       = aws_dynamodb_table.chunk_state.name
}

output "sessions_table" {
  description = "DynamoDB table name for sessions"
  value       = aws_dynamodb_table.sessions.name
}

output "transcript_segments_table" {
  description = "DynamoDB table name for transcript segments (intermediate store)"
  value       = aws_dynamodb_table.transcript_segments.name
}

# ============================================================================
# Networking
# ============================================================================

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs (for bot producer)"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs (for whisper consumer)"
  value       = aws_subnet.private[*].id
}

output "bot_producer_security_group_id" {
  description = "Security group ID for bot producer"
  value       = aws_security_group.bot_producer.id
}

# ============================================================================
# Step Functions
# ============================================================================

output "meeting_completion_state_machine_arn" {
  description = "Step Functions state machine ARN for meeting completion"
  value       = aws_sfn_state_machine.meeting_completion.arn
}

# ============================================================================
# Auto Scaling
# ============================================================================

output "whisper_asg_name" {
  description = "Auto Scaling Group name for Whisper GPU instances"
  value       = aws_autoscaling_group.whisper.name
}

# ============================================================================
# Secrets
# ============================================================================

output "supabase_secret_arn" {
  description = "Secrets Manager ARN for Supabase credentials"
  value       = aws_secretsmanager_secret.supabase.arn
  sensitive   = true
}

output "huggingface_secret_arn" {
  description = "Secrets Manager ARN for HuggingFace token"
  value       = aws_secretsmanager_secret.huggingface.arn
  sensitive   = true
}

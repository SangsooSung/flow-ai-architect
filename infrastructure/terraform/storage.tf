# Flow AI Bot Pipeline - Storage (S3, SQS, DynamoDB, Secrets Manager)

# ============================================================================
# S3 Bucket for Audio Chunks
# ============================================================================

resource "aws_s3_bucket" "audio_chunks" {
  bucket = "${var.project_name}-audio-chunks-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name = "${var.project_name}-audio-chunks"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "audio_chunks" {
  bucket = aws_s3_bucket.audio_chunks.id

  rule {
    id     = "delete-old-chunks"
    status = "Enabled"

    expiration {
      days = 1  # Delete chunks after 1 day (safety net, should be deleted after transcription)
    }

    filter {
      prefix = "meetings/"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "audio_chunks" {
  bucket = aws_s3_bucket.audio_chunks.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "audio_chunks" {
  bucket = aws_s3_bucket.audio_chunks.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# ============================================================================
# SQS Queues
# ============================================================================

# Dead Letter Queue
resource "aws_sqs_queue" "transcription_dlq" {
  name                      = "${var.project_name}-transcription-dlq"
  message_retention_seconds = 1209600  # 14 days

  tags = {
    Name = "${var.project_name}-transcription-dlq"
  }
}

# Main Transcription Queue
resource "aws_sqs_queue" "transcription" {
  name                       = "${var.project_name}-transcription-queue"
  visibility_timeout_seconds = var.sqs_visibility_timeout
  message_retention_seconds  = 86400  # 24 hours
  receive_wait_time_seconds  = 20     # Long polling

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.transcription_dlq.arn
    maxReceiveCount     = var.sqs_max_receive_count
  })

  tags = {
    Name = "${var.project_name}-transcription-queue"
  }
}

# ============================================================================
# DynamoDB Tables
# ============================================================================

# Chunk State Table
resource "aws_dynamodb_table" "chunk_state" {
  name         = "${var.project_name}-chunk-state"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "meeting_id"
  range_key    = "chunk_index"

  attribute {
    name = "meeting_id"
    type = "S"
  }

  attribute {
    name = "chunk_index"
    type = "N"
  }

  attribute {
    name = "status"
    type = "S"
  }

  # GSI for querying by meeting_id and status
  global_secondary_index {
    name            = "MeetingStatusIndex"
    hash_key        = "meeting_id"
    range_key       = "status"
    projection_type = "KEYS_ONLY"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = {
    Name = "${var.project_name}-chunk-state"
  }
}

# Sessions Table
resource "aws_dynamodb_table" "sessions" {
  name         = "${var.project_name}-sessions"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "session_id"

  attribute {
    name = "session_id"
    type = "S"
  }

  attribute {
    name = "meeting_id"
    type = "S"
  }

  attribute {
    name = "producer_task_arn"
    type = "S"
  }

  # GSI for querying by meeting_id
  global_secondary_index {
    name            = "MeetingIndex"
    hash_key        = "meeting_id"
    projection_type = "ALL"
  }

  # GSI for querying by task ARN (for EventBridge handler)
  global_secondary_index {
    name            = "TaskArnIndex"
    hash_key        = "producer_task_arn"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = {
    Name = "${var.project_name}-sessions"
  }
}

# Transcript Segments Table (intermediate store before Supabase sync)
resource "aws_dynamodb_table" "transcript_segments" {
  name         = "${var.project_name}-transcript-segments"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "meeting_id"
  range_key    = "segment_id"

  attribute {
    name = "meeting_id"
    type = "S"
  }

  attribute {
    name = "segment_id"
    type = "S"  # Format: "00003#00001" (chunk_index#segment_index, 5-digit zero-padded)
  }

  attribute {
    name = "synced"
    type = "S"  # "true" or "false" as string for GSI
  }

  # GSI for querying unsynced segments by meeting
  global_secondary_index {
    name            = "MeetingSyncIndex"
    hash_key        = "meeting_id"
    range_key       = "synced"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = {
    Name = "${var.project_name}-transcript-segments"
  }
}

# ============================================================================
# Secrets Manager
# ============================================================================

# Supabase Credentials
resource "aws_secretsmanager_secret" "supabase" {
  name = "${var.project_name}/supabase"

  tags = {
    Name = "${var.project_name}-supabase-secret"
  }
}

resource "aws_secretsmanager_secret_version" "supabase" {
  secret_id = aws_secretsmanager_secret.supabase.id
  secret_string = jsonencode({
    url         = var.supabase_url
    service_key = var.supabase_service_key
  })
}

# HuggingFace Token (for pyannote)
resource "aws_secretsmanager_secret" "huggingface" {
  name = "${var.project_name}/huggingface"

  tags = {
    Name = "${var.project_name}-huggingface-secret"
  }
}

resource "aws_secretsmanager_secret_version" "huggingface" {
  secret_id = aws_secretsmanager_secret.huggingface.id
  secret_string = jsonencode({
    token = var.huggingface_token
  })
}

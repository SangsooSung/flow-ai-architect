# Flow AI Bot Pipeline - Security Groups

# Security Group for VPC Endpoints
resource "aws_security_group" "vpc_endpoints" {
  name        = "${var.project_name}-vpc-endpoints-sg"
  description = "Security group for VPC endpoints"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-vpc-endpoints-sg"
  }
}

# Security Group for Bot Producer (RTMP Ingest)
resource "aws_security_group" "bot_producer" {
  name        = "${var.project_name}-bot-producer-sg"
  description = "Security group for RTMP ingest bot producer"
  vpc_id      = aws_vpc.main.id

  # RTMP ingest from Zoom (anywhere - Zoom IPs are dynamic)
  ingress {
    description = "RTMP ingest from Zoom"
    from_port   = 1935
    to_port     = 1935
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Health check from internal
  ingress {
    description = "Health check"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  # All outbound (S3, SQS, DynamoDB, Supabase)
  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-bot-producer-sg"
  }
}

# Security Group for Whisper Consumer (GPU instances)
resource "aws_security_group" "whisper_consumer" {
  name        = "${var.project_name}-whisper-consumer-sg"
  description = "Security group for Whisper GPU consumer instances"
  vpc_id      = aws_vpc.main.id

  # ECS agent communication
  ingress {
    description = "ECS agent"
    from_port   = 51678
    to_port     = 51680
    protocol    = "tcp"
    self        = true
  }

  # All outbound (S3, SQS, DynamoDB, Supabase, HuggingFace)
  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-whisper-consumer-sg"
  }
}

# Security Group for Lambda functions in VPC
resource "aws_security_group" "lambda" {
  name        = "${var.project_name}-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.main.id

  # All outbound
  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-lambda-sg"
  }
}

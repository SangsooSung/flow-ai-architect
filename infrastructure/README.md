# Flow AI Bot Pipeline - Infrastructure

AWS infrastructure for the Flow AI meeting bot pipeline using Terraform.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Flow AI Bot Pipeline                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌────────────┐ │
│  │   Zoom      │    │ Bot Producer │    │    SQS      │    │  Whisper   │ │
│  │   Live      │───▶│   (Fargate)  │───▶│   Queue     │───▶│  Consumer  │ │
│  │  Streaming  │    │  nginx-rtmp  │    │             │    │ (EC2 GPU)  │ │
│  └─────────────┘    └──────────────┘    └─────────────┘    └────────────┘ │
│                            │                                      │        │
│                            ▼                                      ▼        │
│                     ┌──────────────┐                      ┌────────────┐  │
│                     │     S3       │                      │  Supabase  │  │
│                     │ Audio Chunks │                      │ Transcripts│  │
│                     └──────────────┘                      └────────────┘  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                    Step Functions Workflow                           │ │
│  │  Wait for Chunks → Generate Notes → Update Meeting Status           │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Components

### Bot Producer (Fargate)
- Receives RTMP stream from Zoom Live Streaming
- nginx-rtmp for ingest
- ffmpeg extracts audio, chunks into 30-second PCM segments
- Uploads chunks to S3, sends messages to SQS
- Runs on Fargate On-Demand (public subnet for RTMP ingest)

### Whisper Consumer (EC2 GPU)
- Polls SQS for transcription jobs
- faster-whisper with large-v3-turbo model on CUDA
- pyannote.audio for speaker diarization
- Writes transcript segments directly to Supabase
- Runs on g4dn.xlarge Spot instances (scale to zero)

### Coordinator Lambda
- Creates meeting sessions
- Launches bot producer ECS tasks
- Pre-warms GPU ASG on session start
- Starts Step Functions workflow on session end

### Step Functions
- Waits for all chunks to be processed
- Handles partial failures gracefully
- Generates meeting notes from transcript
- Updates meeting status in Supabase

## Prerequisites

1. AWS CLI configured with appropriate credentials
2. Terraform >= 1.5.0
3. Supabase project with service key
4. HuggingFace token (for pyannote diarization)
5. Docker (for building container images)

## Configuration

Create a `terraform.tfvars` file:

```hcl
project_name         = "flow-ai-bot"
aws_region           = "us-east-1"
supabase_url         = "https://your-project.supabase.co"
supabase_service_key = "your-service-key"
huggingface_token    = "your-hf-token"

# Optional overrides
whisper_model           = "large-v3-turbo"
chunk_duration_seconds  = 30
whisper_asg_min_size    = 0
whisper_asg_max_size    = 4
```

## Deployment

### 1. Initialize Terraform

```bash
cd infrastructure/terraform
terraform init
```

### 2. Review Plan

```bash
terraform plan -var-file=terraform.tfvars
```

### 3. Apply Infrastructure

```bash
terraform apply -var-file=terraform.tfvars
```

### 4. Build and Push Container Images

```bash
# Get ECR login
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push bot producer
cd services/bot-producer
docker build -t flow-ai-bot-bot-producer .
docker tag flow-ai-bot-bot-producer:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/flow-ai-bot-bot-producer:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/flow-ai-bot-bot-producer:latest

# Build and push whisper consumer
cd ../whisper-consumer
docker build -t flow-ai-bot-whisper-consumer .
docker tag flow-ai-bot-whisper-consumer:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/flow-ai-bot-whisper-consumer:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/flow-ai-bot-whisper-consumer:latest
```

### 5. Deploy Lambda Functions

```bash
# Package and deploy coordinator
cd services/coordinator
zip -r coordinator.zip handler.py
aws lambda update-function-code \
  --function-name flow-ai-bot-coordinator \
  --zip-file fileb://coordinator.zip

# Repeat for other Lambda functions...
```

### 6. Run Supabase Migration

```bash
cd supabase
supabase db push
```

## Outputs

After deployment, Terraform outputs:

- `coordinator_lambda_url` - URL to invoke coordinator
- `ecr_bot_producer_url` - ECR repository for bot producer
- `ecr_whisper_consumer_url` - ECR repository for whisper consumer
- `transcription_queue_url` - SQS queue URL
- `audio_chunks_bucket` - S3 bucket name

## Usage

### Start a Meeting Session

```bash
curl -X POST "$(terraform output -raw coordinator_lambda_url)" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "start_session",
    "meeting_id": "your-meeting-uuid",
    "user_id": "user-uuid",
    "topic": "Meeting Topic"
  }'
```

Response includes `rtmp_url` for Zoom Live Streaming configuration.

### Get Session Status

```bash
curl -X POST "$(terraform output -raw coordinator_lambda_url)" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "get_session",
    "session_id": "session-uuid"
  }'
```

### End Session

```bash
curl -X POST "$(terraform output -raw coordinator_lambda_url)" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "end_session",
    "session_id": "session-uuid"
  }'
```

## Cost Optimization

- **GPU instances**: 100% Spot with scale-to-zero (no cost when idle)
- **VPC Endpoints**: Reduce NAT Gateway data transfer costs
- **S3 Lifecycle**: Chunks auto-deleted after 1 day
- **DynamoDB**: On-demand pricing (pay per request)
- **Fargate**: On-demand for bot producer (short-lived tasks)

## Monitoring

- CloudWatch Logs for all components
- Container Insights enabled on ECS cluster
- Step Functions execution history
- SQS queue metrics for scaling

## Security

- VPC with private subnets for GPU instances
- Secrets Manager for Supabase and HuggingFace credentials
- IAM roles with least privilege
- S3 bucket encryption and public access blocked
- Security groups restrict traffic to necessary ports

## Troubleshooting

### Bot Producer Won't Start
- Check Coordinator Lambda logs
- Verify ECS task definition exists
- Check security group allows RTMP (port 1935)

### No Transcripts Generated
- Check SQS queue for messages
- Verify Whisper consumer is running
- Check DynamoDB chunk state for failures
- Review CloudWatch logs for errors

### GPU Instances Not Scaling
- Check ASG desired capacity
- Verify Capacity Provider is attached to cluster
- Check Spot instance availability in region

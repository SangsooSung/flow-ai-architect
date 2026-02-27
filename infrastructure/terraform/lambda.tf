# Flow AI Bot Pipeline - Lambda Functions

# ============================================================================
# Lambda Layer for shared dependencies
# ============================================================================

# Note: Lambda code will be deployed separately via CI/CD
# This creates the function infrastructure only

# ============================================================================
# Secrets
# ============================================================================

# Bot secret for Coordinator Lambda authentication
data "aws_secretsmanager_secret" "bot_secret" {
  name = "flow-ai-bot/bot-secret"
}

data "aws_secretsmanager_secret_version" "bot_secret" {
  secret_id = data.aws_secretsmanager_secret.bot_secret.id
}

# ============================================================================
# Coordinator Lambda
# ============================================================================

resource "aws_cloudwatch_log_group" "coordinator_lambda" {
  name              = "/aws/lambda/${var.project_name}-coordinator"
  retention_in_days = 30
}

resource "aws_lambda_function" "coordinator" {
  function_name = "${var.project_name}-coordinator"
  role          = aws_iam_role.coordinator_lambda.arn
  handler       = "handler.lambda_handler"
  runtime       = "python3.12"
  timeout       = 30
  memory_size   = 256

  # Placeholder - will be updated by CI/CD
  filename         = data.archive_file.lambda_placeholder.output_path
  source_code_hash = data.archive_file.lambda_placeholder.output_base64sha256

  environment {
    variables = {
      ECS_CLUSTER           = aws_ecs_cluster.main.name
      BOT_PRODUCER_TASK_DEF = aws_ecs_task_definition.bot_producer.arn
      SUBNETS               = join(",", aws_subnet.public[*].id)
      SECURITY_GROUPS       = aws_security_group.bot_producer.id
      SESSIONS_TABLE        = aws_dynamodb_table.sessions.name
      WHISPER_ASG_NAME      = aws_autoscaling_group.whisper.name
      STEP_FUNCTION_ARN     = aws_sfn_state_machine.meeting_completion.arn
      AWS_REGION_NAME       = var.aws_region
      BOT_SECRET            = data.aws_secretsmanager_secret_version.bot_secret.secret_string
    }
  }

  depends_on = [aws_cloudwatch_log_group.coordinator_lambda]

  tags = {
    Name = "${var.project_name}-coordinator"
  }
}

# Lambda Function URL (public with shared secret authentication)
resource "aws_lambda_function_url" "coordinator" {
  function_name      = aws_lambda_function.coordinator.function_name
  authorization_type = "NONE"

  cors {
    allow_origins = ["*"]
    allow_methods = ["*"]
    allow_headers = ["*"]
    max_age       = 86400
  }
}

# Permission for public access to Lambda Function URL
resource "aws_lambda_permission" "coordinator_url_public" {
  statement_id           = "FunctionURLPublicAccess"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = aws_lambda_function.coordinator.function_name
  principal              = "*"
  function_url_auth_type = "NONE"
}

resource "aws_lambda_permission" "coordinator_invoke_public" {
  statement_id  = "InvokeFunctionPublic"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.coordinator.function_name
  principal     = "*"
}

# ============================================================================
# Task Status Handler Lambda (EventBridge target)
# ============================================================================

resource "aws_cloudwatch_log_group" "task_status_lambda" {
  name              = "/aws/lambda/${var.project_name}-task-status-handler"
  retention_in_days = 30
}

resource "aws_lambda_function" "task_status_handler" {
  function_name = "${var.project_name}-task-status-handler"
  role          = aws_iam_role.task_status_lambda.arn
  handler       = "index.lambda_handler"
  runtime       = "python3.12"
  timeout       = 30
  memory_size   = 128

  filename         = data.archive_file.task_status_handler.output_path
  source_code_hash = data.archive_file.task_status_handler.output_base64sha256

  environment {
    variables = {
      SESSIONS_TABLE    = aws_dynamodb_table.sessions.name
      CHUNK_STATE_TABLE = aws_dynamodb_table.chunk_state.name
      STEP_FUNCTION_ARN = aws_sfn_state_machine.meeting_completion.arn
    }
  }

  depends_on = [aws_cloudwatch_log_group.task_status_lambda]

  tags = {
    Name = "${var.project_name}-task-status-handler"
  }
}

# Inline task status handler code - triggers Step Functions on session complete
data "archive_file" "task_status_handler" {
  type        = "zip"
  output_path = "${path.module}/task_status_handler.zip"

  source {
    content  = <<-PYTHON
import json
import os
from datetime import datetime, timezone

import boto3
from boto3.dynamodb.conditions import Key

SESSIONS_TABLE = os.environ.get("SESSIONS_TABLE")
STEP_FUNCTION_ARN = os.environ.get("STEP_FUNCTION_ARN")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
ec2 = boto3.client("ec2", region_name=AWS_REGION)
sfn = boto3.client("stepfunctions", region_name=AWS_REGION)


def lambda_handler(event, context):
    """Handle ECS task state change events and trigger Step Functions on completion."""
    print(f"Event: {json.dumps(event)}")

    # Check if this is a Spot interruption event
    if event.get("eventType") == "SPOT_INTERRUPTION":
        return handle_spot_interruption(event)

    # Otherwise, it's an ECS task state change
    detail = event.get("detail", {})
    task_arn = detail.get("taskArn")
    last_status = detail.get("lastStatus")

    if not task_arn:
        print("No task ARN in event")
        return {"processed": False}

    # Find session by task ARN
    session = find_session_by_task_arn(task_arn)

    if not session:
        print(f"No session found for task: {task_arn}")
        return {"processed": False}

    session_id = session["session_id"]
    meeting_id = session.get("meeting_id")

    if last_status == "RUNNING":
        return handle_task_running(session_id, detail, session)
    elif last_status == "STOPPED":
        return handle_task_stopped(session_id, meeting_id, detail, session)
    elif last_status == "DEPROVISIONING":
        return handle_task_deprovisioning(session_id, detail)
    else:
        print(f"Unhandled status: {last_status}")
        return {"processed": False, "status": last_status}


def find_session_by_task_arn(task_arn):
    """Find session record by producer task ARN."""
    table = dynamodb.Table(SESSIONS_TABLE)

    response = table.query(
        IndexName="TaskArnIndex",
        KeyConditionExpression=Key("producer_task_arn").eq(task_arn),
    )

    items = response.get("Items", [])
    return items[0] if items else None


def handle_task_running(session_id, detail, session):
    """Handle task RUNNING state - extract public IP and update session."""
    print(f"Task RUNNING for session: {session_id}")

    public_ip = extract_public_ip(detail)
    table = dynamodb.Table(SESSIONS_TABLE)

    update_expr = "SET #status = :status, started_at = :started"
    expr_values = {
        ":status": "running",
        ":started": datetime.now(timezone.utc).isoformat(),
    }

    if public_ip:
        update_expr += ", public_ip = :ip, rtmp_url = :rtmp"
        expr_values[":ip"] = public_ip
        stream_key = session.get("stream_key", session_id)
        expr_values[":rtmp"] = f"rtmp://{public_ip}:1935/live/{stream_key}"

    table.update_item(
        Key={"session_id": session_id},
        UpdateExpression=update_expr,
        ExpressionAttributeNames={"#status": "status"},
        ExpressionAttributeValues=expr_values,
    )

    return {"processed": True, "session_id": session_id, "status": "running", "public_ip": public_ip}


def handle_task_stopped(session_id, meeting_id, detail, session):
    """Handle task STOPPED state - update session and trigger Step Functions."""
    print(f"Task STOPPED for session: {session_id}")

    stop_code = detail.get("stopCode", "")
    stopped_reason = detail.get("stoppedReason", "")

    # Determine final status
    if "SpotInterruption" in stopped_reason:
        status = "spot_interrupted"
    elif "Session ended" in stopped_reason or "Essential container" in stopped_reason:
        status = "completed"
    else:
        status = "stopped"

    table = dynamodb.Table(SESSIONS_TABLE)
    table.update_item(
        Key={"session_id": session_id},
        UpdateExpression="SET #status = :status, stopped_at = :stopped, stop_reason = :reason",
        ExpressionAttributeNames={"#status": "status"},
        ExpressionAttributeValues={
            ":status": status,
            ":stopped": datetime.now(timezone.utc).isoformat(),
            ":reason": f"{stop_code}: {stopped_reason}",
        },
    )

    # Trigger Step Functions for completed sessions with chunks
    total_chunks = session.get("total_chunks", 0)

    # If total_chunks not set yet, check chunk_state table
    if total_chunks == 0 and meeting_id:
        try:
            # Query chunk count from DynamoDB
            chunk_table = dynamodb.Table(os.environ.get("CHUNK_STATE_TABLE", "flow-ai-bot-chunk-state"))
            chunk_response = chunk_table.query(
                KeyConditionExpression=Key("meeting_id").eq(meeting_id),
                Select="COUNT"
            )
            total_chunks = chunk_response.get("Count", 0)
            print(f"Found {total_chunks} chunks for meeting {meeting_id}")
        except Exception as e:
            print(f"Failed to count chunks: {e}")

    if status == "completed" and meeting_id and total_chunks > 0 and STEP_FUNCTION_ARN:
        try:
            execution_name = f"meeting-{meeting_id[:8]}-{session_id[:8]}-{int(datetime.now().timestamp())}"
            sfn.start_execution(
                stateMachineArn=STEP_FUNCTION_ARN,
                name=execution_name,
                input=json.dumps({
                    "meeting_id": meeting_id,
                    "session_id": session_id,
                    "total_chunks": int(total_chunks),  # Convert Decimal to int for JSON serialization
                })
            )
            print(f"Started Step Functions: {execution_name}")
        except Exception as e:
            print(f"Failed to start Step Functions: {e}")

    return {"processed": True, "session_id": session_id, "status": status}


def handle_task_deprovisioning(session_id, detail):
    """Handle task DEPROVISIONING state."""
    print(f"Task DEPROVISIONING for session: {session_id}")

    table = dynamodb.Table(SESSIONS_TABLE)
    table.update_item(
        Key={"session_id": session_id},
        UpdateExpression="SET #status = :status",
        ExpressionAttributeNames={"#status": "status"},
        ExpressionAttributeValues={":status": "deprovisioning"},
    )

    return {"processed": True, "session_id": session_id, "status": "deprovisioning"}


def handle_spot_interruption(event):
    """Handle EC2 Spot instance interruption warning."""
    instance_id = event.get("instanceId")
    action = event.get("action")
    print(f"Spot interruption: instance={instance_id}, action={action}")
    return {"processed": True, "event_type": "spot_interruption", "instance_id": instance_id, "action": action}


def extract_public_ip(detail):
    """Extract public IP from ECS task detail."""
    attachments = detail.get("attachments", [])

    for attachment in attachments:
        if attachment.get("type") == "ElasticNetworkInterface":
            details = attachment.get("details", [])

            for d in details:
                if d.get("name") == "publicIPv4Address":
                    return d.get("value")

            for d in details:
                if d.get("name") == "networkInterfaceId":
                    eni_id = d.get("value")
                    try:
                        response = ec2.describe_network_interfaces(NetworkInterfaceIds=[eni_id])
                        if response.get("NetworkInterfaces"):
                            association = response["NetworkInterfaces"][0].get("Association", {})
                            return association.get("PublicIp")
                    except Exception as e:
                        print(f"Failed to get ENI details: {e}")

    return None
PYTHON
    filename = "index.py"
  }
}

# Permission for EventBridge to invoke Lambda
resource "aws_lambda_permission" "task_status_eventbridge" {
  statement_id  = "AllowEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.task_status_handler.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.ecs_task_state_change.arn
}

# ============================================================================
# Step Functions Lambda Functions
# ============================================================================

# Check Chunks Status Lambda
resource "aws_cloudwatch_log_group" "check_chunks_status" {
  name              = "/aws/lambda/${var.project_name}-check-chunks-status"
  retention_in_days = 30
}

resource "aws_lambda_function" "check_chunks_status" {
  function_name = "${var.project_name}-check-chunks-status"
  role          = aws_iam_role.step_functions_lambda.arn
  handler       = "handler.lambda_handler"
  runtime       = "python3.12"
  timeout       = 30
  memory_size   = 128

  filename         = data.archive_file.lambda_placeholder.output_path
  source_code_hash = data.archive_file.lambda_placeholder.output_base64sha256

  environment {
    variables = {
      CHUNK_STATE_TABLE = aws_dynamodb_table.chunk_state.name
    }
  }

  depends_on = [aws_cloudwatch_log_group.check_chunks_status]

  tags = {
    Name = "${var.project_name}-check-chunks-status"
  }
}

# Handle Partial Failure Lambda
resource "aws_cloudwatch_log_group" "handle_partial_failure" {
  name              = "/aws/lambda/${var.project_name}-handle-partial-failure"
  retention_in_days = 30
}

resource "aws_lambda_function" "handle_partial_failure" {
  function_name = "${var.project_name}-handle-partial-failure"
  role          = aws_iam_role.step_functions_lambda.arn
  handler       = "handler.lambda_handler"
  runtime       = "python3.12"
  timeout       = 30
  memory_size   = 128

  filename         = data.archive_file.lambda_placeholder.output_path
  source_code_hash = data.archive_file.lambda_placeholder.output_base64sha256

  environment {
    variables = {
      CHUNK_STATE_TABLE    = aws_dynamodb_table.chunk_state.name
      CHUNK_DURATION_MS    = tostring(var.chunk_duration_seconds * 1000)
    }
  }

  depends_on = [aws_cloudwatch_log_group.handle_partial_failure]

  tags = {
    Name = "${var.project_name}-handle-partial-failure"
  }
}

# Generate Notes Lambda
resource "aws_cloudwatch_log_group" "generate_notes" {
  name              = "/aws/lambda/${var.project_name}-generate-notes"
  retention_in_days = 30
}

resource "aws_lambda_function" "generate_notes" {
  function_name = "${var.project_name}-generate-notes"
  role          = aws_iam_role.step_functions_lambda.arn
  handler       = "index.lambda_handler"
  runtime       = "python3.12"
  timeout       = 300  # 5 minutes for LLM call
  memory_size   = 256

  filename         = data.archive_file.generate_notes.output_path
  source_code_hash = data.archive_file.generate_notes.output_base64sha256

  environment {
    variables = {
      SUPABASE_SECRET_ARN       = aws_secretsmanager_secret.supabase.arn
      TRANSCRIPT_SEGMENTS_TABLE = aws_dynamodb_table.transcript_segments.name
    }
  }

  depends_on = [aws_cloudwatch_log_group.generate_notes]

  tags = {
    Name = "${var.project_name}-generate-notes"
  }
}

data "archive_file" "generate_notes" {
  type        = "zip"
  output_path = "${path.module}/generate_notes.zip"

  source {
    content  = <<-PYTHON
import json
import os
import boto3
import urllib.request
import urllib.error
from datetime import datetime, timezone
import uuid

dynamodb = boto3.resource("dynamodb")
secrets_client = boto3.client("secretsmanager")

SUPABASE_SECRET_ARN = os.environ["SUPABASE_SECRET_ARN"]
TRANSCRIPT_SEGMENTS_TABLE = os.environ["TRANSCRIPT_SEGMENTS_TABLE"]

_supabase_creds = None

def get_supabase_creds():
    global _supabase_creds
    if _supabase_creds is None:
        resp = secrets_client.get_secret_value(SecretId=SUPABASE_SECRET_ARN)
        _supabase_creds = json.loads(resp["SecretString"])
    return _supabase_creds

def format_timestamp(seconds):
    minutes = int(float(seconds) // 60)
    secs = int(float(seconds) % 60)
    return f"{minutes:02d}:{secs:02d}"

def lambda_handler(event, context):
    """Generate meeting notes from transcript segments."""
    print(f"Event: {json.dumps(event)}")

    meeting_id = event.get("meeting_id")
    is_partial = event.get("partial", False)
    time_gaps = event.get("timeGaps", [])

    if not meeting_id:
        raise ValueError("meeting_id is required")

    # Fetch segments from Supabase (Whisper writes directly to Supabase)
    creds = get_supabase_creds()
    supabase_url = creds["url"]
    service_key = creds["service_key"]

    req = urllib.request.Request(
        f"{supabase_url}/rest/v1/transcript_segments?meeting_id=eq.{meeting_id}&order=start_time",
        headers={
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            segments = json.loads(resp.read().decode())
            print(f"Found {len(segments)} segments from Supabase")
    except Exception as e:
        print(f"Failed to fetch segments from Supabase: {e}")
        segments = []

    # Sort by start_time
    segments.sort(key=lambda x: float(x.get("start_time", 0)))

    if not segments:
        print(f"No segments found for meeting {meeting_id}")
        return {
            "success": False,
            "partial": is_partial,
            "notesId": None,
            "error": "No transcript segments found",
        }

    # Build transcript text
    lines = []
    speakers = set()
    for seg in segments:
        timestamp = format_timestamp(seg.get("start_time", 0))
        speaker = seg.get("speaker", "SPEAKER")
        text = seg.get("text", "").strip()
        if text:
            lines.append(f"[{timestamp}] {speaker}: {text}")
            speakers.add(speaker)

    transcript_text = "\n".join(lines)
    word_count = sum(len(line.split()) for line in lines)

    # Build notes
    gap_warning = None
    if is_partial and time_gaps:
        gap_minutes = sum((g.get("end_seconds", 0) - g.get("start_seconds", 0)) / 60 for g in time_gaps)
        gap_warning = f"This transcript has {len(time_gaps)} gap(s) totaling approximately {gap_minutes:.1f} minutes of missing audio."

    summary = f"Meeting transcript with {len(speakers)} participant(s) and {word_count} words."
    if gap_warning:
        summary += f" {gap_warning}"

    # Fetch meeting to get user_id (creds already fetched above)
    req = urllib.request.Request(
        f"{supabase_url}/rest/v1/zoom_meetings?id=eq.{meeting_id}&select=user_id",
        headers={
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            meeting_data = json.loads(resp.read().decode())
            user_id = meeting_data[0]["user_id"] if meeting_data else None
    except Exception as e:
        print(f"Failed to get meeting user_id: {e}")
        user_id = None

    # Store notes
    notes_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    notes_row = {
        "id": notes_id,
        "meeting_id": meeting_id,
        "user_id": user_id,
        "summary": summary,
        "participants": list(speakers),
        "key_points": [],
        "action_items": [],
        "decisions": [],
        "follow_ups": [],
        "notes_markdown": transcript_text,
        "created_at": now,
        "updated_at": now,
    }

    req = urllib.request.Request(
        f"{supabase_url}/rest/v1/meeting_notes",
        data=json.dumps(notes_row).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Prefer": "return=minimal"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            print(f"Stored notes {notes_id} for meeting {meeting_id}")
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"Failed to store notes: {e.code} - {error_body}")
        return {
            "success": False,
            "partial": is_partial,
            "notesId": None,
            "error": error_body,
        }

    return {
        "success": True,
        "partial": is_partial,
        "notesId": notes_id,
    }
PYTHON
    filename = "index.py"
  }
}

# Update Meeting Status Lambda
resource "aws_cloudwatch_log_group" "update_meeting_status" {
  name              = "/aws/lambda/${var.project_name}-update-meeting-status"
  retention_in_days = 30
}

resource "aws_lambda_function" "update_meeting_status" {
  function_name = "${var.project_name}-update-meeting-status"
  role          = aws_iam_role.step_functions_lambda.arn
  handler       = "index.lambda_handler"
  runtime       = "python3.12"
  timeout       = 30
  memory_size   = 128

  filename         = data.archive_file.update_meeting_status.output_path
  source_code_hash = data.archive_file.update_meeting_status.output_base64sha256

  environment {
    variables = {
      SUPABASE_SECRET_ARN = aws_secretsmanager_secret.supabase.arn
    }
  }

  depends_on = [aws_cloudwatch_log_group.update_meeting_status]

  tags = {
    Name = "${var.project_name}-update-meeting-status"
  }
}

data "archive_file" "update_meeting_status" {
  type        = "zip"
  output_path = "${path.module}/update_meeting_status.zip"

  source {
    content  = <<-PYTHON
import json
import os
import boto3
import urllib.request
import urllib.error
from datetime import datetime, timezone

secrets_client = boto3.client("secretsmanager")
SUPABASE_SECRET_ARN = os.environ["SUPABASE_SECRET_ARN"]

_supabase_creds = None

def get_supabase_creds():
    global _supabase_creds
    if _supabase_creds is None:
        resp = secrets_client.get_secret_value(SecretId=SUPABASE_SECRET_ARN)
        _supabase_creds = json.loads(resp["SecretString"])
    return _supabase_creds

def lambda_handler(event, context):
    """
    Update meeting status in Supabase.

    Input:
        meeting_id: Meeting identifier
        status: New status (completed, failed)
        notes_generated: Whether notes were successfully generated
        partial: Whether notes are from partial transcript
        error: (optional) Error details if failed
    """
    print(f"Event: {json.dumps(event)}")

    meeting_id = event.get("meeting_id")
    status = event.get("status", "completed")
    notes_generated = event.get("notes_generated", False)
    is_partial = event.get("partial", False)
    error = event.get("error")

    if not meeting_id:
        raise ValueError("meeting_id is required")

    creds = get_supabase_creds()
    supabase_url = creds["url"]
    service_key = creds["service_key"]

    now = datetime.now(timezone.utc).isoformat()

    update_data = {
        "status": status,
        "notes_generated": notes_generated,
        "is_partial_transcript": is_partial,
        "updated_at": now,
    }

    if status == "completed":
        update_data["ended_at"] = now

    if error:
        update_data["error_details"] = json.dumps(error) if isinstance(error, dict) else str(error)

    # Update meeting record via Supabase REST API
    req = urllib.request.Request(
        f"{supabase_url}/rest/v1/zoom_meetings?id=eq.{meeting_id}",
        data=json.dumps(update_data).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Prefer": "return=minimal"
        },
        method="PATCH"
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            print(f"Updated meeting {meeting_id} to status={status}, notes_generated={notes_generated}")
            return {
                "success": True,
                "meeting_id": meeting_id,
                "status": status,
            }

    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"Failed to update meeting {meeting_id}: {e.code} - {error_body}")
        return {
            "success": False,
            "meeting_id": meeting_id,
            "error": error_body,
        }

    except Exception as e:
        print(f"Failed to update meeting {meeting_id}: {e}")
        return {
            "success": False,
            "meeting_id": meeting_id,
            "error": str(e),
        }
PYTHON
    filename = "index.py"
  }
}

# ============================================================================
# Step Functions Lambda IAM Role
# ============================================================================

resource "aws_iam_role" "step_functions_lambda" {
  name = "${var.project_name}-step-functions-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "step_functions_lambda_basic" {
  role       = aws_iam_role.step_functions_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "step_functions_lambda" {
  name = "${var.project_name}-step-functions-lambda-policy"
  role = aws_iam_role.step_functions_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query"
        ]
        Resource = [
          aws_dynamodb_table.chunk_state.arn,
          "${aws_dynamodb_table.chunk_state.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:Query"
        ]
        Resource = [
          aws_dynamodb_table.transcript_segments.arn,
          "${aws_dynamodb_table.transcript_segments.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.supabase.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel"
        ]
        Resource = [
          "arn:aws:bedrock:${var.aws_region}::foundation-model/anthropic.claude-3-haiku-20240307-v1:0",
          "arn:aws:bedrock:${var.aws_region}::foundation-model/anthropic.claude-3-sonnet-*"
        ]
      }
    ]
  })
}

# ============================================================================
# Check Sync Status Lambda (Step Functions task)
# ============================================================================

resource "aws_cloudwatch_log_group" "check_sync_status" {
  name              = "/aws/lambda/${var.project_name}-check-sync-status"
  retention_in_days = 30
}

resource "aws_lambda_function" "check_sync_status" {
  function_name = "${var.project_name}-check-sync-status"
  role          = aws_iam_role.step_functions_lambda.arn
  handler       = "index.lambda_handler"
  runtime       = "python3.12"
  timeout       = 30
  memory_size   = 128

  filename         = data.archive_file.check_sync_status.output_path
  source_code_hash = data.archive_file.check_sync_status.output_base64sha256

  environment {
    variables = {
      TRANSCRIPT_SEGMENTS_TABLE = aws_dynamodb_table.transcript_segments.name
    }
  }

  depends_on = [aws_cloudwatch_log_group.check_sync_status]

  tags = {
    Name = "${var.project_name}-check-sync-status"
  }
}

data "archive_file" "check_sync_status" {
  type        = "zip"
  output_path = "${path.module}/check_sync_status.zip"

  source {
    content  = <<-PYTHON
import json
import os
import boto3

dynamodb = boto3.resource("dynamodb")
TRANSCRIPT_SEGMENTS_TABLE = os.environ["TRANSCRIPT_SEGMENTS_TABLE"]

def lambda_handler(event, context):
    print(f"Received event: {json.dumps(event)}")

    meeting_id = event.get("meeting_id")
    if not meeting_id:
        return {"error": "Missing meeting_id"}

    table = dynamodb.Table(TRANSCRIPT_SEGMENTS_TABLE)

    # Count unsynced segments (pending)
    unsynced_response = table.query(
        IndexName="MeetingSyncIndex",
        KeyConditionExpression="meeting_id = :mid AND synced = :synced",
        ExpressionAttributeValues={
            ":mid": meeting_id,
            ":synced": "false"
        },
        Select="COUNT"
    )
    unsynced_count = unsynced_response.get("Count", 0)

    # Count synced segments (success)
    synced_response = table.query(
        IndexName="MeetingSyncIndex",
        KeyConditionExpression="meeting_id = :mid AND synced = :synced",
        ExpressionAttributeValues={
            ":mid": meeting_id,
            ":synced": "true"
        },
        Select="COUNT"
    )
    synced_count = synced_response.get("Count", 0)

    # Count sync_failed segments (permanent failures)
    failed_response = table.query(
        IndexName="MeetingSyncIndex",
        KeyConditionExpression="meeting_id = :mid AND synced = :synced",
        ExpressionAttributeValues={
            ":mid": meeting_id,
            ":synced": "sync_failed"
        },
        Select="COUNT"
    )
    failed_count = failed_response.get("Count", 0)

    total_segments = unsynced_count + synced_count + failed_count
    # All synced = no pending segments, and at least some processed (synced or failed)
    all_synced = unsynced_count == 0 and total_segments > 0

    result = {
        "meeting_id": meeting_id,
        "totalSegments": total_segments,
        "syncedCount": synced_count,
        "unsyncedCount": unsynced_count,
        "failedCount": failed_count,
        "allSynced": all_synced
    }

    print(f"Sync status: {json.dumps(result)}")
    return result
PYTHON
    filename = "index.py"
  }
}

# ============================================================================
# Supabase Sync Lambda (EventBridge triggered)
# ============================================================================

resource "aws_cloudwatch_log_group" "supabase_sync" {
  name              = "/aws/lambda/${var.project_name}-supabase-sync"
  retention_in_days = 30
}

resource "aws_lambda_function" "supabase_sync" {
  function_name = "${var.project_name}-supabase-sync"
  role          = aws_iam_role.supabase_sync_lambda.arn
  handler       = "index.lambda_handler"
  runtime       = "python3.12"
  timeout       = 60
  memory_size   = 256

  filename         = data.archive_file.supabase_sync.output_path
  source_code_hash = data.archive_file.supabase_sync.output_base64sha256

  environment {
    variables = {
      TRANSCRIPT_SEGMENTS_TABLE = aws_dynamodb_table.transcript_segments.name
      SUPABASE_SECRET_ARN       = aws_secretsmanager_secret.supabase.arn
    }
  }

  # Retry configuration
  reserved_concurrent_executions = 10

  depends_on = [aws_cloudwatch_log_group.supabase_sync]

  tags = {
    Name = "${var.project_name}-supabase-sync"
  }
}

# EventBridge permission to invoke Lambda
resource "aws_lambda_permission" "supabase_sync_eventbridge" {
  statement_id  = "AllowEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.supabase_sync.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.segments_ready.arn
}

# Lambda code for Supabase sync
data "archive_file" "supabase_sync" {
  type        = "zip"
  output_path = "${path.module}/supabase_sync.zip"

  source {
    content  = <<-PYTHON
import json
import os
import boto3
import urllib.request
import urllib.error
from datetime import datetime, timezone

dynamodb = boto3.resource("dynamodb")
secrets_client = boto3.client("secretsmanager")

TRANSCRIPT_SEGMENTS_TABLE = os.environ["TRANSCRIPT_SEGMENTS_TABLE"]
SUPABASE_SECRET_ARN = os.environ["SUPABASE_SECRET_ARN"]

_supabase_creds = None

# Error codes that indicate permanent failures (do not retry)
PERMANENT_ERROR_CODES = {
    "23503",  # FK constraint violation
    "23505",  # Unique constraint violation
    "22P02",  # Invalid input syntax (e.g., invalid UUID)
    "42P01",  # Undefined table
    "42703",  # Undefined column
}

def get_supabase_creds():
    global _supabase_creds
    if _supabase_creds is None:
        resp = secrets_client.get_secret_value(SecretId=SUPABASE_SECRET_ARN)
        _supabase_creds = json.loads(resp["SecretString"])
    return _supabase_creds

def mark_segments_failed(table, meeting_id, segment_ids, error_code, error_message):
    """Mark segments as sync_failed in DynamoDB."""
    now = datetime.now(timezone.utc).isoformat()
    for segment_id in segment_ids:
        table.update_item(
            Key={"meeting_id": meeting_id, "segment_id": segment_id},
            UpdateExpression="SET synced = :synced, sync_error = :error, sync_error_code = :code, failed_at = :failed_at",
            ExpressionAttributeValues={
                ":synced": "sync_failed",
                ":error": error_message,
                ":code": error_code,
                ":failed_at": now
            }
        )
    print(f"Marked {len(segment_ids)} segments as sync_failed: {error_code}")

def is_permanent_error(error_body):
    """Check if the error is permanent (should not retry)."""
    try:
        error_data = json.loads(error_body)
        error_code = error_data.get("code", "")
        return error_code in PERMANENT_ERROR_CODES, error_code, error_data.get("message", "Unknown error")
    except json.JSONDecodeError:
        return False, "unknown", error_body

def lambda_handler(event, context):
    print(f"Received event: {json.dumps(event)}")

    detail = event.get("detail", {})
    meeting_id = detail.get("meeting_id")
    session_id = detail.get("session_id")
    chunk_index = detail.get("chunk_index")

    if not meeting_id:
        print("No meeting_id in event, skipping")
        return {"statusCode": 400, "body": "Missing meeting_id"}

    # Query unsynced segments for this meeting
    table = dynamodb.Table(TRANSCRIPT_SEGMENTS_TABLE)

    response = table.query(
        IndexName="MeetingSyncIndex",
        KeyConditionExpression="meeting_id = :mid AND synced = :synced",
        ExpressionAttributeValues={
            ":mid": meeting_id,
            ":synced": "false"
        }
    )

    segments = response.get("Items", [])
    print(f"Found {len(segments)} unsynced segments for meeting {meeting_id}")

    if not segments:
        return {"statusCode": 200, "body": "No segments to sync"}

    # Get Supabase credentials
    creds = get_supabase_creds()
    supabase_url = creds["url"]
    service_key = creds["service_key"]

    # Prepare segments for Supabase insert
    supabase_segments = []
    for seg in segments:
        supabase_segments.append({
            "meeting_id": seg["meeting_id"],
            "session_id": seg["session_id"],
            "chunk_index": int(seg["chunk_index"]),
            "segment_index": int(seg["segment_index"]),
            "start_time": float(seg["start_time"]),
            "end_time": float(seg["end_time"]),
            "text": seg["text"],
            "speaker": seg.get("speaker"),
            "created_at": seg["created_at"]
        })

    # Insert to Supabase in batches
    batch_size = 100
    synced_segment_ids = []
    failed_segment_ids = []

    for i in range(0, len(supabase_segments), batch_size):
        batch = supabase_segments[i:i+batch_size]
        batch_segment_ids = [seg["segment_id"] for seg in segments[i:i+batch_size]]

        req = urllib.request.Request(
            f"{supabase_url}/rest/v1/transcript_segments",
            data=json.dumps(batch).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "apikey": service_key,
                "Authorization": f"Bearer {service_key}",
                "Prefer": "resolution=merge-duplicates"
            },
            method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                print(f"Supabase insert batch {i//batch_size + 1}: status {resp.status}")
                synced_segment_ids.extend(batch_segment_ids)

        except urllib.error.HTTPError as e:
            error_body = e.read().decode()
            is_permanent, error_code, error_message = is_permanent_error(error_body)

            if is_permanent:
                # FK constraint or other permanent error - mark as failed, do not retry
                if error_code == "23503":
                    print(f"fk_constraint_violation: meeting_id={meeting_id} not found in zoom_meetings")
                else:
                    print(f"permanent_error: code={error_code} meeting_id={meeting_id} message={error_message}")

                mark_segments_failed(table, meeting_id, batch_segment_ids, error_code, error_message)
                failed_segment_ids.extend(batch_segment_ids)
                # Continue to next batch instead of raising
                continue
            else:
                # Transient error (5xx, network) - raise to trigger EventBridge retry
                print(f"transient_error: code={e.code} meeting_id={meeting_id} - will retry")
                raise

        except Exception as e:
            # Network timeout or other transient error - raise to trigger retry
            print(f"transient_error: {type(e).__name__} meeting_id={meeting_id} - will retry")
            raise

    # Update synced status in DynamoDB for successful segments
    now = datetime.now(timezone.utc).isoformat()
    for segment_id in synced_segment_ids:
        table.update_item(
            Key={"meeting_id": meeting_id, "segment_id": segment_id},
            UpdateExpression="SET synced = :synced, synced_at = :synced_at",
            ExpressionAttributeValues={
                ":synced": "true",
                ":synced_at": now
            }
        )

    print(f"Successfully synced {len(synced_segment_ids)} segments, {len(failed_segment_ids)} permanently failed")

    return {
        "statusCode": 200,
        "body": json.dumps({
            "synced_count": len(synced_segment_ids),
            "failed_count": len(failed_segment_ids),
            "meeting_id": meeting_id
        })
    }
PYTHON
    filename = "index.py"
  }
}

# ============================================================================
# Placeholder Lambda code (will be replaced by CI/CD)
# ============================================================================

data "archive_file" "lambda_placeholder" {
  type        = "zip"
  output_path = "${path.module}/lambda_placeholder.zip"

  source {
    content  = <<-EOF
      def lambda_handler(event, context):
          return {"statusCode": 200, "body": "Placeholder - deploy actual code via CI/CD"}
    EOF
    filename = "handler.py"
  }
}

# Flow AI Bot Pipeline - EventBridge Rules

# ============================================================================
# ECS Task State Change Events
# ============================================================================

resource "aws_cloudwatch_event_rule" "ecs_task_state_change" {
  name        = "${var.project_name}-ecs-task-state-change"
  description = "Capture ECS task state changes for bot producer tasks"

  event_pattern = jsonencode({
    source      = ["aws.ecs"]
    detail-type = ["ECS Task State Change"]
    detail = {
      clusterArn = [aws_ecs_cluster.main.arn]
      group      = ["family:${var.project_name}-bot-producer"]
      lastStatus = ["RUNNING", "STOPPED", "DEPROVISIONING"]
    }
  })

  tags = {
    Name = "${var.project_name}-ecs-task-state-change"
  }
}

resource "aws_cloudwatch_event_target" "ecs_task_state_change" {
  rule      = aws_cloudwatch_event_rule.ecs_task_state_change.name
  target_id = "TaskStatusHandler"
  arn       = aws_lambda_function.task_status_handler.arn
}

# ============================================================================
# Spot Instance Interruption Warning
# ============================================================================

resource "aws_cloudwatch_event_rule" "spot_interruption" {
  name        = "${var.project_name}-spot-interruption"
  description = "Capture EC2 Spot Instance interruption warnings"

  event_pattern = jsonencode({
    source      = ["aws.ec2"]
    detail-type = ["EC2 Spot Instance Interruption Warning"]
  })

  tags = {
    Name = "${var.project_name}-spot-interruption"
  }
}

resource "aws_cloudwatch_event_target" "spot_interruption" {
  rule      = aws_cloudwatch_event_rule.spot_interruption.name
  target_id = "SpotInterruptionHandler"
  arn       = aws_lambda_function.task_status_handler.arn

  # Transform event to include interruption context
  input_transformer {
    input_paths = {
      instance_id = "$.detail.instance-id"
      action      = "$.detail.instance-action"
    }
    input_template = <<-EOF
      {
        "eventType": "SPOT_INTERRUPTION",
        "instanceId": <instance_id>,
        "action": <action>
      }
    EOF
  }
}

resource "aws_lambda_permission" "spot_interruption_eventbridge" {
  statement_id  = "AllowSpotInterruptionEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.task_status_handler.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.spot_interruption.arn
}

# ============================================================================
# Transcript Segments Ready Event (triggers Supabase sync)
# ============================================================================

resource "aws_cloudwatch_event_rule" "segments_ready" {
  name        = "${var.project_name}-segments-ready"
  description = "Trigger Supabase sync when transcript segments are ready"

  event_pattern = jsonencode({
    source      = ["flow.transcription"]
    detail-type = ["segments.ready"]
  })

  tags = {
    Name = "${var.project_name}-segments-ready"
  }
}

resource "aws_cloudwatch_event_target" "segments_ready" {
  rule      = aws_cloudwatch_event_rule.segments_ready.name
  target_id = "SupabaseSyncLambda"
  arn       = aws_lambda_function.supabase_sync.arn

  # Retry configuration: 3 retries with exponential backoff
  retry_policy {
    maximum_event_age_in_seconds = 3600
    maximum_retry_attempts       = 3
  }
}

# Flow AI Bot Pipeline - ECS Cluster, Task Definitions, Services

# ============================================================================
# ECR Repositories
# ============================================================================

resource "aws_ecr_repository" "bot_producer" {
  name                 = "${var.project_name}-bot-producer"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "${var.project_name}-bot-producer"
  }
}

resource "aws_ecr_repository" "whisper_consumer" {
  name                 = "${var.project_name}-whisper-consumer"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "${var.project_name}-whisper-consumer"
  }
}

# ============================================================================
# ECS Cluster
# ============================================================================

resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "${var.project_name}-cluster"
  }
}

# ============================================================================
# CloudWatch Log Groups
# ============================================================================

resource "aws_cloudwatch_log_group" "bot_producer" {
  name              = "/ecs/${var.project_name}-bot-producer"
  retention_in_days = 30

  tags = {
    Name = "${var.project_name}-bot-producer-logs"
  }
}

resource "aws_cloudwatch_log_group" "whisper_consumer" {
  name              = "/ecs/${var.project_name}-whisper-consumer"
  retention_in_days = 30

  tags = {
    Name = "${var.project_name}-whisper-consumer-logs"
  }
}

# ============================================================================
# Bot Producer Task Definition (Fargate On-Demand)
# ============================================================================

resource "aws_ecs_task_definition" "bot_producer" {
  family                   = "${var.project_name}-bot-producer"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "1024"
  memory                   = "2048"
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.bot_producer.arn

  container_definitions = jsonencode([
    {
      name      = "rtmp-ingest"
      image     = "${aws_ecr_repository.bot_producer.repository_url}:latest"
      essential = true

      portMappings = [
        {
          containerPort = 1935
          protocol      = "tcp"
        },
        {
          containerPort = 8080
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "CHUNK_DURATION_SECONDS", value = tostring(var.chunk_duration_seconds) },
        { name = "AUDIO_SAMPLE_RATE", value = tostring(var.audio_sample_rate) },
        { name = "AUDIO_FORMAT", value = "pcm_s16le" },
        { name = "S3_BUCKET", value = aws_s3_bucket.audio_chunks.id },
        { name = "SQS_QUEUE_URL", value = aws_sqs_queue.transcription.url },
        { name = "DYNAMODB_CHUNK_TABLE", value = aws_dynamodb_table.chunk_state.name },
        { name = "DYNAMODB_SESSION_TABLE", value = aws_dynamodb_table.sessions.name },
        { name = "AWS_REGION", value = var.aws_region }
      ]

      secrets = [
        {
          name      = "SUPABASE_URL"
          valueFrom = "${aws_secretsmanager_secret.supabase.arn}:url::"
        },
        {
          name      = "SUPABASE_SERVICE_KEY"
          valueFrom = "${aws_secretsmanager_secret.supabase.arn}:service_key::"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.bot_producer.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "producer"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name = "${var.project_name}-bot-producer"
  }
}

# ============================================================================
# Whisper Consumer Task Definition (EC2 GPU)
# ============================================================================

resource "aws_ecs_task_definition" "whisper_consumer" {
  family                   = "${var.project_name}-whisper-consumer"
  network_mode             = "awsvpc"
  requires_compatibilities = ["EC2"]
  cpu                      = "4096"
  memory                   = "15360"  # 15 GB, leaves 1 GB for system
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.whisper_consumer.arn

  container_definitions = jsonencode([
    {
      name      = "whisper-worker"
      image     = "${aws_ecr_repository.whisper_consumer.repository_url}:latest"
      essential = true

      resourceRequirements = [
        {
          type  = "GPU"
          value = "1"
        }
      ]

      environment = [
        { name = "WHISPER_MODEL", value = var.whisper_model },
        { name = "COMPUTE_TYPE", value = var.whisper_compute_type },
        { name = "DEVICE", value = "cuda" },
        { name = "CHUNK_DURATION_SECONDS", value = tostring(var.chunk_duration_seconds) },
        { name = "SQS_QUEUE_URL", value = aws_sqs_queue.transcription.url },
        { name = "S3_BUCKET", value = aws_s3_bucket.audio_chunks.id },
        { name = "DYNAMODB_TABLE", value = aws_dynamodb_table.chunk_state.name },
        { name = "TRANSCRIPT_SEGMENTS_TABLE", value = aws_dynamodb_table.transcript_segments.name },
        { name = "DIARIZATION_ENABLED", value = "false" },
        { name = "AWS_REGION", value = var.aws_region },
        { name = "VISIBILITY_TIMEOUT", value = tostring(var.sqs_visibility_timeout) },
        { name = "HF_HUB_OFFLINE", value = "1" },
        { name = "TRANSFORMERS_OFFLINE", value = "1" }
      ]

      secrets = [
        {
          name      = "HF_TOKEN"
          valueFrom = "${aws_secretsmanager_secret.huggingface.arn}:token::"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.whisper_consumer.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "whisper"
        }
      }

      linuxParameters = {
        initProcessEnabled = true
        sharedMemorySize   = 2048
      }

      stopTimeout = 120
    }
  ])

  placement_constraints {
    type       = "memberOf"
    expression = "attribute:ecs.instance-type matches g4dn.*"
  }

  tags = {
    Name = "${var.project_name}-whisper-consumer"
  }
}

# ============================================================================
# EC2 Launch Template for GPU Instances
# ============================================================================

resource "aws_launch_template" "whisper_gpu" {
  name = "${var.project_name}-whisper-gpu"

  image_id      = data.aws_ssm_parameter.ecs_gpu_ami.value
  instance_type = var.gpu_instance_types[0]  # g4dn.xlarge

  iam_instance_profile {
    arn = aws_iam_instance_profile.ecs_instance.arn
  }

  vpc_security_group_ids = [aws_security_group.whisper_consumer.id]

  user_data = base64encode(<<-EOF
    #!/bin/bash
    echo ECS_CLUSTER=${aws_ecs_cluster.main.name} >> /etc/ecs/ecs.config
    echo ECS_ENABLE_GPU_SUPPORT=true >> /etc/ecs/ecs.config
    echo ECS_ENABLE_SPOT_INSTANCE_DRAINING=true >> /etc/ecs/ecs.config
    echo ECS_CONTAINER_STOP_TIMEOUT=120s >> /etc/ecs/ecs.config
  EOF
  )

  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = 100
      volume_type           = "gp3"
      delete_on_termination = true
      encrypted             = true
    }
  }

  monitoring {
    enabled = true
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name    = "${var.project_name}-whisper-gpu"
      Project = var.project_name
    }
  }

  tags = {
    Name = "${var.project_name}-whisper-gpu-template"
  }
}

# ============================================================================
# Auto Scaling Group for GPU Instances
# ============================================================================

resource "aws_autoscaling_group" "whisper" {
  name                = "${var.project_name}-whisper-asg"
  vpc_zone_identifier = aws_subnet.public[*].id  # Public subnets to avoid NAT Gateway costs
  min_size            = var.whisper_asg_min_size
  max_size            = var.whisper_asg_max_size
  desired_capacity    = 0  # Start with 0, scale up on demand

  capacity_rebalance = true

  # Protect instances from scale-in while running tasks
  protect_from_scale_in = false

  mixed_instances_policy {
    launch_template {
      launch_template_specification {
        launch_template_id = aws_launch_template.whisper_gpu.id
        version            = "$Latest"
      }

      dynamic "override" {
        for_each = var.gpu_instance_types
        content {
          instance_type = override.value
        }
      }
    }

    instances_distribution {
      on_demand_base_capacity                  = 0
      on_demand_percentage_above_base_capacity = 0  # 100% Spot
      spot_allocation_strategy                 = "capacity-optimized"
    }
  }

  tag {
    key                 = "Name"
    value               = "${var.project_name}-whisper-gpu"
    propagate_at_launch = true
  }

  tag {
    key                 = "Project"
    value               = var.project_name
    propagate_at_launch = true
  }

  tag {
    key                 = "AmazonECSManaged"
    value               = "true"
    propagate_at_launch = true
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ============================================================================
# ECS Capacity Provider
# ============================================================================

resource "aws_ecs_capacity_provider" "whisper" {
  name = "${var.project_name}-whisper-capacity-provider"

  auto_scaling_group_provider {
    auto_scaling_group_arn         = aws_autoscaling_group.whisper.arn
    managed_termination_protection = "DISABLED"

    managed_scaling {
      status                    = "ENABLED"
      target_capacity           = 100
      minimum_scaling_step_size = 1
      maximum_scaling_step_size = 2
      instance_warmup_period    = 180
    }
  }

  tags = {
    Name = "${var.project_name}-whisper-capacity-provider"
  }
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = [
    "FARGATE",
    "FARGATE_SPOT",
    aws_ecs_capacity_provider.whisper.name
  ]

  default_capacity_provider_strategy {
    capacity_provider = aws_ecs_capacity_provider.whisper.name
    weight            = 1
    base              = 0
  }
}

# ============================================================================
# Whisper Consumer ECS Service
# ============================================================================

resource "aws_ecs_service" "whisper_consumer" {
  name            = "${var.project_name}-whisper-consumer"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.whisper_consumer.arn
  desired_count   = 0  # Controlled by auto-scaling

  capacity_provider_strategy {
    capacity_provider = aws_ecs_capacity_provider.whisper.name
    weight            = 1
    base              = 0
  }

  network_configuration {
    subnets         = aws_subnet.public[*].id  # Public subnets to avoid NAT Gateway costs
    security_groups = [aws_security_group.whisper_consumer.id]
  }

  # Deployment settings for draining
  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 0

  # Don't wait for steady state (scale-to-zero means 0 tasks is valid)
  wait_for_steady_state = false

  lifecycle {
    ignore_changes = [desired_count]  # Managed by auto-scaling
  }

  tags = {
    Name = "${var.project_name}-whisper-consumer"
  }
}

# ============================================================================
# Auto Scaling for Whisper Service
# ============================================================================

resource "aws_appautoscaling_target" "whisper" {
  max_capacity       = var.whisper_asg_max_size
  min_capacity       = 0
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.whisper_consumer.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Scale up when messages in queue
resource "aws_appautoscaling_policy" "whisper_scale_up" {
  name               = "${var.project_name}-whisper-scale-up"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.whisper.resource_id
  scalable_dimension = aws_appautoscaling_target.whisper.scalable_dimension
  service_namespace  = aws_appautoscaling_target.whisper.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value = 1.0

    customized_metric_specification {
      metric_name = "ApproximateNumberOfMessagesVisible"
      namespace   = "AWS/SQS"
      statistic   = "Average"

      dimensions {
        name  = "QueueName"
        value = aws_sqs_queue.transcription.name
      }
    }

    scale_out_cooldown = 60
    scale_in_cooldown  = 300
  }
}

# ============================================================================
# CloudWatch Alarm for Scale to Zero
# ============================================================================

resource "aws_cloudwatch_metric_alarm" "whisper_queue_empty" {
  alarm_name          = "${var.project_name}-whisper-queue-empty"
  comparison_operator = "LessThanOrEqualToThreshold"
  evaluation_periods  = 5
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Maximum"
  threshold           = 0
  alarm_description   = "Scale Whisper to 0 when queue is empty"
  treat_missing_data  = "breaching"

  dimensions = {
    QueueName = aws_sqs_queue.transcription.name
  }

  alarm_actions = [aws_appautoscaling_policy.whisper_scale_down.arn]
}

resource "aws_appautoscaling_policy" "whisper_scale_down" {
  name               = "${var.project_name}-whisper-scale-down"
  policy_type        = "StepScaling"
  resource_id        = aws_appautoscaling_target.whisper.resource_id
  scalable_dimension = aws_appautoscaling_target.whisper.scalable_dimension
  service_namespace  = aws_appautoscaling_target.whisper.service_namespace

  step_scaling_policy_configuration {
    adjustment_type         = "ExactCapacity"
    cooldown                = 300
    metric_aggregation_type = "Maximum"

    step_adjustment {
      scaling_adjustment          = 0
      metric_interval_upper_bound = 0
    }
  }
}

# Flow AI Bot Pipeline - CodeBuild Projects for Container Builds

# ============================================================================
# CodeBuild IAM Role
# ============================================================================

resource "aws_iam_role" "codebuild" {
  name = "${var.project_name}-codebuild-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "codebuild.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "codebuild" {
  name = "${var.project_name}-codebuild-policy"
  role = aws_iam_role.codebuild.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/codebuild/${var.project_name}-*",
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/codebuild/${var.project_name}-*:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload"
        ]
        Resource = [
          aws_ecr_repository.bot_producer.arn,
          aws_ecr_repository.whisper_consumer.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:PutObject"
        ]
        Resource = [
          "${aws_s3_bucket.audio_chunks.arn}/codebuild/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.huggingface.arn
        ]
      }
    ]
  })
}

# ============================================================================
# Bot Producer CodeBuild Project
# ============================================================================

resource "aws_codebuild_project" "bot_producer" {
  name          = "${var.project_name}-bot-producer-build"
  description   = "Build bot-producer container image"
  build_timeout = 30
  service_role  = aws_iam_role.codebuild.arn

  artifacts {
    type = "NO_ARTIFACTS"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_MEDIUM"
    image                       = "aws/codebuild/amazonlinux2-x86_64-standard:5.0"
    type                        = "LINUX_CONTAINER"
    privileged_mode             = true
    image_pull_credentials_type = "CODEBUILD"

    environment_variable {
      name  = "AWS_ACCOUNT_ID"
      value = data.aws_caller_identity.current.account_id
    }

    environment_variable {
      name  = "AWS_DEFAULT_REGION"
      value = var.aws_region
    }

    environment_variable {
      name  = "IMAGE_REPO_NAME"
      value = aws_ecr_repository.bot_producer.name
    }

    environment_variable {
      name  = "IMAGE_TAG"
      value = "latest"
    }
  }

  source {
    type      = "NO_SOURCE"
    buildspec = <<-EOF
      version: 0.2
      phases:
        pre_build:
          commands:
            - echo Logging in to Amazon ECR...
            - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
            - REPOSITORY_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME
        build:
          commands:
            - echo Build started on `date`
            - echo Building the Docker image...
            - |
              cat > Dockerfile << 'DOCKERFILE'
              FROM public.ecr.aws/ubuntu/ubuntu:22.04
              ENV DEBIAN_FRONTEND=noninteractive
              RUN apt-get update && apt-get install -y nginx libnginx-mod-rtmp ffmpeg python3 python3-pip curl && rm -rf /var/lib/apt/lists/*
              RUN pip3 install boto3 python-dotenv watchdog aiohttp structlog
              RUN pip3 install supervisor
              COPY nginx.conf /etc/nginx/nginx.conf
              COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
              COPY start_chunker.sh /app/start_chunker.sh
              COPY app/ /app/
              RUN chmod +x /app/start_chunker.sh
              RUN mkdir -p /var/log/app /var/log/supervisor /tmp/chunks
              WORKDIR /app
              EXPOSE 8080 1935
              CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
              DOCKERFILE
            - |
              cat > nginx.conf << 'NGINX'
              load_module modules/ngx_rtmp_module.so;
              worker_processes auto;
              error_log /var/log/nginx/error.log warn;
              pid /var/run/nginx.pid;
              events { worker_connections 1024; }
              rtmp {
                server {
                  listen 1935;
                  chunk_size 4096;
                  application live {
                    live on;
                    record off;
                    allow publish all;
                    allow play 127.0.0.1;
                    deny play all;
                    on_publish http://127.0.0.1:8080/hooks/on_publish;
                    on_publish_done http://127.0.0.1:8080/hooks/on_publish_done;
                  }
                }
              }
              http {
                include /etc/nginx/mime.types;
                default_type application/octet-stream;
                access_log /var/log/nginx/access.log;
                sendfile on;
                keepalive_timeout 65;
                upstream app { server 127.0.0.1:8081; }
                server {
                  listen 8080;
                  location /health { proxy_pass http://app/health; }
                  location /hooks/ { proxy_pass http://app/hooks/; }
                }
              }
              NGINX
            - |
              cat > supervisord.conf << 'SUPERVISOR'
              [supervisord]
              nodaemon=true
              logfile=/dev/stdout
              logfile_maxbytes=0
              pidfile=/var/run/supervisord.pid
              [program:nginx]
              command=/usr/sbin/nginx -g "daemon off;"
              autostart=true
              autorestart=true
              priority=10
              stdout_logfile=/dev/stdout
              stdout_logfile_maxbytes=0
              stderr_logfile=/dev/stderr
              stderr_logfile_maxbytes=0
              [program:app]
              command=python3 /app/main.py
              directory=/app
              autostart=true
              autorestart=true
              priority=20
              environment=PYTHONUNBUFFERED="1"
              stdout_logfile=/dev/stdout
              stdout_logfile_maxbytes=0
              stderr_logfile=/dev/stderr
              stderr_logfile_maxbytes=0
              [unix_http_server]
              file=/var/run/supervisor.sock
              [rpcinterface:supervisor]
              supervisor.rpcinterface_factory = supervisor.rpcinterface:make_main_rpcinterface
              [supervisorctl]
              serverurl=unix:///var/run/supervisor.sock
              SUPERVISOR
            - |
              cat > start_chunker.sh << 'CHUNKER'
              #!/bin/bash
              SESSION_ID="$1"
              CHUNK_DURATION="$${CHUNK_DURATION_SECONDS:-30}"
              SAMPLE_RATE="$${AUDIO_SAMPLE_RATE:-16000}"
              CHUNK_DIR="/tmp/chunks/$${SESSION_ID}"
              mkdir -p "$CHUNK_DIR"
              echo "[$(date -Iseconds)] Starting chunker for session: $${SESSION_ID}" >> /tmp/chunker.log
              sleep 2
              exec ffmpeg -hide_banner -loglevel warning \
                -i "rtmp://127.0.0.1:1935/live/$${SESSION_ID}" \
                -vn -acodec pcm_s16le -ar "$SAMPLE_RATE" -ac 1 \
                -f segment -segment_time "$CHUNK_DURATION" -segment_format wav \
                -reset_timestamps 1 "$${CHUNK_DIR}/chunk_%05d.wav" 2>> /tmp/chunker.log
              CHUNKER
            - mkdir -p app
            - |
              cat > app/__init__.py << 'INIT'
              # Flow AI Bot Producer
              INIT
            - |
              cat > app/main.py << 'MAIN'
              import asyncio
              import os
              import signal
              from datetime import datetime, timezone
              from typing import Dict
              import structlog
              from aiohttp import web
              from chunker import ChunkUploader
              structlog.configure(processors=[structlog.stdlib.add_log_level,structlog.processors.TimeStamper(fmt="iso"),structlog.processors.JSONRenderer()],wrapper_class=structlog.stdlib.BoundLogger,context_class=dict,logger_factory=structlog.PrintLoggerFactory())
              log = structlog.get_logger()
              active_sessions: Dict[str, ChunkUploader] = {}
              shutdown_event = asyncio.Event()
              async def health_handler(request):
                  return web.json_response({"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat(), "active_sessions": len(active_sessions)})
              async def on_publish_handler(request):
                  data = await request.post()
                  stream_key = data.get("name", "")
                  if not stream_key:
                      return web.Response(status=400, text="Missing stream key")
                  log.info("stream_started", session_id=stream_key)
                  if stream_key not in active_sessions:
                      uploader = ChunkUploader(session_id=stream_key)
                      active_sessions[stream_key] = uploader
                      asyncio.create_task(uploader.start())
                  return web.Response(status=200, text="OK")
              async def on_publish_done_handler(request):
                  data = await request.post()
                  stream_key = data.get("name", "")
                  if not stream_key:
                      return web.Response(status=400, text="Missing stream key")
                  log.info("stream_ended", session_id=stream_key)
                  if stream_key in active_sessions:
                      uploader = active_sessions[stream_key]
                      await uploader.stop()
                      del active_sessions[stream_key]
                  return web.Response(status=200, text="OK")
              def create_app():
                  app = web.Application()
                  app.router.add_get("/health", health_handler)
                  app.router.add_post("/hooks/on_publish", on_publish_handler)
                  app.router.add_post("/hooks/on_publish_done", on_publish_done_handler)
                  return app
              def main():
                  log.info("starting_bot_producer", chunk_duration=os.getenv("CHUNK_DURATION_SECONDS", "30"))
                  os.makedirs("/var/log/app", exist_ok=True)
                  os.makedirs("/tmp/chunks", exist_ok=True)
                  app = create_app()
                  web.run_app(app, host="0.0.0.0", port=8081, print=None)
              if __name__ == "__main__":
                  main()
              MAIN
            - |
              cat > app/chunker.py << 'CHUNKER_PY'
              import asyncio
              import json
              import os
              import re
              from datetime import datetime, timezone
              from pathlib import Path
              from typing import Optional
              import boto3
              import structlog
              from watchdog.events import FileSystemEventHandler
              from watchdog.observers import Observer
              log = structlog.get_logger()
              S3_BUCKET = os.getenv("S3_BUCKET")
              SQS_QUEUE_URL = os.getenv("SQS_QUEUE_URL")
              DYNAMODB_CHUNK_TABLE = os.getenv("DYNAMODB_CHUNK_TABLE")
              DYNAMODB_SESSION_TABLE = os.getenv("DYNAMODB_SESSION_TABLE")
              CHUNK_DURATION_SECONDS = int(os.getenv("CHUNK_DURATION_SECONDS", "30"))
              AWS_REGION = os.getenv("AWS_REGION", os.getenv("AWS_REGION_NAME", "us-east-1"))
              s3_client = boto3.client("s3", region_name=AWS_REGION)
              sqs_client = boto3.client("sqs", region_name=AWS_REGION)
              dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
              class ChunkHandler(FileSystemEventHandler):
                  def __init__(self, uploader):
                      self.uploader = uploader
                  def on_created(self, event):
                      if not event.is_directory and event.src_path.endswith(".wav"):
                          asyncio.run_coroutine_threadsafe(self.uploader.process_chunk(event.src_path), self.uploader.loop)
              class ChunkUploader:
                  def __init__(self, session_id: str):
                      self.session_id = session_id
                      self.chunk_dir = Path(f"/tmp/chunks/{session_id}")
                      self.chunks_uploaded = 0
                      self.start_time = None
                      self.meeting_id = None
                      self.observer = None
                      self.loop = None
                      self._running = False
                      self.ffmpeg_proc = None
                  async def start(self):
                      import subprocess
                      self.loop = asyncio.get_running_loop()
                      self._running = True
                      self.start_time = datetime.now(timezone.utc)
                      self.chunk_dir.mkdir(parents=True, exist_ok=True)
                      await self._load_session()
                      self.observer = Observer()
                      handler = ChunkHandler(self)
                      self.observer.schedule(handler, str(self.chunk_dir), recursive=False)
                      self.observer.start()
                      sample_rate = os.getenv("AUDIO_SAMPLE_RATE", "16000")
                      chunk_duration = os.getenv("CHUNK_DURATION_SECONDS", "30")
                      rtmp_url = f"rtmp://127.0.0.1:1935/live/{self.session_id}"
                      ffmpeg_cmd = ["ffmpeg", "-hide_banner", "-loglevel", "warning", "-i", rtmp_url, "-vn", "-acodec", "pcm_s16le", "-ar", sample_rate, "-ac", "1", "-f", "segment", "-segment_time", chunk_duration, "-segment_format", "wav", "-reset_timestamps", "1", f"{self.chunk_dir}/chunk_%05d.wav"]
                      log.info("starting_ffmpeg", session_id=self.session_id, cmd=" ".join(ffmpeg_cmd))
                      self.ffmpeg_proc = subprocess.Popen(ffmpeg_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
                      log.info("chunk_uploader_started", session_id=self.session_id, meeting_id=self.meeting_id, ffmpeg_pid=self.ffmpeg_proc.pid)
                      await self._process_existing_chunks()
                  async def stop(self):
                      log.info("chunk_uploader_stopping", session_id=self.session_id)
                      self._running = False
                      if self.ffmpeg_proc:
                          self.ffmpeg_proc.terminate()
                          try:
                              self.ffmpeg_proc.wait(timeout=5)
                          except:
                              self.ffmpeg_proc.kill()
                          stderr = self.ffmpeg_proc.stderr.read().decode() if self.ffmpeg_proc.stderr else ""
                          if stderr:
                              log.info("ffmpeg_stderr", session_id=self.session_id, stderr=stderr[:500])
                      if self.observer:
                          self.observer.stop()
                          self.observer.join(timeout=5)
                      await asyncio.sleep(2)
                      await self._process_existing_chunks()
                      await self._update_session_complete()
                      log.info("chunk_uploader_stopped", session_id=self.session_id, total_chunks=self.chunks_uploaded)
                  async def _load_session(self):
                      try:
                          table = dynamodb.Table(DYNAMODB_SESSION_TABLE)
                          response = table.get_item(Key={"session_id": self.session_id})
                          item = response.get("Item", {})
                          self.meeting_id = item.get("meeting_id")
                      except Exception as e:
                          log.error("session_load_failed", session_id=self.session_id, error=str(e))
                  async def _process_existing_chunks(self):
                      if not self.chunk_dir.exists():
                          return
                      chunks = sorted(self.chunk_dir.glob("chunk_*.wav"), key=lambda p: self._extract_chunk_index(p.name))
                      for chunk_path in chunks:
                          await self.process_chunk(str(chunk_path))
                  async def process_chunk(self, chunk_path: str):
                      path = Path(chunk_path)
                      if not path.exists():
                          return
                      await self._wait_for_file_complete(path)
                      chunk_index = self._extract_chunk_index(path.name)
                      s3_key = f"meetings/{self.meeting_id}/{self.session_id}/chunk_{chunk_index:05d}.wav"
                      try:
                          await asyncio.get_running_loop().run_in_executor(None, lambda: s3_client.upload_file(str(path), S3_BUCKET, s3_key, ExtraArgs={"ContentType": "audio/wav"}))
                          start_time_seconds = chunk_index * CHUNK_DURATION_SECONDS
                          message = {"meeting_id": self.meeting_id, "session_id": self.session_id, "chunk_index": chunk_index, "s3_bucket": S3_BUCKET, "s3_key": s3_key, "start_time_seconds": start_time_seconds, "duration_seconds": CHUNK_DURATION_SECONDS, "timestamp": datetime.now(timezone.utc).isoformat()}
                          await asyncio.get_running_loop().run_in_executor(None, lambda: sqs_client.send_message(QueueUrl=SQS_QUEUE_URL, MessageBody=json.dumps(message)))
                          await self._update_chunk_state(chunk_index, s3_key)
                          path.unlink(missing_ok=True)
                          self.chunks_uploaded += 1
                          log.info("chunk_processed", session_id=self.session_id, meeting_id=self.meeting_id, chunk_index=chunk_index)
                      except Exception as e:
                          log.error("chunk_processing_failed", session_id=self.session_id, chunk_index=chunk_index, error=str(e))
                  async def _wait_for_file_complete(self, path, timeout=35.0):
                      prev_size = -1
                      stable_count = 0
                      min_size = 100000
                      for _ in range(int(timeout * 10)):
                          if not path.exists():
                              return
                          current_size = path.stat().st_size
                          if current_size == prev_size and current_size >= min_size:
                              stable_count += 1
                              if stable_count >= 3:
                                  log.info("file_ready", path=str(path), size=current_size)
                                  return
                          else:
                              stable_count = 0
                              prev_size = current_size
                          await asyncio.sleep(0.1)
                  def _extract_chunk_index(self, filename):
                      match = re.search(r"chunk_(\d+)\.wav", filename)
                      return int(match.group(1)) if match else 0
                  async def _update_chunk_state(self, chunk_index, s3_key):
                      try:
                          table = dynamodb.Table(DYNAMODB_CHUNK_TABLE)
                          await asyncio.get_running_loop().run_in_executor(None, lambda: table.put_item(Item={"meeting_id": self.meeting_id, "chunk_index": chunk_index, "session_id": self.session_id, "s3_key": s3_key, "status": "uploaded", "uploaded_at": datetime.now(timezone.utc).isoformat(), "ttl": int(datetime.now(timezone.utc).timestamp()) + 86400 * 7}))
                      except Exception as e:
                          log.error("chunk_state_update_failed", session_id=self.session_id, chunk_index=chunk_index, error=str(e))
                  async def _update_session_complete(self):
                      try:
                          table = dynamodb.Table(DYNAMODB_SESSION_TABLE)
                          await asyncio.get_running_loop().run_in_executor(None, lambda: table.update_item(Key={"session_id": self.session_id}, UpdateExpression="SET #status = :status, ended_at = :ended_at, total_chunks = :chunks", ExpressionAttributeNames={"#status": "status"}, ExpressionAttributeValues={":status": "stream_ended", ":ended_at": datetime.now(timezone.utc).isoformat(), ":chunks": self.chunks_uploaded}))
                      except Exception as e:
                          log.error("session_update_failed", session_id=self.session_id, error=str(e))
              CHUNKER_PY
            - docker build -t $REPOSITORY_URI:$IMAGE_TAG .
        post_build:
          commands:
            - echo Build completed on `date`
            - echo Pushing the Docker image...
            - docker push $REPOSITORY_URI:$IMAGE_TAG
            - echo Image pushed successfully
    EOF
  }

  logs_config {
    cloudwatch_logs {
      group_name  = "/aws/codebuild/${var.project_name}-bot-producer-build"
      stream_name = "build-log"
    }
  }

  tags = {
    Name = "${var.project_name}-bot-producer-build"
  }
}

# ============================================================================
# Whisper Consumer CodeBuild Project
# ============================================================================

resource "aws_codebuild_project" "whisper_consumer" {
  name          = "${var.project_name}-whisper-consumer-build"
  description   = "Build whisper-consumer container image with CUDA and ML models"
  build_timeout = 60
  service_role  = aws_iam_role.codebuild.arn

  artifacts {
    type = "NO_ARTIFACTS"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_LARGE"
    image                       = "aws/codebuild/amazonlinux2-x86_64-standard:5.0"
    type                        = "LINUX_CONTAINER"
    privileged_mode             = true
    image_pull_credentials_type = "CODEBUILD"

    environment_variable {
      name  = "AWS_ACCOUNT_ID"
      value = data.aws_caller_identity.current.account_id
    }

    environment_variable {
      name  = "AWS_DEFAULT_REGION"
      value = var.aws_region
    }

    environment_variable {
      name  = "IMAGE_REPO_NAME"
      value = aws_ecr_repository.whisper_consumer.name
    }

    environment_variable {
      name  = "IMAGE_TAG"
      value = "latest"
    }

    environment_variable {
      name  = "WHISPER_MODEL"
      value = var.whisper_model
    }

    environment_variable {
      name  = "HF_TOKEN"
      value = "${aws_secretsmanager_secret.huggingface.arn}:token::"
      type  = "SECRETS_MANAGER"
    }
  }

  source {
    type      = "NO_SOURCE"
    buildspec = <<-EOF
      version: 0.2
      phases:
        pre_build:
          commands:
            - echo Logging in to Amazon ECR...
            - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
            - REPOSITORY_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME
        build:
          commands:
            - echo Build started on `date`
            - echo Building Whisper Consumer Docker image with model $WHISPER_MODEL...
            - |
              cat > Dockerfile << 'DOCKERFILE'
              FROM nvcr.io/nvidia/cuda:12.1.1-cudnn8-runtime-ubuntu22.04
              ENV DEBIAN_FRONTEND=noninteractive
              ENV PYTHONUNBUFFERED=1
              RUN apt-get update && apt-get install -y python3 python3-pip ffmpeg curl git && rm -rf /var/lib/apt/lists/*
              RUN useradd -m -s /bin/bash whisper
              ENV HOME=/home/whisper
              RUN pip3 install --no-cache-dir faster-whisper>=1.0.0 pyannote.audio>=3.1.0 torch torchaudio boto3 supabase>=2.3.0 structlog numpy
              ARG WHISPER_MODEL=large-v3-turbo
              ARG HF_TOKEN
              ENV WHISPER_MODEL=$${WHISPER_MODEL}
              ENV HF_TOKEN=$${HF_TOKEN}
              ENV XDG_CACHE_HOME=/home/whisper/.cache
              ENV HF_HOME=/home/whisper/.cache/huggingface
              RUN mkdir -p /home/whisper/.cache/huggingface && chown -R whisper:whisper /home/whisper/.cache
              USER whisper
              # Pre-download Whisper model
              RUN python3 -c "from faster_whisper import WhisperModel; import os; model = os.environ.get('WHISPER_MODEL', 'large-v3-turbo'); print(f'Downloading Whisper model: {model}'); m = WhisperModel(model, device='cpu', compute_type='int8'); print('Whisper model downloaded successfully')"
              # Pre-download pyannote diarization model (requires HF token with access to gated models)
              RUN python3 -c "from pyannote.audio import Pipeline; import os; token = os.environ.get('HF_TOKEN'); print('Downloading pyannote pipeline...'); Pipeline.from_pretrained('pyannote/speaker-diarization-3.1', token=token); print('Pyannote pipeline downloaded successfully')" || echo "Pyannote download skipped (no HF token or access)"
              USER root
              COPY app/ /app/
              RUN chown -R whisper:whisper /app
              WORKDIR /app
              USER whisper
              CMD ["python3", "main.py"]
              DOCKERFILE
            - mkdir -p app
            - |
              cat > app/__init__.py << 'INIT'
              # Flow AI Whisper Consumer
              INIT
            - |
              cat > app/main.py << 'MAIN'
              import json
              import os
              import signal
              import tempfile
              import time
              from datetime import datetime, timezone
              from pathlib import Path
              from typing import Any, Dict, List, Optional
              import boto3
              import structlog
              from botocore.exceptions import ClientError
              from asr import ASRProcessor
              from diarization import DiarizationProcessor
              structlog.configure(processors=[structlog.stdlib.add_log_level,structlog.processors.TimeStamper(fmt="iso"),structlog.processors.JSONRenderer()],wrapper_class=structlog.stdlib.BoundLogger,context_class=dict,logger_factory=structlog.PrintLoggerFactory())
              log = structlog.get_logger()
              SQS_QUEUE_URL = os.environ.get("SQS_QUEUE_URL")
              S3_BUCKET = os.environ.get("S3_BUCKET")
              DYNAMODB_TABLE = os.environ.get("DYNAMODB_TABLE")
              TRANSCRIPT_SEGMENTS_TABLE = os.environ.get("TRANSCRIPT_SEGMENTS_TABLE")
              WHISPER_MODEL = os.environ.get("WHISPER_MODEL", "large-v3-turbo")
              COMPUTE_TYPE = os.environ.get("COMPUTE_TYPE", "float16")
              DEVICE = os.environ.get("DEVICE", "cuda")
              VISIBILITY_TIMEOUT = int(os.environ.get("VISIBILITY_TIMEOUT", "300"))
              DIARIZATION_ENABLED = os.environ.get("DIARIZATION_ENABLED", "true").lower() == "true"
              AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")
              sqs = boto3.client("sqs", region_name=AWS_REGION)
              s3 = boto3.client("s3", region_name=AWS_REGION)
              dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
              events = boto3.client("events", region_name=AWS_REGION)
              shutdown_requested = False
              def signal_handler(signum, frame):
                  global shutdown_requested
                  log.info("shutdown_signal_received", signal=signum)
                  shutdown_requested = True
              def main():
                  global shutdown_requested
                  signal.signal(signal.SIGTERM, signal_handler)
                  signal.signal(signal.SIGINT, signal_handler)
                  log.info("whisper_consumer_starting", model=WHISPER_MODEL, device=DEVICE, compute_type=COMPUTE_TYPE)
                  asr_processor = ASRProcessor(model_name=WHISPER_MODEL, device=DEVICE, compute_type=COMPUTE_TYPE)
                  diarization_processor = None
                  if DIARIZATION_ENABLED:
                      hf_token = os.environ.get("HF_TOKEN")
                      if hf_token:
                          diarization_processor = DiarizationProcessor(hf_token=hf_token)
                  log.info("processors_initialized")
                  while not shutdown_requested:
                      try:
                          process_messages(asr_processor, diarization_processor)
                      except Exception as e:
                          log.error("polling_error", error=str(e))
                          if not shutdown_requested:
                              time.sleep(5)
                  log.info("whisper_consumer_shutdown_complete")
              def process_messages(asr_processor, diarization_processor):
                  try:
                      response = sqs.receive_message(QueueUrl=SQS_QUEUE_URL, MaxNumberOfMessages=1, WaitTimeSeconds=20, VisibilityTimeout=VISIBILITY_TIMEOUT)
                  except ClientError as e:
                      log.error("sqs_receive_error", error=str(e))
                      return
                  messages = response.get("Messages", [])
                  if not messages:
                      return
                  for message in messages:
                      if shutdown_requested:
                          return
                      try:
                          body = json.loads(message["Body"])
                          process_chunk(body, asr_processor, diarization_processor)
                          sqs.delete_message(QueueUrl=SQS_QUEUE_URL, ReceiptHandle=message["ReceiptHandle"])
                      except Exception as e:
                          log.error("message_processing_failed", message_id=message["MessageId"], error=str(e))
              def process_chunk(message, asr_processor, diarization_processor):
                  meeting_id = message["meeting_id"]
                  session_id = message["session_id"]
                  chunk_index = message["chunk_index"]
                  s3_key = message["s3_key"]
                  start_time_seconds = message.get("start_time_seconds", 0)
                  log.info("processing_chunk", meeting_id=meeting_id, chunk_index=chunk_index)
                  with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_file:
                      audio_path = tmp_file.name
                  try:
                      s3.download_file(S3_BUCKET, s3_key, audio_path)
                      asr_result = asr_processor.transcribe(audio_path)
                      diarization_result = None
                      if diarization_processor:
                          diarization_result = diarization_processor.diarize(audio_path)
                      segments = merge_asr_diarization(asr_result, diarization_result, start_time_seconds)
                      if segments:
                          write_segments_to_dynamodb(meeting_id, session_id, chunk_index, segments)
                          emit_segments_ready_event(meeting_id, session_id, chunk_index, len(segments))
                      update_chunk_state(meeting_id, chunk_index, len(segments))
                      try:
                          s3.delete_object(Bucket=S3_BUCKET, Key=s3_key)
                      except Exception as e:
                          log.warning("s3_delete_failed", error=str(e))
                      log.info("chunk_processed", meeting_id=meeting_id, chunk_index=chunk_index, segment_count=len(segments))
                  finally:
                      Path(audio_path).unlink(missing_ok=True)
              def merge_asr_diarization(asr_result, diarization_result, time_offset):
                  segments = []
                  for asr_segment in asr_result.segments:
                      start = asr_segment.start + time_offset
                      end = asr_segment.end + time_offset
                      text = asr_segment.text.strip()
                      if not text:
                          continue
                      speaker = "SPEAKER_00"
                      if diarization_result:
                          speaker = find_speaker_for_segment(diarization_result, asr_segment.start, asr_segment.end)
                      segments.append({"start_time": start, "end_time": end, "text": text, "speaker": speaker})
                  return segments
              def find_speaker_for_segment(diarization_result, start, end):
                  speaker_durations = {}
                  for diar_segment in diarization_result.segments:
                      overlap_start = max(start, diar_segment.start)
                      overlap_end = min(end, diar_segment.end)
                      if overlap_start < overlap_end:
                          duration = overlap_end - overlap_start
                          speaker = diar_segment.speaker
                          speaker_durations[speaker] = speaker_durations.get(speaker, 0) + duration
                  return max(speaker_durations, key=speaker_durations.get) if speaker_durations else "SPEAKER_00"
              def write_segments_to_dynamodb(meeting_id, session_id, chunk_index, segments):
                  table = dynamodb.Table(TRANSCRIPT_SEGMENTS_TABLE)
                  created_at = datetime.now(timezone.utc).isoformat()
                  with table.batch_writer() as batch:
                      for i, seg in enumerate(segments):
                          segment_id = f"{chunk_index:05d}#{i:05d}"
                          item = {"meeting_id": meeting_id, "segment_id": segment_id, "session_id": session_id, "chunk_index": chunk_index, "segment_index": i, "start_time": str(seg["start_time"]), "end_time": str(seg["end_time"]), "text": seg["text"], "speaker": seg["speaker"], "synced": "false", "created_at": created_at}
                          batch.put_item(Item=item)
                  log.info("segments_written_to_dynamodb", meeting_id=meeting_id, chunk_index=chunk_index, count=len(segments))
              def emit_segments_ready_event(meeting_id, session_id, chunk_index, segment_count):
                  try:
                      events.put_events(Entries=[{"Source": "flow.transcription", "DetailType": "segments.ready", "Detail": json.dumps({"meeting_id": meeting_id, "session_id": session_id, "chunk_index": chunk_index, "segment_count": segment_count})}])
                      log.info("segments_ready_event_emitted", meeting_id=meeting_id, chunk_index=chunk_index)
                  except Exception as e:
                      log.error("eventbridge_put_failed", error=str(e))
              def update_chunk_state(meeting_id, chunk_index, segment_count):
                  table = dynamodb.Table(DYNAMODB_TABLE)
                  try:
                      table.update_item(Key={"meeting_id": meeting_id, "chunk_index": chunk_index}, UpdateExpression="SET #status = :status, segment_count = :count, processed_at = :processed", ExpressionAttributeNames={"#status": "status"}, ExpressionAttributeValues={":status": "completed", ":count": segment_count, ":processed": datetime.now(timezone.utc).isoformat()})
                  except Exception as e:
                      log.error("dynamodb_update_failed", error=str(e))
              if __name__ == "__main__":
                  main()
              MAIN
            - |
              cat > app/asr.py << 'ASR'
              from dataclasses import dataclass
              from typing import List, Optional
              import structlog
              from faster_whisper import WhisperModel
              log = structlog.get_logger()
              @dataclass
              class ASRSegment:
                  start: float
                  end: float
                  text: str
                  avg_logprob: Optional[float] = None
              @dataclass
              class ASRResult:
                  segments: List[ASRSegment]
                  language: str
                  language_probability: float
              class ASRProcessor:
                  def __init__(self, model_name="large-v3-turbo", device="cuda", compute_type="float16"):
                      self.model_name = model_name
                      self.device = device
                      self.compute_type = compute_type
                      self._model = None
                  @property
                  def model(self):
                      if self._model is None:
                          log.info("loading_whisper_model", model=self.model_name, device=self.device)
                          self._model = WhisperModel(self.model_name, device=self.device, compute_type=self.compute_type)
                          log.info("whisper_model_loaded")
                      return self._model
                  def transcribe(self, audio_path, language=None, initial_prompt=None):
                      segments_generator, info = self.model.transcribe(audio_path, language=language, initial_prompt=initial_prompt, beam_size=5, vad_filter=True)
                      segments = [ASRSegment(start=s.start, end=s.end, text=s.text, avg_logprob=s.avg_logprob) for s in segments_generator]
                      return ASRResult(segments=segments, language=info.language, language_probability=info.language_probability)
              ASR
            - |
              cat > app/diarization.py << 'DIAR'
              from dataclasses import dataclass
              from typing import List, Optional
              import structlog
              import torch
              log = structlog.get_logger()
              @dataclass
              class DiarizationSegment:
                  start: float
                  end: float
                  speaker: str
              @dataclass
              class DiarizationResult:
                  segments: List[DiarizationSegment]
              class DiarizationProcessor:
                  def __init__(self, hf_token, device=None):
                      self.hf_token = hf_token
                      self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
                      self._pipeline = None
                  @property
                  def pipeline(self):
                      if self._pipeline is None:
                          log.info("loading_diarization_pipeline", device=self.device)
                          from pyannote.audio import Pipeline
                          self._pipeline = Pipeline.from_pretrained("pyannote/speaker-diarization-3.1", token=self.hf_token)
                          if self.device == "cuda":
                              self._pipeline.to(torch.device("cuda"))
                          log.info("diarization_pipeline_loaded")
                      return self._pipeline
                  def diarize(self, audio_path, min_speakers=None, max_speakers=None):
                      kwargs = {}
                      if min_speakers:
                          kwargs["min_speakers"] = min_speakers
                      if max_speakers:
                          kwargs["max_speakers"] = max_speakers
                      diarization = self.pipeline(audio_path, **kwargs)
                      segments = [DiarizationSegment(start=turn.start, end=turn.end, speaker=speaker) for turn, _, speaker in diarization.itertracks(yield_label=True)]
                      return DiarizationResult(segments=segments)
              DIAR
            - docker build --build-arg WHISPER_MODEL=$WHISPER_MODEL --build-arg HF_TOKEN=$HF_TOKEN -t $REPOSITORY_URI:$IMAGE_TAG .
        post_build:
          commands:
            - echo Build completed on `date`
            - echo Pushing the Docker image...
            - docker push $REPOSITORY_URI:$IMAGE_TAG
            - echo Image pushed successfully
            - echo "Image URI:" $REPOSITORY_URI:$IMAGE_TAG
    EOF
  }

  logs_config {
    cloudwatch_logs {
      group_name  = "/aws/codebuild/${var.project_name}-whisper-consumer-build"
      stream_name = "build-log"
    }
  }

  tags = {
    Name = "${var.project_name}-whisper-consumer-build"
  }
}

# ============================================================================
# Outputs
# ============================================================================

output "codebuild_bot_producer_project" {
  description = "CodeBuild project name for bot-producer"
  value       = aws_codebuild_project.bot_producer.name
}

output "codebuild_whisper_consumer_project" {
  description = "CodeBuild project name for whisper-consumer"
  value       = aws_codebuild_project.whisper_consumer.name
}

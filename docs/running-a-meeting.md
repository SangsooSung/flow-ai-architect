# Running a Meeting with Flow AI Architect

This guide covers how to transcribe a real Zoom meeting using the Flow AI bot pipeline.

## Prerequisites

### Zoom Account Setup
1. **Zoom Pro, Business, or Enterprise account** (required for live streaming)
2. **Enable Live Streaming** in Zoom settings:
   - Go to [Zoom Web Portal](https://zoom.us/profile/setting)
   - Navigate to **Settings** > **Meeting** > **In Meeting (Advanced)**
   - Enable **Allow live streaming of meetings**
   - Check **Custom Live Streaming Service**
   - Save changes

### System Requirements
- The Flow AI backend infrastructure must be deployed
- You need access to the Flow AI Architect web application

## Starting a Bot Session

### Step 1: Create a Meeting in Flow AI
1. Open the Flow AI Architect web application
2. Navigate to **Meetings** > **New Meeting**
3. Enter the Zoom meeting URL (e.g., `https://zoom.us/j/123456789`)
4. Enter a meeting topic/name
5. Click **Start Bot**

### Step 2: Note the RTMP Credentials
After clicking Start Bot, you'll receive:
- **RTMP URL**: `rtmp://<IP_ADDRESS>:1935/live/<STREAM_KEY>`
- **Stream Key**: A unique identifier for your session

Wait approximately 30-60 seconds for the bot to fully initialize before proceeding.

## Configuring Zoom Live Streaming

### Step 3: Start Your Zoom Meeting
1. Start or join your Zoom meeting as the host
2. Wait for participants to join (if applicable)

### Step 4: Enable Live Streaming
1. In Zoom, click **More** (three dots) in the meeting controls
2. Select **Live on Custom Live Streaming Service**
3. Enter the streaming details:
   - **Stream URL**: The RTMP URL from Step 2 (e.g., `rtmp://3.84.98.204:1935/live`)
   - **Stream Key**: The stream key from Step 2
   - **Live streaming page URL**: Leave blank or enter any URL
4. Click **Go Live!**

### Step 5: Verify Streaming
- A "LIVE" indicator should appear in your Zoom meeting
- The Flow AI meeting status should change from "launching" to "running"

## During the Meeting

- **Speak clearly** for best transcription results
- The system automatically creates 30-second audio chunks
- Transcription happens in real-time via GPU-accelerated Whisper

## Stopping the Session

### Option A: From Flow AI (Recommended)
1. In the Flow AI Architect web app, navigate to your meeting
2. Click **Stop Recording**
3. The system will automatically:
   - Stop the RTMP ingestion
   - Process remaining audio chunks
   - Generate transcript and meeting notes

### Option B: From Zoom
1. Click **More** > **Stop Live Stream** in Zoom
2. The bot will detect the stream ended and begin processing

## Waiting for Results

After stopping the session:

| Stage | Typical Duration |
|-------|------------------|
| Audio chunks processing | 1-3 minutes |
| Transcription (Whisper) | 2-5 minutes |
| Meeting notes generation | 30 seconds |

**Total wait time**: 5-10 minutes for a typical 30-minute meeting

The meeting detail page will automatically update when processing completes.

## Viewing Results

Once processing completes:
1. Navigate to **Meetings** in the web app
2. Click on your meeting
3. View:
   - **Transcript**: Full timestamped transcript with speaker labels
   - **Meeting Notes**: AI-generated summary, key points, and action items

## Troubleshooting

### "RTMP Connection Refused"
- **Cause**: Bot not fully initialized
- **Fix**: Wait 30-60 seconds after creating the session, then retry

### Meeting Stuck in "Processing"
- **Cause**: Pipeline delay or failure
- **Check**: CloudWatch logs (see below)

### No Transcript Segments
- **Cause**: Audio not reaching Whisper
- **Check**: Verify Zoom is streaming (LIVE indicator visible)

## CloudWatch Log Groups for Debugging

| Component | Log Group | What to Check |
|-----------|-----------|---------------|
| Bot Producer (RTMP) | `/ecs/flow-ai-bot-bot-producer` | Audio ingestion, chunk uploads |
| Whisper Consumer | `/ecs/flow-ai-bot-whisper-consumer` | Transcription processing |
| Coordinator | `/aws/lambda/flow-ai-bot-coordinator` | Session management |
| Task Status Handler | `/aws/lambda/flow-ai-bot-task-status-handler` | ECS task lifecycle |
| Supabase Sync | `/aws/lambda/flow-ai-bot-supabase-sync` | DynamoDB to Supabase sync |
| Generate Notes | `/aws/lambda/flow-ai-bot-generate-notes` | Meeting notes generation |
| Step Functions | `/aws/states/flow-ai-bot-meeting-completion` | Workflow orchestration |

### Viewing Logs via AWS CLI
```bash
# View recent errors from a specific log group
aws logs filter-log-events \
  --log-group-name /ecs/flow-ai-bot-whisper-consumer \
  --start-time $(date -v-30M +%s000) \
  --filter-pattern "ERROR" \
  --query 'events[*].message' \
  --output text
```

## Cost Considerations

- **GPU instances** (g4dn.xlarge): ~$0.50/hour each
- Instances auto-scale based on demand
- When no meetings are running, ASG scales to 0
- Typical cost per meeting: $0.50-2.00 depending on duration

## Support

If you encounter issues:
1. Check the CloudWatch logs for the relevant component
2. Report issues at: https://github.com/anthropics/claude-code/issues

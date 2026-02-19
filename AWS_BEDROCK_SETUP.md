# AWS Bedrock Integration Guide

This application uses **AWS Bedrock** with **Claude 3.5 Sonnet v2** to power the AI analysis for all three phases of the Flow AI Architect workflow.

## Quick Start

### 1. AWS Bedrock Access

First, ensure you have access to AWS Bedrock with Claude 3.5 Sonnet v2:

1. **AWS Account:** You need an AWS account with Bedrock access
2. **Model Access:** Request access to Claude 3.5 Sonnet in AWS Bedrock
   - Go to AWS Console → Bedrock → Model access
   - Request access to **Anthropic Claude 3.5 Sonnet v2**
   - Enable **Cross-region inference** (required for on-demand throughput)
   - Wait for approval (usually instant for standard models)

### 2. Create AWS IAM User

Create an IAM user with Bedrock permissions:

1. Go to AWS Console → IAM → Users → Create User
2. Set user name (e.g., `flow-ai-architect-bedrock`)
3. Attach policy: `AmazonBedrockFullAccess` (or create custom policy below)
4. Create Access Key:
   - Go to Security credentials tab
   - Create access key
   - Choose "Application running outside AWS"
   - Save the Access Key ID and Secret Access Key

#### Custom IAM Policy (Minimal Permissions)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": [
        "arn:aws:bedrock:*::foundation-model/*",
        "arn:aws:bedrock:us-east-1::inference-profile/us.anthropic.claude-3-5-sonnet-v2:0"
      ]
    }
  ]
}
```

### 3. Configure Environment Variables

Edit the `.env` file in the project root:

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your credentials:
VITE_AWS_REGION=us-east-1
VITE_AWS_ACCESS_KEY_ID=your_access_key_here
VITE_AWS_SECRET_ACCESS_KEY=your_secret_key_here

# Set inference profile ID (required for on-demand throughput)
VITE_BEDROCK_MODEL_ID=us.anthropic.claude-3-5-sonnet-v2:0

# Disable mock data to use real AI
VITE_USE_MOCK_AI=false
```

### 4. Restart Development Server

```bash
# Stop the current server (Ctrl+C)
# Restart with new environment variables
pnpm dev
```

## Model Configuration

### Available Models

You can change the model by updating `VITE_BEDROCK_MODEL_ID`:

### Cross-Region Inference Profiles (Required)

**Important:** AWS Bedrock requires using inference profiles for on-demand throughput.

| Model | Inference Profile ID | Use Case |
|-------|----------|----------|
| **Claude 3.5 Sonnet v2** | `us.anthropic.claude-3-5-sonnet-v2:0` | **Recommended** - Latest, best balance |
| Claude 3.5 Sonnet v1 | `us.anthropic.claude-3-5-sonnet-v1:0` | Previous version |
| Claude 3 Opus | `us.anthropic.claude-3-opus-v1:0` | Highest quality, slower |
| Claude 3 Sonnet | `us.anthropic.claude-3-sonnet-v1:0` | Good balance |
| Claude 3 Haiku | `us.anthropic.claude-3-haiku-v1:0` | Fastest, lower cost |

### Supported AWS Regions

Bedrock Claude models are available in:
- `us-east-1` (N. Virginia) - Recommended
- `us-west-2` (Oregon)
- `eu-west-1` (Ireland)
- `ap-southeast-1` (Singapore)
- `ap-northeast-1` (Tokyo)

Update `VITE_AWS_REGION` to match your preferred region.

## How the Integration Works

### Architecture

```
User Input → React Frontend → AI Service Layer → AWS Bedrock → Claude 3.5 Sonnet v2
                                    ↓
                              Mock Data Fallback (if not configured)
```

### Three AI Phases

#### Phase 1: Meeting Context Extraction
- **Input:** Meeting transcript (text)
- **LLM Task:** Extract requirements, roles, workflows, artifacts
- **Output:** Structured JSON with preliminary requirements
- **Token Usage:** ~1,500 input + ~2,000 output

#### Phase 2: Artifact & Logic Analysis
- **Input:** Phase 1 output + spreadsheet data (headers, sample rows)
- **LLM Task:** Validate claims, extract formulas, identify discrepancies
- **Output:** Schema definitions, logic analysis, reality check
- **Token Usage:** ~3,000 input + ~4,000 output

#### Phase 3: Final PRD Synthesis
- **Input:** Phase 1 + Phase 2 outputs
- **LLM Task:** Synthesize into developer-ready PRD
- **Output:** Complete markdown PRD + structured data
- **Token Usage:** ~5,000 input + ~6,000 output

### Code Structure

```
src/
├── lib/
│   └── bedrock.ts          # AWS Bedrock client wrapper
├── services/
│   └── ai.ts               # AI service with 3 phase prompts
└── pages/
    └── NewProject.tsx      # UI integration
```

## Cost Estimation

### Claude 3.5 Sonnet v2 Pricing (as of 2025)
- **Input:** $3.00 per million tokens
- **Output:** $15.00 per million tokens

### Per Project Analysis Cost
- **Phase 1:** ~$0.035 ($0.0045 input + $0.030 output)
- **Phase 2:** ~$0.069 ($0.009 input + $0.060 output)
- **Phase 3:** ~$0.105 ($0.015 input + $0.090 output)
- **Total per project:** ~$0.21

For 100 projects/month: ~$21/month

## Troubleshooting

### Issue: "AWS Bedrock not configured"
**Solution:** Make sure `.env` has valid AWS credentials and `VITE_USE_MOCK_AI=false`

### Issue: "Access Denied" or 403 error
**Solution:**
1. Check IAM user has `bedrock:InvokeModel` permission
2. Request model access in Bedrock console
3. Verify the model ID matches your region

### Issue: "Model not found"
**Solution:**
1. Check the model is available in your region
2. Verify `VITE_BEDROCK_MODEL_ID` is correct
3. Try `us-east-1` region which has all models

### Issue: Slow responses
**Solution:**
- Claude 3.5 Sonnet v2 typically responds in 5-15 seconds
- Use Claude Haiku 4 for faster responses (lower quality)
- Check your network connection to AWS

### Issue: High costs
**Solution:**
- Enable `VITE_USE_MOCK_AI=true` for development
- Use Claude Haiku 4 for testing (cheaper)
- Only use real AI for production demos

## Development Mode

For local development without AWS costs:

```bash
# .env
VITE_USE_MOCK_AI=true
```

This will use the pre-configured mock data from `src/data/mockData.ts` instead of making AWS API calls.

## Security Best Practices

1. **Never commit `.env` to git** - It's already in `.gitignore`
2. **Use IAM roles** in production (not access keys)
3. **Rotate access keys** regularly
4. **Use least-privilege IAM policies** (custom policy above)
5. **Monitor Bedrock usage** in AWS CloudWatch
6. **Set up billing alerts** to avoid unexpected costs

## Production Deployment

For production deployments (Vercel, AWS Amplify, etc.):

1. **Don't use access keys** - Use IAM roles or temporary credentials
2. **Backend API recommended** - Move Bedrock calls to a backend API
3. **Rate limiting** - Add rate limiting to prevent abuse
4. **Caching** - Cache AI responses for identical inputs
5. **Error handling** - Implement retry logic and fallbacks

### Example Backend Architecture

```
Frontend (React) → Backend API (Node.js/Python) → AWS Bedrock
                         ↓
                   Redis Cache
                   Rate Limiter
                   Error Handling
```

## Support

For issues with:
- **This app:** Open an issue in the GitHub repo
- **AWS Bedrock:** Check [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- **Claude API:** Check [Anthropic Documentation](https://docs.anthropic.com/claude/reference/getting-started-with-bedrock)

## Testing the Integration

Once configured, test each phase:

1. **Create New Project**
2. **Phase 1:** Paste a meeting transcript → Should take 5-15 seconds
3. **Phase 2:** Upload artifact data → Should take 10-20 seconds
4. **Phase 3:** Auto-generates → Should take 15-30 seconds

Look for toast notifications confirming each phase completion.

## License

This integration uses AWS Bedrock which has its own terms of service. Make sure to review:
- [AWS Bedrock Terms](https://aws.amazon.com/service-terms/)
- [Anthropic Terms of Service](https://www.anthropic.com/legal/terms)

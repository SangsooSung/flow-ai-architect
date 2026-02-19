# How to Enable Real AI with AWS Bedrock

## Current Status: Using Mock Data

The app is currently configured to use **mock data** because AWS Bedrock models require proper access configuration.

## The Problem

AWS Bedrock has deprecated older Claude models and requires:
1. **Explicit model access** in the AWS Console
2. **Cross-region inference profiles** for newer models
3. Models must be actively used (not legacy)

## Error We Encountered

```
"Access denied. This Model is marked by provider as Legacy and you have not
been actively using the model in the last 15 days. Please upgrade to an
active model on Amazon Bedrock"
```

## Solution: Enable Model Access in AWS Console

### Step 1: Go to AWS Bedrock Console

1. Open https://console.aws.amazon.com/bedrock/
2. Go to **Model access** (left sidebar)
3. Click **"Manage model access"** or **"Edit"**

### Step 2: Request Access to Claude Models

Enable access to these models:
- ☑️ **Anthropic Claude 3.5 Sonnet v2** (Recommended)
- ☑️ **Anthropic Claude 3.5 Sonnet**
- ☑️ **Anthropic Claude 3 Sonnet**
- ☑️ **Anthropic Claude 3 Haiku** (Cheaper option)

Click **"Request model access"** and wait for approval (usually instant).

### Step 3: Enable Cross-Region Inference (Important!)

In the Model access page:
1. Look for **"Cross-region inference"** option
2. **Enable it** - This is required for newer Claude models
3. Save changes

### Step 4: Find Your Model IDs

After access is granted, AWS will provide inference profile IDs like:
- `us.anthropic.claude-3-5-sonnet-v2:0`
- `us.anthropic.claude-3-sonnet-v1:0`

Or base model IDs like:
- `anthropic.claude-3-5-sonnet-20241022-v2:0`
- `anthropic.claude-3-sonnet-20240229-v1:0`

### Step 5: Update Configuration

Edit `start-with-aws.sh`:

```bash
# Change this line:
export VITE_USE_MOCK_AI="true"

# To:
export VITE_USE_MOCK_AI="false"

# And update the model ID to one you have access to:
export VITE_BEDROCK_MODEL_ID="us.anthropic.claude-3-5-sonnet-v2:0"
# Or try:
export VITE_BEDROCK_MODEL_ID="anthropic.claude-3-sonnet-20240229-v1:0"
```

### Step 6: Restart Server

```bash
./start-with-aws.sh
```

## How to Test Which Models You Have Access To

You can check which models work by trying different model IDs:

### Try These in Order:

1. **Latest Sonnet with inference profile:**
   ```bash
   export VITE_BEDROCK_MODEL_ID="us.anthropic.claude-3-5-sonnet-v2:0"
   ```

2. **Claude 3 Sonnet (stable):**
   ```bash
   export VITE_BEDROCK_MODEL_ID="anthropic.claude-3-sonnet-20240229-v1:0"
   ```

3. **Claude 3 Haiku (fast & cheap):**
   ```bash
   export VITE_BEDROCK_MODEL_ID="anthropic.claude-3-haiku-20240307-v1:0"
   ```

4. **Inference profile for Sonnet:**
   ```bash
   export VITE_BEDROCK_MODEL_ID="us.anthropic.claude-3-sonnet-v1:0"
   ```

## Verification Steps

1. **Check Model Access:**
   - Go to AWS Console → Bedrock → Model access
   - Verify status is **"Access granted"** (green checkmark)
   - Look for Anthropic Claude models

2. **Check Cross-Region Inference:**
   - Should be **enabled** for inference profiles to work
   - Required for `us.anthropic.*` model IDs

3. **Test the App:**
   - Go to http://localhost:8081/
   - Create a new project
   - Paste a transcript
   - Should see "Processing..." for 5-15 seconds
   - Should NOT see "AWS Bedrock not configured" warning

## Common Issues & Solutions

### Issue: "Model identifier is invalid"
**Solution:** The model ID doesn't exist or isn't formatted correctly. Try a different format (inference profile vs base model ID).

### Issue: "Access denied - Legacy model"
**Solution:** That specific model version has been deprecated. Request access to a newer model in AWS Console.

### Issue: "Access denied"
**Solution:** You need to request model access in AWS Bedrock console first.

### Issue: "Inference profile not supported"
**Solution:** Enable cross-region inference in Bedrock settings, or use base model IDs instead.

### Issue: Still using mock data
**Solution:** Make sure `VITE_USE_MOCK_AI="false"` in your start script and restart the server.

## Cost Information

Once real AI is enabled:

**Claude 3.5 Sonnet v2 Pricing:**
- Input: $3.00 per million tokens
- Output: $15.00 per million tokens
- **Per project analysis: ~$0.21** (all 3 phases)

**Claude 3 Sonnet Pricing:**
- Input: $3.00 per million tokens
- Output: $15.00 per million tokens
- Similar cost to 3.5 Sonnet

**Claude 3 Haiku Pricing (Cheaper):**
- Input: $0.25 per million tokens
- Output: $1.25 per million tokens
- **Per project analysis: ~$0.02** (85% cheaper!)

## Alternative: Use Mock Data for Development

If you don't need real AI right now, keep using mock data:

```bash
export VITE_USE_MOCK_AI="true"
```

The app will:
- ✅ Work perfectly with pre-configured sample data
- ✅ Demonstrate all 3 phases instantly
- ✅ Cost $0
- ❌ Not analyze real transcripts

This is perfect for:
- Development and testing
- Demos and presentations
- Learning the workflow

## Need Help?

1. **Check AWS Bedrock Documentation:**
   https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html

2. **Check Model Access Status:**
   https://console.aws.amazon.com/bedrock/home#/modelaccess

3. **Anthropic Model IDs Reference:**
   https://docs.anthropic.com/en/api/claude-on-amazon-bedrock

## Summary

**To use real AI:**
1. ✅ Go to AWS Console → Bedrock → Model access
2. ✅ Request access to Anthropic Claude models
3. ✅ Enable cross-region inference
4. ✅ Update `VITE_USE_MOCK_AI="false"` in start script
5. ✅ Set correct model ID
6. ✅ Restart server

**Current setup:**
- 🔵 Mock mode enabled (no AWS costs)
- 🔵 Works perfectly for demos
- 🔵 Switch to real AI anytime by following steps above

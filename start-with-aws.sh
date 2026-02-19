#!/bin/bash

# Start Flow AI Architect with AWS Bedrock credentials
# This script exports your existing AWS credentials as VITE_ variables for the frontend

echo "🚀 Starting Flow AI Architect with AWS Bedrock..."

# Check if AWS credentials are set
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "❌ Error: AWS credentials not found in environment"
    echo "Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY first"
    exit 1
fi

# Export AWS credentials with VITE_ prefix so Vite can access them
export VITE_AWS_REGION="${AWS_REGION:-us-east-1}"
export VITE_AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID"
export VITE_AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY"
# Claude Sonnet 4.5 - Latest model (September 2025)
export VITE_BEDROCK_MODEL_ID="us.anthropic.claude-sonnet-4-5-20250929-v1:0"
export VITE_USE_MOCK_AI="false"

echo "✅ AWS Region: $VITE_AWS_REGION"
echo "✅ AWS Access Key: ${AWS_ACCESS_KEY_ID:0:10}..."
echo "✅ Bedrock Model: $VITE_BEDROCK_MODEL_ID"
echo "✅ Real AI Mode: Enabled"
echo ""
echo "🌐 Starting development server..."
echo ""

# Start the dev server
pnpm dev

# Zoom Meeting SDK Bot for Flow AI Architect
# Runs on AWS Fargate to join Zoom meetings and stream audio to Amazon Transcribe

FROM ubuntu:22.04 AS base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    libasound2 \
    libglib2.0-0 \
    libdbus-1-3 \
    pulseaudio \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20 LTS
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Install Zoom Meeting SDK for Linux
# NOTE: In production, download the SDK from Zoom Marketplace and place in ./sdk/
# The SDK is not publicly available and requires a Zoom Marketplace app registration
COPY sdk/ /app/sdk/ 2>/dev/null || true

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --production

# Copy built application
COPY dist/ ./dist/

# Set environment variables
ENV NODE_ENV=production
ENV ZOOM_SDK_PATH=/app/sdk

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Max runtime: 4 hours (safety limit)
# This is enforced at the ECS task level, but also set here as a fallback
ENV MAX_RUNTIME_MS=14400000

EXPOSE 8080

CMD ["node", "dist/index.js"]

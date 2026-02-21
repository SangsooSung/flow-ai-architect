# Google Meet Bot for Flow AI Architect
# Runs on AWS Fargate to join Google Meet meetings via headless Chrome,
# capture audio, and stream to Amazon Transcribe

FROM node:20-slim

# Install system dependencies for headless Chrome + audio capture
RUN apt-get update && apt-get install -y \
    chromium \
    pulseaudio \
    xvfb \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libglib2.0-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer to use installed Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Create app directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --production

# Copy built application
COPY dist/ ./dist/

# Set environment variables
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Max runtime: 4 hours (safety limit)
ENV MAX_RUNTIME_MS=14400000

EXPOSE 8080

CMD ["node", "dist/index.js"]

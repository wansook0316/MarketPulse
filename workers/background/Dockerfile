# ============================================================================
# Background Worker Dockerfile (Node.js)
# ============================================================================
FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache dumb-init

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create vault directory
RUN mkdir -p /app/vault

# Create non-root user
RUN addgroup --system --gid 1001 worker
RUN adduser --system --uid 1001 worker
RUN chown -R worker:worker /app

# Switch to non-root user
USER worker

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Run the worker
CMD ["node", "worker.js"]

# ============================================================================
# Stage 1: Dependencies
# ============================================================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production

# ============================================================================
# Stage 2: Builder
# ============================================================================
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the application
RUN npm run build

# ============================================================================
# Stage 3: Runner (Production)
# ============================================================================
FROM node:20-alpine AS production
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Create vault directory with proper permissions
RUN mkdir -p /app/vault
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]

# ============================================================================
# Stage 4: Development
# ============================================================================
FROM node:20-alpine AS development
WORKDIR /app

# Install development dependencies
RUN apk add --no-cache libc6-compat git

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy application files
COPY . .

# Expose port and enable hot reload
EXPOSE 3000
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=development

# Start development server
CMD ["npm", "run", "dev"]

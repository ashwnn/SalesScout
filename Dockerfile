# Multi-stage build for optimization
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files for both server and client
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies with cache mount for faster rebuilds
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production --ignore-scripts
RUN --mount=type=cache,target=/root/.npm \
    cd client && npm ci --only=production --ignore-scripts

# Development dependencies for building
FROM base AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install all dependencies (including dev dependencies) with cache mount
RUN --mount=type=cache,target=/root/.npm \
    npm ci --ignore-scripts
RUN --mount=type=cache,target=/root/.npm \
    cd client && npm ci --ignore-scripts

# Copy source code
COPY . .

# Build both server and client
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 salesscout

# Copy built assets from builder
COPY --from=builder --chown=salesscout:nodejs /app/dist ./dist
COPY --from=builder --chown=salesscout:nodejs /app/client/build ./client/build
COPY --from=builder --chown=salesscout:nodejs /app/package*.json ./

# Copy production node_modules from deps stage
COPY --from=deps --chown=salesscout:nodejs /app/node_modules ./node_modules

# Copy any additional required files
COPY --from=builder --chown=salesscout:nodejs /app/models ./models
COPY --from=builder --chown=salesscout:nodejs /app/config ./config
COPY --from=builder --chown=salesscout:nodejs /app/controllers ./controllers
COPY --from=builder --chown=salesscout:nodejs /app/middleware ./middleware
COPY --from=builder --chown=salesscout:nodejs /app/routes ./routes
COPY --from=builder --chown=salesscout:nodejs /app/services ./services
COPY --from=builder --chown=salesscout:nodejs /app/types ./types
COPY --from=builder --chown=salesscout:nodejs /app/scripts ./scripts

USER salesscout

# Expose the application port
EXPOSE 3311

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3311/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start the application directly with node for proper signal handling
CMD ["node", "dist/server.js"]

# =====================================================================
# INTELLMEET PRODUCTION DOCKERFILE (Multi-Stage Build)
# =====================================================================

# Stage 1: Build Dependencies and Compile TypeScript
FROM node:20-alpine AS builder

WORKDIR /app

# Install build prerequisites
RUN apk add --no-cache python3 make g++

# Copy root package files
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install all monorepo dependencies
RUN npm ci

# Copy source code across all workspaces
COPY tsconfig*.json ./
COPY shared/ ./shared/
COPY server/ ./server/
COPY client/ ./client/

# Build shared, server, and client packages
RUN npm run build

# Stage 2: Minimal Production Runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install runtime dependencies and dumb-init for proper PID 1 signal forwarding
RUN apk add --no-cache dumb-init

# Copy root package files and install only production dependencies
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/
COPY client/package*.json ./client/

RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled artifacts from builder stage
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist

# Create storage directory for recordings with appropriate permissions
RUN mkdir -p /app/uploads/recordings && chown -R node:node /app

USER node

EXPOSE 5000

# Health check probe against Express /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "server/dist/index.js"]

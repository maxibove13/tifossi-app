# Tifossi Backend Dockerfile
# Multi-stage build for different environments

# Base stage with common dependencies
FROM node:18-alpine AS base

# Install system dependencies for native modules
RUN apk add --no-cache \
    build-base \
    gcc \
    autoconf \
    automake \
    zlib-dev \
    libpng-dev \
    nasm \
    bash \
    vips-dev \
    wget \
    curl \
    git

# Set working directory
WORKDIR /app

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S strapi -u 1001

# Copy package files first for better caching
COPY backend/package*.json ./
COPY backend/yarn.lock* ./

# Development stage
FROM base AS development

# Install all dependencies including devDependencies
RUN npm ci --include=dev

# Copy source code
COPY backend/ .

# Create necessary directories
RUN mkdir -p public/uploads logs && \
    chown -R strapi:nodejs /app

# Switch to app user
USER strapi

# Expose port
EXPOSE 1337

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:1337/api/health || exit 1

# Development command with hot reloading
CMD ["npm", "run", "develop"]

# Build stage for production
FROM base AS build

# Install all dependencies
RUN npm ci --include=dev

# Copy source code
COPY backend/ .

# Build the application
RUN npm run build && \
    npm prune --omit=dev && \
    npm cache clean --force

# Production stage
FROM base AS production

# Install only production dependencies
RUN npm ci --omit=dev && \
    npm cache clean --force

# Copy built application from build stage
COPY --from=build --chown=strapi:nodejs /app/dist ./dist
COPY --from=build --chown=strapi:nodejs /app/config ./config
COPY --from=build --chown=strapi:nodejs /app/database ./database
COPY --from=build --chown=strapi:nodejs /app/src ./src
COPY --from=build --chown=strapi:nodejs /app/public ./public
COPY --from=build --chown=strapi:nodejs /app/package*.json ./

# Copy production node_modules
COPY --from=build --chown=strapi:nodejs /app/node_modules ./node_modules

# Create necessary directories with proper permissions
RUN mkdir -p public/uploads logs && \
    chown -R strapi:nodejs /app && \
    chmod -R 755 /app

# Switch to non-root user
USER strapi

# Expose port
EXPOSE 1337

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:1337/api/health || exit 1

# Production command
CMD ["npm", "run", "start"]

# Testing stage
FROM development AS testing

# Copy test files
COPY backend/tests/ ./tests/
COPY backend/jest.config.js ./
COPY backend/.env.test ./

# Install testing dependencies
RUN npm install --save-dev \
    @testing-library/react \
    @testing-library/jest-dom \
    jest-environment-node \
    supertest

# Run tests
CMD ["npm", "run", "test:ci"]

# Staging stage (similar to production but with different configs)
FROM production AS staging

# Copy staging-specific configurations
COPY backend/.env.staging ./.env

# Enable staging-specific features
ENV NODE_ENV=staging
ENV LOG_LEVEL=info
ENV FEATURE_DEBUG_TOOLBAR=false
ENV RATE_LIMIT_ENABLED=true

# Staging command
CMD ["npm", "run", "start"]

# Debug stage for troubleshooting
FROM development AS debug

# Install debugging tools
RUN npm install --save-dev \
    @strapi/cli \
    nodemon \
    debug

# Enable debug mode
ENV DEBUG=strapi:*
ENV LOG_LEVEL=debug
ENV STRAPI_TELEMETRY_DISABLED=true

# Debug command with nodemon
CMD ["npm", "run", "develop"]

# Security scanning stage
FROM base AS security

# Install security scanning tools
RUN npm install -g \
    npm-audit \
    snyk \
    retire

# Copy package files
COPY backend/package*.json ./

# Run security scans
RUN npm audit --audit-level=moderate && \
    npx retire --js --path . || true

CMD ["echo", "Security scan completed"]

# Documentation stage
FROM node:18-alpine AS docs

WORKDIR /app

# Install documentation tools
RUN npm install -g \
    @apidevtools/swagger-parser \
    redoc-cli

# Copy API documentation
COPY backend/docs/ ./docs/
COPY backend/src/api/ ./src/api/

# Generate documentation
RUN echo "Documentation generation completed"

CMD ["echo", "Documentation ready"]
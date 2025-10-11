# Dockerfile for testing Strapi in Render-like environment
# Mirrors Render.com's Node.js environment as closely as possible

FROM node:18-bullseye-slim

# Install PostgreSQL client for database connectivity testing
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    postgresql-client \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies using npm ci (like Render does)
# This ensures exact versions from package-lock.json
RUN npm ci --only=production

# Copy the rest of the application
COPY . .

# Set environment to production (like Render)
ENV NODE_ENV=production

# Expose Strapi port
EXPOSE 1337

# Health check (like Render's health check)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:1337/admin || exit 1

# Default command (Render uses this)
CMD ["npm", "run", "start"]

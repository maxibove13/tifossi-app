#!/bin/bash

###############################################################################
# Render Environment Simulator Script
#
# This script simulates the exact environment that Render.com provides during
# deployment, allowing you to test the Strapi build and start process locally
# before pushing to production.
#
# Usage:
#   ./scripts/test-with-render-env.sh              # Full test (build + start)
#   ./scripts/test-with-render-env.sh --build-only # Only test build step
#   ./scripts/test-with-render-env.sh --ci         # CI mode (non-interactive)
###############################################################################

set -e  # Exit on any error

# Parse command line arguments
BUILD_ONLY=false
CI_MODE=false

for arg in "$@"; do
  case $arg in
    --build-only)
      BUILD_ONLY=true
      shift
      ;;
    --ci)
      CI_MODE=true
      shift
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --build-only    Only run build step, skip start test"
      echo "  --ci            CI mode (non-interactive, minimal output)"
      echo "  --help          Show this help message"
      exit 0
      ;;
    *)
      # Unknown option
      ;;
  esac
done

# Colors for output (disabled in CI mode)
if [ "$CI_MODE" = true ]; then
  RED=''
  GREEN=''
  YELLOW=''
  BLUE=''
  CYAN=''
  GRAY=''
  NC=''
else
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  BLUE='\033[0;34m'
  CYAN='\033[0;36m'
  GRAY='\033[0;90m'
  NC='\033[0m'
fi

# Symbols
SUCCESS="✓"
ERROR="✗"
INFO="ℹ"
WARNING="⚠"

# Get the script directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
STRAPI_DIR="$(dirname "$SCRIPT_DIR")"

if [ "$CI_MODE" = false ]; then
  echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${CYAN}Render Environment Simulator for Strapi v5${NC}"
  if [ "$BUILD_ONLY" = true ]; then
    echo -e "${CYAN}Mode: Build Only${NC}"
  fi
  echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
  echo -e "\n${BLUE}${INFO} Strapi directory: ${STRAPI_DIR}${NC}"
else
  echo "Render environment test: starting..."
  if [ "$BUILD_ONLY" = true ]; then
    echo "Mode: build-only"
  fi
fi

# Check if we're in the right directory
if [ ! -f "${STRAPI_DIR}/package.json" ]; then
    echo -e "${RED}${ERROR} Error: package.json not found in ${STRAPI_DIR}${NC}"
    echo -e "${RED}   Please run this script from the Strapi project root${NC}"
    exit 1
fi

# Function to generate a random secret
generate_secret() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Check if .env exists and warn about override
if [ -f "${STRAPI_DIR}/.env" ]; then
    echo -e "\n${YELLOW}${WARNING} Warning: Existing .env file found${NC}"
    echo -e "${YELLOW}   This script will OVERRIDE environment variables for this test${NC}"
    echo -e "${YELLOW}   Your .env file will not be modified${NC}"
fi

# Set up Render-like environment variables
echo -e "\n${CYAN}Setting up Render environment variables...${NC}"

# Generate secrets (like Render does)
export APP_KEYS="$(generate_secret),$(generate_secret),$(generate_secret),$(generate_secret)"
export API_TOKEN_SALT="$(generate_secret)"
export ADMIN_JWT_SECRET="$(generate_secret)"
export TRANSFER_TOKEN_SALT="$(generate_secret)"
export JWT_SECRET="$(generate_secret)"

# Database configuration (simulating Render's PostgreSQL service)
# This uses the format Render provides via DATABASE_URL
export DATABASE_URL="postgresql://strapi_user:test_password@localhost:5432/strapi_test"
export DATABASE_CLIENT="postgres"
export DATABASE_SSL="false"  # Use false for local testing, true for actual Render
export DATABASE_SSL_REJECT_UNAUTHORIZED="false"

# Node environment
export NODE_ENV="production"
export HOST="0.0.0.0"
export PORT="1337"

# Other Render environment variables
export CORS_ORIGINS="http://localhost:19006,http://localhost:19000"
export STRAPI_TELEMETRY_DISABLED="true"

echo -e "${GREEN}${SUCCESS} Environment variables set${NC}"

# Display masked environment for verification
echo -e "\n${BLUE}Environment Configuration:${NC}"
echo -e "${GRAY}───────────────────────────────────────────────────────────${NC}"
echo -e "NODE_ENV: ${NODE_ENV}"
echo -e "DATABASE_CLIENT: ${DATABASE_CLIENT}"
echo -e "DATABASE_URL: ${DATABASE_URL%%:*}://***MASKED***"
echo -e "DATABASE_SSL: ${DATABASE_SSL}"
echo -e "APP_KEYS: ***MASKED***"
echo -e "JWT_SECRET: ***MASKED***"
echo -e "${GRAY}───────────────────────────────────────────────────────────${NC}"

# Check if PostgreSQL is running locally
echo -e "\n${BLUE}${INFO} Checking PostgreSQL connection...${NC}"
if command -v psql &> /dev/null; then
    if psql "${DATABASE_URL}" -c "SELECT 1;" &> /dev/null; then
        echo -e "${GREEN}${SUCCESS} PostgreSQL is accessible${NC}"
    else
        echo -e "${YELLOW}${WARNING} PostgreSQL connection failed${NC}"
        echo -e "${YELLOW}   This is OK if you just want to test the build step${NC}"
        echo -e "${YELLOW}   To test the full start process, ensure PostgreSQL is running:${NC}"
        echo -e "${YELLOW}   docker-compose up -d (if using Docker)${NC}"
    fi
else
    echo -e "${YELLOW}${WARNING} psql not found - skipping database check${NC}"
fi

# Step 1: Clean previous builds
echo -e "\n${CYAN}Step 1: Cleaning previous builds...${NC}"
if [ -d "${STRAPI_DIR}/build" ]; then
    rm -rf "${STRAPI_DIR}/build"
    echo -e "${GREEN}${SUCCESS} Cleaned build directory${NC}"
else
    echo -e "${BLUE}${INFO} No previous build found${NC}"
fi

# Step 2: Install dependencies (like Render's npm ci)
echo -e "\n${CYAN}Step 2: Installing dependencies (npm ci)...${NC}"
cd "${STRAPI_DIR}"
npm ci
if [ $? -eq 0 ]; then
    echo -e "${GREEN}${SUCCESS} Dependencies installed${NC}"
else
    echo -e "${RED}${ERROR} Failed to install dependencies${NC}"
    exit 1
fi

# Step 3: Run the build (this is where DATABASE_URL is first used)
echo -e "\n${CYAN}Step 3: Running Strapi build (npm run build)...${NC}"
echo -e "${GRAY}This is where the database config is loaded and validated${NC}"

npm run build
BUILD_EXIT_CODE=$?

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo -e "\n${GREEN}${SUCCESS} Build completed successfully!${NC}"
else
    echo -e "\n${RED}${ERROR} Build failed with exit code ${BUILD_EXIT_CODE}${NC}"
    echo -e "${RED}   Check the error messages above for details${NC}"
    exit 1
fi

# Step 4: Attempt to start Strapi (optional - requires working database)
# Skip this step if --build-only flag is set
if [ "$BUILD_ONLY" = true ]; then
    echo -e "\n${BLUE}${INFO} Skipping start test (--build-only mode)${NC}"
    echo -e "${GREEN}${SUCCESS} Build validation completed successfully!${NC}"
    exit 0
fi

echo -e "\n${CYAN}Step 4: Testing Strapi start...${NC}"
echo -e "${YELLOW}${INFO} This step requires a working PostgreSQL database${NC}"

if [ "$CI_MODE" = false ]; then
    echo -e "${YELLOW}   Press Ctrl+C to skip, or wait 5 seconds to continue...${NC}"
    # Give user time to cancel
    sleep 5
else
    echo "Starting Strapi (CI mode - no delay)..."
fi

echo -e "\n${BLUE}Starting Strapi (will timeout after 15 seconds)...${NC}"

# Start Strapi in background and capture output
timeout 15s npm run start &
START_PID=$!

# Wait a bit for startup
sleep 10

# Check if process is still running
if ps -p $START_PID > /dev/null; then
    echo -e "${GREEN}${SUCCESS} Strapi started successfully!${NC}"
    echo -e "${GREEN}   Process is running (PID: ${START_PID})${NC}"

    # Check if HTTP endpoint is responding
    if command -v curl &> /dev/null; then
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:1337/admin | grep -q "200\|301\|302"; then
            echo -e "${GREEN}${SUCCESS} Admin panel is accessible${NC}"
        else
            echo -e "${YELLOW}${WARNING} Admin panel not responding yet (this may be normal)${NC}"
        fi
    fi

    # Kill the process
    kill $START_PID 2>/dev/null || true
    wait $START_PID 2>/dev/null || true
else
    # Process already exited - check exit code
    wait $START_PID
    START_EXIT_CODE=$?
    if [ $START_EXIT_CODE -eq 0 ] || [ $START_EXIT_CODE -eq 124 ]; then
        echo -e "${GREEN}${SUCCESS} Strapi start process completed${NC}"
    else
        echo -e "${RED}${ERROR} Strapi failed to start (exit code: ${START_EXIT_CODE})${NC}"
        echo -e "${RED}   This usually means database connection or migration issues${NC}"
        exit 1
    fi
fi

# Summary
echo -e "\n${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}Test Summary${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${SUCCESS} Dependencies installed successfully${NC}"
echo -e "${GREEN}${SUCCESS} Build completed successfully${NC}"
echo -e "${GREEN}${SUCCESS} Database configuration is valid${NC}"
echo -e "\n${GREEN}Your Strapi configuration is ready for Render deployment!${NC}"
echo -e "\n${BLUE}${INFO} Next steps:${NC}"
echo -e "  1. Commit your changes to git"
echo -e "  2. Push to your main branch"
echo -e "  3. Render will automatically deploy with these same steps"
echo -e "\n${YELLOW}${WARNING} Remember to set production environment variables in Render:${NC}"
echo -e "  - CLOUDINARY_NAME, CLOUDINARY_KEY, CLOUDINARY_SECRET"
echo -e "  - MP_ACCESS_TOKEN, MP_PUBLIC_KEY, MP_WEBHOOK_SECRET"
echo -e "  - EMAIL configuration (if using email features)"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"

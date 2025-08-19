#!/bin/bash

# Tifossi Backend Render Deployment Script
# Usage: ./render-deploy.sh [environment] [service-id]
# Example: ./render-deploy.sh production srv-xxxxxxxxxxxxx

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
SERVICE_ID=${2}
PROJECT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
RENDER_API_URL="https://api.render.com/v1"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Show usage
show_usage() {
    echo "Usage: $0 [environment] [service-id]"
    echo "Environments: development, staging, production"
    echo "Service ID: Your Render service ID (srv-xxxxxxxxxxxxx)"
    echo
    echo "Examples:"
    echo "  $0 production srv-abc123def456"
    echo "  $0 staging srv-staging123"
    echo
    echo "Required Environment Variables:"
    echo "  RENDER_API_KEY - Your Render API key"
    echo
    echo "Optional Environment Variables:"
    echo "  SLACK_WEBHOOK_URL - For deployment notifications"
    echo "  HEALTH_CHECK_URL - Custom health check URL"
    exit 1
}

# Check dependencies
check_dependencies() {
    log "Checking dependencies..."
    
    if ! command -v curl &> /dev/null; then
        error "curl not found. Please install curl."
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        error "jq not found. Please install jq for JSON processing."
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        error "Docker not found. Please install Docker."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        error "npm not found. Please install Node.js and npm."
        exit 1
    fi
    
    # Check for Render API key
    if [[ -z "$RENDER_API_KEY" ]]; then
        error "RENDER_API_KEY environment variable is required"
        error "Get your API key from: https://dashboard.render.com/account/api-keys"
        exit 1
    fi
    
    success "All dependencies are available"
}

# Validate environment
validate_environment() {
    log "Validating environment: $ENVIRONMENT"
    
    case $ENVIRONMENT in
        development|staging|production)
            log "Environment '$ENVIRONMENT' is valid"
            ;;
        *)
            error "Invalid environment: $ENVIRONMENT. Must be development, staging, or production."
            exit 1
            ;;
    esac
}

# Validate service ID
validate_service_id() {
    if [[ -z "$SERVICE_ID" ]]; then
        error "Service ID is required"
        show_usage
    fi
    
    if [[ ! "$SERVICE_ID" =~ ^srv-[a-zA-Z0-9]+$ ]]; then
        error "Invalid service ID format: $SERVICE_ID"
        error "Service ID should start with 'srv-' followed by alphanumeric characters"
        exit 1
    fi
    
    log "Service ID '$SERVICE_ID' is valid format"
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Running pre-deployment checks..."
    
    # Check if we're in the correct directory
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        error "Not in project root directory. Please run from the project root."
        exit 1
    fi
    
    # Check if backend directory exists
    if [[ ! -d "$PROJECT_ROOT/backend" ]]; then
        error "Backend directory not found. Ensure the backend code is in the 'backend' directory."
        exit 1
    fi
    
    # Check if Dockerfile exists
    if [[ ! -f "$PROJECT_ROOT/infrastructure/templates/Dockerfile" ]]; then
        error "Dockerfile not found. Ensure Dockerfile exists in infrastructure/templates/"
        exit 1
    fi
    
    # Check environment file
    ENV_FILE="$PROJECT_ROOT/infrastructure/templates/.env.${ENVIRONMENT}.template"
    if [[ ! -f "$ENV_FILE" ]]; then
        error "Environment template file not found: $ENV_FILE"
        exit 1
    fi
    
    success "Pre-deployment checks passed"
}

# Build and test locally
build_and_test() {
    log "Building and testing locally..."
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies
    log "Installing dependencies..."
    npm install
    
    # Run linter
    log "Running linter..."
    npm run lint || {
        error "Linting failed. Please fix linting errors before deploying."
        exit 1
    }
    
    # Run type checking
    log "Running type checking..."
    npm run typecheck || {
        error "Type checking failed. Please fix type errors before deploying."
        exit 1
    }
    
    # Run tests
    log "Running tests..."
    npm run test:ci || {
        warning "Tests failed. Continuing with deployment (consider fixing tests)."
    }
    
    success "Local build and test completed"
}

# Make Render API call
render_api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    local curl_args=(-X "$method" -H "Authorization: Bearer $RENDER_API_KEY" -H "Content-Type: application/json")
    
    if [[ -n "$data" ]]; then
        curl_args+=(-d "$data")
    fi
    
    curl -s "${curl_args[@]}" "$RENDER_API_URL/$endpoint"
}

# Get service information
get_service_info() {
    log "Getting service information..."
    
    local response=$(render_api_call "GET" "services/$SERVICE_ID")
    
    if echo "$response" | jq -e '.id' > /dev/null 2>&1; then
        local service_name=$(echo "$response" | jq -r '.name')
        local service_type=$(echo "$response" | jq -r '.type')
        local service_env=$(echo "$response" | jq -r '.env // "unknown"')
        
        log "Service Name: $service_name"
        log "Service Type: $service_type"
        log "Service Environment: $service_env"
        
        success "Service information retrieved"
        return 0
    else
        error "Failed to get service information"
        error "Response: $response"
        return 1
    fi
}

# Check environment variables
check_env_vars() {
    log "Checking environment variables..."
    
    local response=$(render_api_call "GET" "services/$SERVICE_ID/env-vars")
    
    if echo "$response" | jq -e '.[0]' > /dev/null 2>&1; then
        local var_count=$(echo "$response" | jq length)
        log "Found $var_count environment variables configured"
        
        # Check for critical variables
        local critical_vars=("APP_KEYS" "JWT_SECRET" "DATABASE_URL" "NODE_ENV")
        local missing_vars=()
        
        for var in "${critical_vars[@]}"; do
            if ! echo "$response" | jq -e ".[] | select(.key == \"$var\")" > /dev/null 2>&1; then
                missing_vars+=("$var")
            fi
        done
        
        if [[ ${#missing_vars[@]} -gt 0 ]]; then
            error "Missing critical environment variables: ${missing_vars[*]}"
            error "Please configure these variables in Render dashboard"
            return 1
        fi
        
        success "Environment variables check passed"
        return 0
    else
        error "Failed to check environment variables"
        return 1
    fi
}

# Trigger deployment
trigger_deployment() {
    log "Triggering deployment on Render..."
    
    local deploy_data='{"clearCache": false}'
    local response=$(render_api_call "POST" "services/$SERVICE_ID/deploys" "$deploy_data")
    
    if echo "$response" | jq -e '.id' > /dev/null 2>&1; then
        local deploy_id=$(echo "$response" | jq -r '.id')
        local deploy_status=$(echo "$response" | jq -r '.status')
        
        log "Deployment triggered successfully"
        log "Deploy ID: $deploy_id"
        log "Initial Status: $deploy_status"
        
        # Store deploy ID for monitoring
        echo "$deploy_id" > /tmp/render_deploy_id
        
        success "Deployment initiated"
        return 0
    else
        error "Failed to trigger deployment"
        error "Response: $response"
        return 1
    fi
}

# Monitor deployment
monitor_deployment() {
    log "Monitoring deployment progress..."
    
    local deploy_id
    if [[ -f /tmp/render_deploy_id ]]; then
        deploy_id=$(cat /tmp/render_deploy_id)
    else
        error "Deploy ID not found"
        return 1
    fi
    
    local max_attempts=120  # 10 minutes max wait time
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        local response=$(render_api_call "GET" "services/$SERVICE_ID/deploys/$deploy_id")
        
        if echo "$response" | jq -e '.id' > /dev/null 2>&1; then
            local status=$(echo "$response" | jq -r '.status')
            local created_at=$(echo "$response" | jq -r '.createdAt')
            
            case $status in
                "build_in_progress"|"update_in_progress")
                    log "Deployment in progress... (attempt $attempt/$max_attempts)"
                    ;;
                "live")
                    success "Deployment completed successfully"
                    return 0
                    ;;
                "build_failed"|"update_failed"|"deactivated")
                    error "Deployment failed with status: $status"
                    return 1
                    ;;
                *)
                    log "Deployment status: $status (attempt $attempt/$max_attempts)"
                    ;;
            esac
        else
            warning "Failed to get deployment status"
        fi
        
        attempt=$((attempt + 1))
        sleep 5
    done
    
    error "Deployment monitoring timed out"
    return 1
}

# Wait for service health
wait_for_health() {
    log "Waiting for service to become healthy..."
    
    # Construct health URL based on environment
    local health_url
    case $ENVIRONMENT in
        production)
            health_url="${HEALTH_CHECK_URL:-https://api.tifossi.app/api/health}"
            ;;
        staging)
            health_url="${HEALTH_CHECK_URL:-https://staging-api.tifossi.app/api/health}"
            ;;
        development)
            health_url="${HEALTH_CHECK_URL:-https://dev-api.tifossi.app/api/health}"
            ;;
    esac
    
    log "Checking health endpoint: $health_url"
    
    local max_attempts=60  # 5 minutes max wait time
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if curl -f -s --max-time 10 "$health_url" > /dev/null 2>&1; then
            success "Service is healthy and responding"
            return 0
        fi
        
        attempt=$((attempt + 1))
        log "Waiting for service to be ready... (attempt $attempt/$max_attempts)"
        sleep 5
    done
    
    error "Service did not become healthy within expected time"
    return 1
}

# Post-deployment tests
post_deployment_tests() {
    log "Running post-deployment tests..."
    
    # Get service URL from Render API
    local response=$(render_api_call "GET" "services/$SERVICE_ID")
    local service_url
    
    if echo "$response" | jq -e '.serviceDetails.url' > /dev/null 2>&1; then
        service_url=$(echo "$response" | jq -r '.serviceDetails.url')
    else
        # Fallback to environment-based URL
        case $ENVIRONMENT in
            production)
                service_url="https://api.tifossi.app"
                ;;
            staging)
                service_url="https://staging-api.tifossi.app"
                ;;
            development)
                service_url="https://dev-api.tifossi.app"
                ;;
        esac
    fi
    
    log "Testing service at: $service_url"
    
    # Test health endpoint
    if curl -f -s --max-time 10 "$service_url/api/health" | grep -q "healthy"; then
        success "Health check passed"
    else
        error "Health check failed"
        return 1
    fi
    
    # Test API root
    if curl -f -s --max-time 10 "$service_url/api" > /dev/null; then
        success "API root endpoint accessible"
    else
        warning "API root endpoint not accessible (this might be normal)"
    fi
    
    success "Post-deployment tests completed"
}

# Send notification
send_notification() {
    local status=$1
    local message=$2
    
    log "Sending deployment notification..."
    
    # Send Slack notification if webhook URL is provided
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        local emoji
        case $status in
            "SUCCESS") emoji="✅" ;;
            "FAILED") emoji="❌" ;;
            "WARNING") emoji="⚠️" ;;
            *) emoji="ℹ️" ;;
        esac
        
        local payload=$(jq -n \
            --arg text "$emoji Tifossi Render Deployment $status: $ENVIRONMENT environment. $message" \
            '{text: $text}')
        
        curl -X POST -H 'Content-type: application/json' \
            --data "$payload" \
            "$SLACK_WEBHOOK_URL" > /dev/null 2>&1 || warning "Failed to send Slack notification"
    fi
    
    if [[ "$status" == "SUCCESS" ]]; then
        success "$message"
    elif [[ "$status" == "FAILED" ]]; then
        error "$message"
    else
        log "$message"
    fi
}

# Get deployment logs
get_deployment_logs() {
    log "Fetching deployment logs..."
    
    local deploy_id
    if [[ -f /tmp/render_deploy_id ]]; then
        deploy_id=$(cat /tmp/render_deploy_id)
    else
        error "Deploy ID not found"
        return 1
    fi
    
    # Note: Render API doesn't currently support fetching build logs via API
    # Users need to check logs in the Render dashboard
    warning "Build logs are available in the Render dashboard:"
    warning "https://dashboard.render.com/web/$SERVICE_ID"
}

# Cleanup function
cleanup() {
    log "Cleaning up temporary files..."
    rm -f /tmp/render_deploy_id
}

# Main deployment process
main() {
    log "Starting Tifossi Backend deployment to Render"
    log "Environment: $ENVIRONMENT"
    log "Service ID: $SERVICE_ID"
    
    # Set up cleanup trap
    trap cleanup EXIT
    
    check_dependencies
    validate_environment
    validate_service_id
    pre_deployment_checks
    build_and_test
    get_service_info || exit 1
    check_env_vars || exit 1
    trigger_deployment || exit 1
    
    # Monitor deployment and run post-deployment tasks
    if monitor_deployment && wait_for_health; then
        post_deployment_tests
        send_notification "SUCCESS" "Deployment completed successfully"
        
        # Display deployment info
        log "Deployment Summary:"
        log "- Environment: $ENVIRONMENT"
        log "- Service ID: $SERVICE_ID"
        log "- Dashboard: https://dashboard.render.com/web/$SERVICE_ID"
        
        case $ENVIRONMENT in
            production)
                log "- Health URL: https://api.tifossi.app/api/health"
                ;;
            staging)
                log "- Health URL: https://staging-api.tifossi.app/api/health"
                ;;
            development)
                log "- Health URL: https://dev-api.tifossi.app/api/health"
                ;;
        esac
        
        success "🎉 Deployment completed successfully!"
    else
        send_notification "FAILED" "Deployment failed during monitoring or health checks"
        get_deployment_logs
        error "Deployment failed. Please check Render dashboard for detailed logs."
        exit 1
    fi
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        show_usage
        ;;
    *)
        if [[ $# -lt 2 ]]; then
            error "Both environment and service ID are required"
            show_usage
        fi
        main "$@"
        ;;
esac
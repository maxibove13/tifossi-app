#!/bin/bash

###############################################################################
# Docker Test Environment for Render Simulation
#
# This script creates a complete Docker environment that mirrors Render.com's
# deployment environment. It includes PostgreSQL 16 and runs the full Strapi
# build and start process in a containerized environment.
#
# Usage: ./docker/test-render-env/test-env.sh [command]
#
# Commands:
#   start   - Build and start the test environment
#   stop    - Stop the test environment
#   clean   - Stop and remove all containers and volumes
#   logs    - Show Strapi logs
#   shell   - Open a shell in the Strapi container
#   db      - Open a psql shell in the database
#   rebuild - Clean rebuild of everything
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m'

# Symbols
SUCCESS="✓"
ERROR="✗"
INFO="ℹ"
WARNING="⚠"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "${SCRIPT_DIR}"

# Function to print header
print_header() {
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}${ERROR} Docker is not running${NC}"
        echo -e "${RED}   Please start Docker Desktop and try again${NC}"
        exit 1
    fi
}

# Function to start the environment
start_env() {
    print_header "Starting Render Test Environment"

    echo -e "\n${BLUE}${INFO} Building Docker images...${NC}"
    docker-compose build

    echo -e "\n${BLUE}${INFO} Starting services...${NC}"
    docker-compose up -d postgres

    echo -e "\n${BLUE}${INFO} Waiting for PostgreSQL to be ready...${NC}"
    timeout 60s bash -c 'until docker-compose exec -T postgres pg_isready -U strapi_user -d strapi_test; do sleep 2; done'

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}${SUCCESS} PostgreSQL is ready${NC}"
    else
        echo -e "${RED}${ERROR} PostgreSQL failed to start${NC}"
        docker-compose logs postgres
        exit 1
    fi

    echo -e "\n${BLUE}${INFO} Starting Strapi (this will build and start)...${NC}"
    docker-compose up -d strapi

    echo -e "\n${BLUE}${INFO} Following Strapi logs (Ctrl+C to stop watching)...${NC}"
    echo -e "${GRAY}───────────────────────────────────────────────────────────${NC}"

    # Follow logs and capture output
    docker-compose logs -f strapi &
    LOGS_PID=$!

    # Wait for Strapi to be ready or fail
    sleep 5

    # Check if container is still running
    if docker-compose ps strapi | grep -q "Up"; then
        echo -e "\n${GREEN}${SUCCESS} Strapi container is running${NC}"

        # Wait a bit more for full startup
        sleep 10

        # Try to access the admin panel
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:1337/admin | grep -q "200\|301\|302"; then
            echo -e "${GREEN}${SUCCESS} Strapi admin panel is accessible at http://localhost:1337/admin${NC}"
        else
            echo -e "${YELLOW}${WARNING} Admin panel not responding yet${NC}"
            echo -e "${YELLOW}   Check logs with: ./docker/test-render-env/test-env.sh logs${NC}"
        fi

        # Kill the log follow
        kill $LOGS_PID 2>/dev/null || true
    else
        echo -e "\n${RED}${ERROR} Strapi container failed to start${NC}"
        echo -e "${RED}   Showing last 50 lines of logs:${NC}"
        docker-compose logs --tail=50 strapi
        exit 1
    fi

    echo -e "\n${GREEN}${SUCCESS} Test environment is running${NC}"
    echo -e "\n${BLUE}Available commands:${NC}"
    echo -e "  ${CYAN}./test-env.sh logs${NC}    - View Strapi logs"
    echo -e "  ${CYAN}./test-env.sh shell${NC}   - Open shell in Strapi container"
    echo -e "  ${CYAN}./test-env.sh db${NC}      - Open PostgreSQL shell"
    echo -e "  ${CYAN}./test-env.sh stop${NC}    - Stop the environment"
}

# Function to stop the environment
stop_env() {
    print_header "Stopping Test Environment"
    docker-compose down
    echo -e "${GREEN}${SUCCESS} Environment stopped${NC}"
}

# Function to clean everything
clean_env() {
    print_header "Cleaning Test Environment"
    echo -e "${YELLOW}${WARNING} This will remove all containers, images, and volumes${NC}"
    echo -e "${YELLOW}   Press Ctrl+C to cancel, or wait 5 seconds to continue...${NC}"
    sleep 5

    docker-compose down -v --rmi local
    echo -e "${GREEN}${SUCCESS} Environment cleaned${NC}"
}

# Function to show logs
show_logs() {
    print_header "Strapi Logs"
    docker-compose logs -f strapi
}

# Function to open shell
open_shell() {
    print_header "Strapi Container Shell"
    docker-compose exec strapi /bin/bash
}

# Function to open database shell
open_db() {
    print_header "PostgreSQL Shell"
    docker-compose exec postgres psql -U strapi_user -d strapi_test
}

# Function to rebuild
rebuild_env() {
    print_header "Rebuilding Test Environment"
    clean_env
    start_env
}

# Main script
check_docker

COMMAND=${1:-start}

case $COMMAND in
    start)
        start_env
        ;;
    stop)
        stop_env
        ;;
    clean)
        clean_env
        ;;
    logs)
        show_logs
        ;;
    shell)
        open_shell
        ;;
    db)
        open_db
        ;;
    rebuild)
        rebuild_env
        ;;
    *)
        echo -e "${RED}${ERROR} Unknown command: $COMMAND${NC}"
        echo -e "\n${BLUE}Available commands:${NC}"
        echo -e "  start   - Build and start the test environment"
        echo -e "  stop    - Stop the test environment"
        echo -e "  clean   - Stop and remove all containers and volumes"
        echo -e "  logs    - Show Strapi logs"
        echo -e "  shell   - Open a shell in the Strapi container"
        echo -e "  db      - Open a psql shell in the database"
        echo -e "  rebuild - Clean rebuild of everything"
        exit 1
        ;;
esac

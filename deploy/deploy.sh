#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# 0RB SYSTEM - DEPLOYMENT SCRIPT
# ═══════════════════════════════════════════════════════════════════
# Usage:
#   ./deploy.sh brain      - Deploy brain server only (local Xeon)
#   ./deploy.sh web        - Deploy web frontend only (cloud)
#   ./deploy.sh full       - Deploy full stack
#   ./deploy.sh down       - Stop all services
# ═══════════════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_banner() {
    echo -e "${CYAN}"
    echo "╔═══════════════════════════════════════════════════════════════════╗"
    echo "║                                                                   ║"
    echo "║   ██████╗ ██████╗ ██████╗     ██████╗ ███████╗██████╗ ██╗      ║"
    echo "║  ██╔═══██╗██╔══██╗██╔══██╗    ██╔══██╗██╔════╝██╔══██╗██║      ║"
    echo "║  ██║   ██║██████╔╝██████╔╝    ██║  ██║█████╗  ██████╔╝██║      ║"
    echo "║  ██║   ██║██╔══██╗██╔══██╗    ██║  ██║██╔══╝  ██╔═══╝ ██║      ║"
    echo "║  ╚██████╔╝██║  ██║██████╔╝    ██████╔╝███████╗██║     ███████╗ ║"
    echo "║   ╚═════╝ ╚═╝  ╚═╝╚═════╝     ╚═════╝ ╚══════╝╚═╝     ╚══════╝ ║"
    echo "║                                                                   ║"
    echo "╚═══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

check_requirements() {
    echo -e "${BLUE}Checking requirements...${NC}"

    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}Docker Compose is not installed. Please install Docker Compose.${NC}"
        exit 1
    fi

    echo -e "${GREEN}All requirements met.${NC}"
}

generate_env() {
    ENV_FILE="$SCRIPT_DIR/.env"

    if [ ! -f "$ENV_FILE" ]; then
        echo -e "${YELLOW}Generating .env file...${NC}"

        # Generate secure token
        TOKEN=$(openssl rand -hex 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1)

        cat > "$ENV_FILE" << EOF
# 0RB System Configuration
# Generated on $(date)

# Brain Server Auth Token (CHANGE IN PRODUCTION!)
BRAIN_AUTH_TOKEN=${TOKEN}

# Allowed Origins (comma-separated, * for all)
ALLOWED_ORIGINS=*

# API Keys (add your own)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Public URLs (for web frontend)
NEXT_PUBLIC_BRAIN_URL=http://localhost:8420
NEXT_PUBLIC_WS_URL=ws://localhost:8421
EOF

        echo -e "${GREEN}Created .env file. Please edit with your settings.${NC}"
    else
        echo -e "${BLUE}Using existing .env file${NC}"
    fi

    export $(cat "$ENV_FILE" | grep -v '^#' | xargs)
}

deploy_brain() {
    echo -e "${CYAN}Deploying Brain Server (Local Xeon)...${NC}"

    cd "$SCRIPT_DIR"

    # Build and start brain
    docker compose build brain
    docker compose up -d brain

    # Wait for health check
    echo -e "${YELLOW}Waiting for Brain Server to be ready...${NC}"
    for i in {1..30}; do
        if curl -s -o /dev/null -w "%{http_code}" "http://localhost:8420/status" -H "Authorization: Bearer $BRAIN_AUTH_TOKEN" | grep -q "200"; then
            echo -e "${GREEN}Brain Server is online!${NC}"
            echo ""
            echo -e "  HTTP API:    ${CYAN}http://localhost:8420${NC}"
            echo -e "  WebSocket:   ${CYAN}ws://localhost:8421${NC}"
            echo -e "  Auth Token:  ${YELLOW}(see .env file)${NC}"
            echo ""
            return 0
        fi
        sleep 2
    done

    echo -e "${RED}Brain Server failed to start. Check logs:${NC}"
    docker compose logs brain
    exit 1
}

deploy_web() {
    echo -e "${CYAN}Deploying Web Frontend...${NC}"

    cd "$SCRIPT_DIR"

    # Build and start web
    docker compose build web
    docker compose up -d web

    # Wait for startup
    echo -e "${YELLOW}Waiting for Web Frontend to be ready...${NC}"
    sleep 5

    echo -e "${GREEN}Web Frontend is online!${NC}"
    echo ""
    echo -e "  URL:  ${CYAN}http://localhost:3000${NC}"
    echo ""
}

deploy_full() {
    echo -e "${CYAN}Deploying Full Stack...${NC}"

    cd "$SCRIPT_DIR"

    # Build all
    docker compose build

    # Start services
    docker compose up -d

    # Wait for brain first
    echo -e "${YELLOW}Waiting for services to be ready...${NC}"
    sleep 10

    echo -e "${GREEN}Full stack deployed!${NC}"
    echo ""
    echo -e "  Brain API:   ${CYAN}http://localhost:8420${NC}"
    echo -e "  WebSocket:   ${CYAN}ws://localhost:8421${NC}"
    echo -e "  Web UI:      ${CYAN}http://localhost:3000${NC}"
    echo ""
}

stop_all() {
    echo -e "${YELLOW}Stopping all services...${NC}"

    cd "$SCRIPT_DIR"
    docker compose down

    echo -e "${GREEN}All services stopped.${NC}"
}

show_status() {
    echo -e "${BLUE}Current Status:${NC}"

    cd "$SCRIPT_DIR"
    docker compose ps

    echo ""

    # Check brain health
    if curl -s "http://localhost:8420/status" -H "Authorization: Bearer ${BRAIN_AUTH_TOKEN:-}" 2>/dev/null | grep -q "online"; then
        echo -e "Brain Server: ${GREEN}ONLINE${NC}"
    else
        echo -e "Brain Server: ${RED}OFFLINE${NC}"
    fi

    # Check web
    if curl -s "http://localhost:3000" >/dev/null 2>&1; then
        echo -e "Web Frontend: ${GREEN}ONLINE${NC}"
    else
        echo -e "Web Frontend: ${RED}OFFLINE${NC}"
    fi
}

show_logs() {
    cd "$SCRIPT_DIR"
    docker compose logs -f "${2:-}"
}

# ═══════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════

print_banner
check_requirements
generate_env

case "${1:-help}" in
    brain)
        deploy_brain
        ;;
    web)
        deploy_web
        ;;
    full)
        deploy_full
        ;;
    down|stop)
        stop_all
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs "$@"
        ;;
    *)
        echo "Usage: $0 {brain|web|full|down|status|logs}"
        echo ""
        echo "Commands:"
        echo "  brain   - Deploy brain server only (local Xeon)"
        echo "  web     - Deploy web frontend only"
        echo "  full    - Deploy full stack"
        echo "  down    - Stop all services"
        echo "  status  - Show service status"
        echo "  logs    - Show logs (optionally: logs brain|web)"
        echo ""
        exit 1
        ;;
esac

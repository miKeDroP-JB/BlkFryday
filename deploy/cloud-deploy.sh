#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# 0RB SYSTEM - CLOUD DEPLOYMENT
# ═══════════════════════════════════════════════════════════════════
# Deploy web frontend to cloud providers
#
# Usage:
#   ./cloud-deploy.sh vercel     - Deploy to Vercel
#   ./cloud-deploy.sh netlify    - Deploy to Netlify
#   ./cloud-deploy.sh railway    - Deploy to Railway
#   ./cloud-deploy.sh fly        - Deploy to Fly.io
# ═══════════════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
WEB_DIR="$PROJECT_DIR/web"

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
    echo "║              0RB CLOUD DEPLOYMENT                                 ║"
    echo "║           Frontend → Cloud / Brain → Local                        ║"
    echo "╚═══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

get_brain_url() {
    echo -e "${YELLOW}Enter your Brain Server URL${NC}"
    echo -e "This is the public URL where your local Xeon server is accessible"
    echo -e "Example: https://brain.yourdomain.com or http://YOUR_IP:8420"
    echo ""
    read -p "Brain HTTP URL: " BRAIN_URL
    read -p "Brain WebSocket URL: " WS_URL

    if [ -z "$BRAIN_URL" ] || [ -z "$WS_URL" ]; then
        echo -e "${RED}Brain URLs are required!${NC}"
        exit 1
    fi

    export NEXT_PUBLIC_BRAIN_URL="$BRAIN_URL"
    export NEXT_PUBLIC_WS_URL="$WS_URL"

    echo -e "${GREEN}Using Brain Server: $BRAIN_URL${NC}"
}

deploy_vercel() {
    echo -e "${CYAN}Deploying to Vercel...${NC}"

    if ! command -v vercel &> /dev/null; then
        echo -e "${YELLOW}Installing Vercel CLI...${NC}"
        npm i -g vercel
    fi

    cd "$WEB_DIR"

    # Set environment variables
    echo -e "${BLUE}Setting environment variables...${NC}"
    vercel env add NEXT_PUBLIC_BRAIN_URL production <<< "$NEXT_PUBLIC_BRAIN_URL" || true
    vercel env add NEXT_PUBLIC_WS_URL production <<< "$NEXT_PUBLIC_WS_URL" || true

    # Deploy
    echo -e "${BLUE}Deploying...${NC}"
    vercel --prod

    echo -e "${GREEN}Deployed to Vercel!${NC}"
}

deploy_netlify() {
    echo -e "${CYAN}Deploying to Netlify...${NC}"

    if ! command -v netlify &> /dev/null; then
        echo -e "${YELLOW}Installing Netlify CLI...${NC}"
        npm i -g netlify-cli
    fi

    cd "$WEB_DIR"

    # Build
    echo -e "${BLUE}Building...${NC}"
    npm run build

    # Deploy
    echo -e "${BLUE}Deploying...${NC}"
    netlify deploy --prod --dir=.next

    echo -e "${GREEN}Deployed to Netlify!${NC}"
}

deploy_railway() {
    echo -e "${CYAN}Deploying to Railway...${NC}"

    if ! command -v railway &> /dev/null; then
        echo -e "${YELLOW}Installing Railway CLI...${NC}"
        npm i -g @railway/cli
    fi

    cd "$WEB_DIR"

    # Login if needed
    railway login --browserless 2>/dev/null || true

    # Deploy
    echo -e "${BLUE}Deploying...${NC}"
    railway up

    echo -e "${GREEN}Deployed to Railway!${NC}"
}

deploy_fly() {
    echo -e "${CYAN}Deploying to Fly.io...${NC}"

    if ! command -v flyctl &> /dev/null; then
        echo -e "${YELLOW}Installing Fly CLI...${NC}"
        curl -L https://fly.io/install.sh | sh
    fi

    cd "$WEB_DIR"

    # Create fly.toml if not exists
    if [ ! -f "fly.toml" ]; then
        echo -e "${BLUE}Creating fly.toml...${NC}"
        cat > fly.toml << EOF
app = "orb-web"
primary_region = "iad"

[build]
  dockerfile = "../deploy/docker/Dockerfile.web"

[env]
  NODE_ENV = "production"
  NEXT_PUBLIC_BRAIN_URL = "$NEXT_PUBLIC_BRAIN_URL"
  NEXT_PUBLIC_WS_URL = "$NEXT_PUBLIC_WS_URL"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
EOF
    fi

    # Deploy
    echo -e "${BLUE}Deploying...${NC}"
    flyctl deploy

    echo -e "${GREEN}Deployed to Fly.io!${NC}"
}

show_tunnel_instructions() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}IMPORTANT: Making your Brain Server accessible${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Your cloud frontend needs to connect to your local Brain Server."
    echo "Options to expose your Brain Server:"
    echo ""
    echo -e "${BLUE}1. Cloudflare Tunnel (Recommended)${NC}"
    echo "   cloudflared tunnel --url http://localhost:8420"
    echo ""
    echo -e "${BLUE}2. ngrok${NC}"
    echo "   ngrok http 8420"
    echo ""
    echo -e "${BLUE}3. Tailscale (Private Network)${NC}"
    echo "   Use your Tailscale IP address"
    echo ""
    echo -e "${BLUE}4. Port Forwarding${NC}"
    echo "   Configure your router to forward ports 8420 and 8421"
    echo ""
    echo -e "${BLUE}5. VPS with WireGuard${NC}"
    echo "   Set up a VPN to your local network"
    echo ""
}

# ═══════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════

print_banner
show_tunnel_instructions
get_brain_url

case "${1:-help}" in
    vercel)
        deploy_vercel
        ;;
    netlify)
        deploy_netlify
        ;;
    railway)
        deploy_railway
        ;;
    fly)
        deploy_fly
        ;;
    *)
        echo "Usage: $0 {vercel|netlify|railway|fly}"
        echo ""
        echo "Cloud Providers:"
        echo "  vercel   - Deploy to Vercel (recommended for Next.js)"
        echo "  netlify  - Deploy to Netlify"
        echo "  railway  - Deploy to Railway"
        echo "  fly      - Deploy to Fly.io"
        echo ""
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Brain Server: ${CYAN}$BRAIN_URL${NC} (local)"
echo -e "  Web Frontend: ${CYAN}Check deployment output above${NC} (cloud)"
echo ""
echo -e "  ${YELLOW}Make sure your Brain Server is running and accessible!${NC}"
echo ""

#!/bin/bash
# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║   ORB UNIVERSAL LAUNCHER                                                  ║
# ║   Works on: Laptop | Xeon Server | NAS | Cloud VM                         ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Find ORB root (where this script lives)
export ORB_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo -e "${PURPLE}"
echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║   🔮 ORB CONSCIOUSNESS ENGINE - INITIALIZING                              ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Detect environment
detect_environment() {
    if [ -n "$RAILWAY_ENVIRONMENT" ]; then
        echo -e "${BLUE}☁️  Railway Cloud Detected${NC}"
        export ORB_MODE="cloud"
        export WS_PORT="${PORT:-8081}"
    elif [ -n "$RENDER" ]; then
        echo -e "${BLUE}☁️  Render Cloud Detected${NC}"
        export ORB_MODE="cloud"
        export WS_PORT="${PORT:-8081}"
    elif [ -n "$FLY_APP_NAME" ]; then
        echo -e "${BLUE}☁️  Fly.io Detected${NC}"
        export ORB_MODE="cloud"
        export WS_PORT="${PORT:-8081}"
    elif [ -f /proc/cpuinfo ] && grep -q "Xeon" /proc/cpuinfo 2>/dev/null; then
        echo -e "${GREEN}🖥️  Xeon Server Detected${NC}"
        export ORB_MODE="server"
        export WS_PORT="${WS_PORT:-8081}"
    elif [ -d /volume1 ] || [ -d /share ]; then
        echo -e "${GREEN}📦 NAS Detected${NC}"
        export ORB_MODE="nas"
        export WS_PORT="${WS_PORT:-8081}"
    else
        echo -e "${BLUE}💻 Development Mode${NC}"
        export ORB_MODE="dev"
        export WS_PORT="${WS_PORT:-8081}"
    fi

    echo -e "   Mode: ${GREEN}$ORB_MODE${NC}"
    echo -e "   WebSocket Port: ${GREEN}$WS_PORT${NC}"
    echo ""
}

# Check Node.js
check_node() {
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js not found!${NC}"
        echo "   Install: https://nodejs.org/"
        exit 1
    fi

    NODE_VERSION=$(node -v)
    echo -e "   Node.js: ${GREEN}$NODE_VERSION${NC}"
}

# Check dependencies
check_deps() {
    cd "$ORB_ROOT"

    if [ ! -d "node_modules" ]; then
        echo -e "${BLUE}📦 Installing dependencies...${NC}"
        npm install
    fi
}

# Ensure data directory
ensure_data() {
    mkdir -p "$ORB_ROOT/data"

    # Initialize empty ledgers if needed
    if [ ! -f "$ORB_ROOT/data/ekoLedger.json" ]; then
        echo '{"balances":{},"transactions":[]}' > "$ORB_ROOT/data/ekoLedger.json"
    fi

    if [ ! -f "$ORB_ROOT/data/giftLog.json" ]; then
        echo '{"gifts":[],"karma":{}}' > "$ORB_ROOT/data/giftLog.json"
    fi

    echo -e "   Data directory: ${GREEN}$ORB_ROOT/data${NC}"
}

# Start the ORB
start_orb() {
    cd "$ORB_ROOT"

    echo ""
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}🔮 Starting ORB...${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════════════════${NC}"
    echo ""

    # Parse arguments
    if [ "$1" == "--server" ]; then
        # Server mode - headless with WebSocket
        export ORB_HEADLESS=true
        node term.js --server
    elif [ "$1" == "--daemon" ]; then
        # Daemon mode - background
        nohup node term.js --server > "$ORB_ROOT/data/orb.log" 2>&1 &
        echo $! > "$ORB_ROOT/data/orb.pid"
        echo -e "${GREEN}ORB running in background (PID: $(cat $ORB_ROOT/data/orb.pid))${NC}"
    else
        # Interactive mode
        node term.js "$@"
    fi
}

# Main
detect_environment
check_node
check_deps
ensure_data
start_orb "$@"

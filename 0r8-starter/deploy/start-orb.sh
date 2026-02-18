#!/bin/bash
# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║   ORB UNIVERSAL LAUNCHER                                                  ║
# ║   Works on: Laptop | Xeon Server | NAS | Cloud VM                         ║
# ║   Supports: --local-first (Ollama) | --server | --daemon                  ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Find ORB root (where this script lives)
export ORB_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Check for local-first flag
LOCAL_FIRST=false
for arg in "$@"; do
    if [ "$arg" == "--local-first" ] || [ "$arg" == "-l" ]; then
        LOCAL_FIRST=true
    fi
done

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
        export ORB_MODE="local-first"
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

    # Override if --local-first flag passed
    if [ "$LOCAL_FIRST" = true ]; then
        echo -e "${YELLOW}🏠 LOCAL-FIRST MODE ENABLED${NC}"
        export ORB_MODE="local-first"
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

# Check and start Ollama (for local-first mode)
check_ollama() {
    if [ "$ORB_MODE" != "local-first" ]; then
        return 0
    fi

    echo -e "${YELLOW}🦙 Checking Ollama...${NC}"

    # Check if Ollama is installed
    if ! command -v ollama &> /dev/null; then
        echo -e "${RED}   Ollama not found!${NC}"
        echo -e "   Install: ${BLUE}curl -fsSL https://ollama.com/install.sh | sh${NC}"
        echo -e "   Falling back to API mode..."
        export ORB_MODE="dev"
        return 1
    fi

    # Check if Ollama is running
    if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo -e "${YELLOW}   Starting Ollama service...${NC}"
        ollama serve &> "$ORB_ROOT/data/ollama.log" &
        sleep 2
    fi

    # Check for models
    MODELS=$(curl -s http://localhost:11434/api/tags 2>/dev/null | grep -o '"name":"[^"]*"' | head -3)
    if [ -z "$MODELS" ]; then
        echo -e "${YELLOW}   No models found. Pulling mistral...${NC}"
        ollama pull mistral &
        echo -e "   (Downloading in background, will be ready soon)"
    else
        echo -e "${GREEN}   Models available:${NC}"
        echo "$MODELS" | sed 's/"name":"/ - /g' | sed 's/"//g'
    fi

    export OLLAMA_HOST="http://localhost:11434"
    echo ""
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

# Show RAM info for local-first mode
show_ram_info() {
    if [ "$ORB_MODE" == "local-first" ]; then
        echo -e "${YELLOW}💾 System Resources:${NC}"
        if command -v free &> /dev/null; then
            TOTAL_RAM=$(free -h | awk '/^Mem:/ {print $2}')
            AVAIL_RAM=$(free -h | awk '/^Mem:/ {print $7}')
            echo -e "   Total RAM: ${GREEN}$TOTAL_RAM${NC}"
            echo -e "   Available: ${GREEN}$AVAIL_RAM${NC}"
        fi
        echo ""
    fi
}

# Main
detect_environment
check_node
check_ollama
show_ram_info
check_deps
ensure_data
start_orb "$@"

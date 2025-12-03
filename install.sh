#!/bin/bash
#═══════════════════════════════════════════════════════════════════
# 0RB SYSTEM - One Command Install
#═══════════════════════════════════════════════════════════════════
# Usage: curl -sSL <url> | bash
# Or:    ./install.sh
#═══════════════════════════════════════════════════════════════════

set -e

CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
GOLD='\033[0;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}"
cat << 'EOF'
   ██████╗ ██████╗ ██████╗     ███████╗██╗   ██╗███████╗████████╗███████╗███╗   ███╗
  ██╔═══██╗██╔══██╗██╔══██╗    ██╔════╝╚██╗ ██╔╝██╔════╝╚══██╔══╝██╔════╝████╗ ████║
  ██║   ██║██████╔╝██████╔╝    ███████╗ ╚████╔╝ ███████╗   ██║   █████╗  ██╔████╔██║
  ██║   ██║██╔══██╗██╔══██╗    ╚════██║  ╚██╔╝  ╚════██║   ██║   ██╔══╝  ██║╚██╔╝██║
  ╚██████╔╝██║  ██║██████╔╝    ███████║   ██║   ███████║   ██║   ███████╗██║ ╚═╝ ██║
   ╚═════╝ ╚═╝  ╚═╝╚═════╝     ╚══════╝   ╚═╝   ╚══════╝   ╚═╝   ╚══════╝╚═╝     ╚═╝
                              ONE COMMAND INSTALL
EOF
echo -e "${NC}"

# ─────────────────────────────────────────────────────────────────
# Detect OS
# ─────────────────────────────────────────────────────────────────
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        PKG="brew"
    elif [[ -f /etc/arch-release ]]; then
        OS="arch"
        PKG="pacman"
    elif [[ -f /etc/debian_version ]]; then
        OS="debian"
        PKG="apt"
    elif [[ -f /etc/fedora-release ]]; then
        OS="fedora"
        PKG="dnf"
    else
        OS="unknown"
        PKG="unknown"
    fi
    echo -e "${GOLD}Detected: $OS ($PKG)${NC}"
}

# ─────────────────────────────────────────────────────────────────
# Install Dependencies
# ─────────────────────────────────────────────────────────────────
install_deps() {
    echo -e "\n${MAGENTA}═══ Installing Dependencies ═══${NC}\n"

    case $PKG in
        brew)
            brew install node python git curl
            ;;
        pacman)
            sudo pacman -Sy --noconfirm nodejs npm python python-pip git curl
            ;;
        apt)
            sudo apt update
            sudo apt install -y nodejs npm python3 python3-pip python3-venv git curl
            ;;
        dnf)
            sudo dnf install -y nodejs npm python3 python3-pip git curl
            ;;
        *)
            echo -e "${RED}Please install Node.js, Python 3, and Git manually${NC}"
            ;;
    esac

    echo -e "${GREEN}✓ Dependencies installed${NC}"
}

# ─────────────────────────────────────────────────────────────────
# Install Ollama (Optional AI)
# ─────────────────────────────────────────────────────────────────
install_ollama() {
    echo -e "\n${MAGENTA}═══ Installing Ollama (Local AI) ═══${NC}\n"

    if command -v ollama &> /dev/null; then
        echo -e "${GREEN}✓ Ollama already installed${NC}"
    else
        curl -fsSL https://ollama.ai/install.sh | sh
        echo -e "${GREEN}✓ Ollama installed${NC}"
    fi

    # Pull a model in background
    echo -e "${CYAN}Pulling llama3 model (background)...${NC}"
    ollama pull llama3 &>/dev/null &
}

# ─────────────────────────────────────────────────────────────────
# Setup Web App
# ─────────────────────────────────────────────────────────────────
setup_web() {
    echo -e "\n${MAGENTA}═══ Setting up Web App ═══${NC}\n"

    cd web
    npm install
    cd ..

    echo -e "${GREEN}✓ Web app ready${NC}"
}

# ─────────────────────────────────────────────────────────────────
# Setup Python Environment
# ─────────────────────────────────────────────────────────────────
setup_python() {
    echo -e "\n${MAGENTA}═══ Setting up Python Environment ═══${NC}\n"

    python3 -m venv .venv
    source .venv/bin/activate

    pip install --upgrade pip
    pip install \
        fastapi \
        uvicorn \
        httpx \
        pydantic \
        python-dotenv \
        langchain \
        openai \
        anthropic

    deactivate

    echo -e "${GREEN}✓ Python environment ready${NC}"
}

# ─────────────────────────────────────────────────────────────────
# Create Start Script
# ─────────────────────────────────────────────────────────────────
create_start_script() {
    cat > start.sh << 'SCRIPT'
#!/bin/bash
# 0RB System - Start All Services

echo "Starting 0RB System..."

# Start Ollama if installed
if command -v ollama &> /dev/null; then
    echo "Starting Ollama..."
    ollama serve &>/dev/null &
    sleep 2
fi

# Start web app
echo "Starting web app on http://localhost:3000"
cd web && npm run dev
SCRIPT

    chmod +x start.sh
    echo -e "${GREEN}✓ Start script created${NC}"
}

# ─────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────
main() {
    detect_os

    echo -e "\n${GOLD}What would you like to install?${NC}"
    echo "  1) Web App only (quick)"
    echo "  2) Web App + Local AI (Ollama)"
    echo "  3) Full stack (Web + Python + AI)"
    echo ""
    read -p "Choice [1-3, default=1]: " choice

    case ${choice:-1} in
        1)
            setup_web
            ;;
        2)
            install_deps
            install_ollama
            setup_web
            ;;
        3)
            install_deps
            install_ollama
            setup_web
            setup_python
            ;;
    esac

    create_start_script

    echo -e "\n${GREEN}"
    cat << 'EOF'
╔═══════════════════════════════════════════════════════════════════╗
║                    INSTALLATION COMPLETE                          ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║   To start:     ./start.sh                                       ║
║   Or manually:  cd web && npm run dev                            ║
║                                                                   ║
║   Web App:      http://localhost:3000                            ║
║   API:          http://localhost:3000/api/reality                ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

main "$@"

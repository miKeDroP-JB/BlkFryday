#!/bin/bash
# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║                                                                           ║
# ║    ██████╗ ██████╗ ██████╗     ██████╗ ███████╗    ███████╗███████╗████████║
# ║   ██╔═══██╗██╔══██╗██╔══██╗    ██╔══██╗██╔════╝    ██╔════╝██╔════╝╚══██╔══║
# ║   ██║   ██║██████╔╝██████╔╝    ██████╔╝███████╗    ███████╗█████╗     ██║  ║
# ║   ██║   ██║██╔══██╗██╔══██╗    ██╔══██╗╚════██║    ╚════██║██╔══╝     ██║  ║
# ║   ╚██████╔╝██║  ██║██████╔╝    ██████╔╝███████║    ███████║███████╗   ██║  ║
# ║    ╚═════╝ ╚═╝  ╚═╝╚═════╝     ╚═════╝ ╚══════╝    ╚══════╝╚══════╝   ╚═╝  ║
# ║                                                                           ║
# ║   EXTERNAL SSD SETUP - THE BUILDER THAT BUILDS THE FUTURE                 ║
# ║                                                                           ║
# ╚═══════════════════════════════════════════════════════════════════════════╝
#
# This script sets up a complete AI development environment on your system.
# Run this AFTER you have a base OS installed on your external SSD.
#
# Supports: Arch Linux, Ubuntu/Debian, Fedora, macOS
#
# Usage: curl -sSL https://raw.githubusercontent.com/.../setup.sh | bash
#    or: ./setup.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Banner
echo -e "${PURPLE}"
cat << 'EOF'
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║     ████████╗██╗  ██╗███████╗    ██████╗ ██████╗ ██████╗                  ║
║     ╚══██╔══╝██║  ██║██╔════╝   ██╔═══██╗██╔══██╗██╔══██╗                 ║
║        ██║   ███████║█████╗     ██║   ██║██████╔╝██████╔╝                 ║
║        ██║   ██╔══██║██╔══╝     ██║   ██║██╔══██╗██╔══██╗                 ║
║        ██║   ██║  ██║███████╗   ╚██████╔╝██║  ██║██████╔╝                 ║
║        ╚═╝   ╚═╝  ╚═╝╚══════╝    ╚═════╝ ╚═╝  ╚═╝╚═════╝                  ║
║                                                                           ║
║                  THE BUILDER THAT BUILDS THE FUTURE                       ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# ═══════════════════════════════════════════════════════════════════════════
# DETECT OS
# ═══════════════════════════════════════════════════════════════════════════

detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        PKG_MANAGER="brew"
    elif [ -f /etc/arch-release ]; then
        OS="arch"
        PKG_MANAGER="pacman"
    elif [ -f /etc/debian_version ]; then
        OS="debian"
        PKG_MANAGER="apt"
    elif [ -f /etc/fedora-release ]; then
        OS="fedora"
        PKG_MANAGER="dnf"
    else
        OS="unknown"
        PKG_MANAGER="unknown"
    fi

    echo -e "${CYAN}⟡ Detected OS: ${OS} (${PKG_MANAGER})${NC}"
}

# ═══════════════════════════════════════════════════════════════════════════
# INSTALL PACKAGES
# ═══════════════════════════════════════════════════════════════════════════

install_base_packages() {
    echo -e "\n${YELLOW}⟡ Installing base packages...${NC}"

    case $PKG_MANAGER in
        pacman)
            sudo pacman -Syu --noconfirm
            sudo pacman -S --noconfirm \
                base-devel git curl wget \
                nodejs npm python python-pip \
                docker docker-compose \
                neovim tmux zsh \
                ripgrep fd bat exa \
                jq htop
            ;;
        apt)
            sudo apt update && sudo apt upgrade -y
            sudo apt install -y \
                build-essential git curl wget \
                nodejs npm python3 python3-pip python3-venv \
                docker.io docker-compose \
                neovim tmux zsh \
                ripgrep fd-find bat \
                jq htop
            ;;
        dnf)
            sudo dnf update -y
            sudo dnf install -y \
                @development-tools git curl wget \
                nodejs npm python3 python3-pip \
                docker docker-compose \
                neovim tmux zsh \
                ripgrep fd-find bat \
                jq htop
            ;;
        brew)
            brew update
            brew install \
                git curl wget \
                node python \
                docker docker-compose \
                neovim tmux zsh \
                ripgrep fd bat eza \
                jq htop
            ;;
    esac

    echo -e "${GREEN}  ✓ Base packages installed${NC}"
}

# ═══════════════════════════════════════════════════════════════════════════
# INSTALL NODE.JS (via nvm for version control)
# ═══════════════════════════════════════════════════════════════════════════

install_node() {
    echo -e "\n${YELLOW}⟡ Setting up Node.js via nvm...${NC}"

    if [ ! -d "$HOME/.nvm" ]; then
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    fi

    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

    nvm install 20
    nvm use 20
    nvm alias default 20

    # Install global packages
    npm install -g pnpm yarn

    echo -e "${GREEN}  ✓ Node.js $(node -v) ready${NC}"
}

# ═══════════════════════════════════════════════════════════════════════════
# INSTALL PYTHON ENVIRONMENT
# ═══════════════════════════════════════════════════════════════════════════

install_python() {
    echo -e "\n${YELLOW}⟡ Setting up Python environment...${NC}"

    # Install pyenv for Python version management
    if [ ! -d "$HOME/.pyenv" ]; then
        curl https://pyenv.run | bash
    fi

    export PYENV_ROOT="$HOME/.pyenv"
    export PATH="$PYENV_ROOT/bin:$PATH"
    eval "$(pyenv init -)"

    # Install Python 3.11
    pyenv install -s 3.11.7
    pyenv global 3.11.7

    # Install pipx for global tools
    pip install --user pipx
    pipx ensurepath

    # Install common tools
    pipx install poetry
    pipx install black
    pipx install ruff

    echo -e "${GREEN}  ✓ Python $(python --version) ready${NC}"
}

# ═══════════════════════════════════════════════════════════════════════════
# INSTALL AI STACK
# ═══════════════════════════════════════════════════════════════════════════

install_ai_stack() {
    echo -e "\n${YELLOW}⟡ Installing AI stack...${NC}"

    # Ollama (local LLM)
    if ! command -v ollama &> /dev/null; then
        curl -fsSL https://ollama.com/install.sh | sh
    fi

    # Claude CLI (if available)
    if command -v npm &> /dev/null; then
        npm install -g @anthropic-ai/claude-code 2>/dev/null || true
    fi

    echo -e "${GREEN}  ✓ AI stack ready${NC}"
}

# ═══════════════════════════════════════════════════════════════════════════
# INSTALL DOCKER
# ═══════════════════════════════════════════════════════════════════════════

setup_docker() {
    echo -e "\n${YELLOW}⟡ Setting up Docker...${NC}"

    # Start Docker service
    if [[ "$OS" != "macos" ]]; then
        sudo systemctl enable docker
        sudo systemctl start docker
        sudo usermod -aG docker $USER
    fi

    echo -e "${GREEN}  ✓ Docker ready${NC}"
}

# ═══════════════════════════════════════════════════════════════════════════
# SETUP ZSH
# ═══════════════════════════════════════════════════════════════════════════

setup_zsh() {
    echo -e "\n${YELLOW}⟡ Setting up ZSH...${NC}"

    # Install Oh My Zsh
    if [ ! -d "$HOME/.oh-my-zsh" ]; then
        sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
    fi

    # Install plugins
    ZSH_CUSTOM="${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}"

    if [ ! -d "$ZSH_CUSTOM/plugins/zsh-autosuggestions" ]; then
        git clone https://github.com/zsh-users/zsh-autosuggestions "$ZSH_CUSTOM/plugins/zsh-autosuggestions"
    fi

    if [ ! -d "$ZSH_CUSTOM/plugins/zsh-syntax-highlighting" ]; then
        git clone https://github.com/zsh-users/zsh-syntax-highlighting "$ZSH_CUSTOM/plugins/zsh-syntax-highlighting"
    fi

    # Install Starship prompt
    if ! command -v starship &> /dev/null; then
        curl -sS https://starship.rs/install.sh | sh -s -- -y
    fi

    echo -e "${GREEN}  ✓ ZSH ready${NC}"
}

# ═══════════════════════════════════════════════════════════════════════════
# CLONE 0RB REPO
# ═══════════════════════════════════════════════════════════════════════════

setup_orb() {
    echo -e "\n${YELLOW}⟡ Setting up 0RB System...${NC}"

    ORB_DIR="$HOME/0rb"

    if [ ! -d "$ORB_DIR" ]; then
        mkdir -p "$ORB_DIR"
        # Clone BlkFryday repo (or your main repo)
        git clone https://github.com/miKeDroP-JB/BlkFryday.git "$ORB_DIR/blkfryday" 2>/dev/null || \
            echo -e "${YELLOW}  ⚠ Could not clone repo - will set up structure manually${NC}"
    fi

    # Create directory structure if repo clone failed
    mkdir -p "$ORB_DIR"/{projects,outputs,data,logs}

    # Install dependencies
    if [ -f "$ORB_DIR/blkfryday/package.json" ]; then
        cd "$ORB_DIR/blkfryday"
        npm install
    fi

    # Install contracts dependencies
    if [ -f "$ORB_DIR/blkfryday/contracts/package.json" ]; then
        cd "$ORB_DIR/blkfryday/contracts"
        npm install
    fi

    echo -e "${GREEN}  ✓ 0RB System ready at $ORB_DIR${NC}"
}

# ═══════════════════════════════════════════════════════════════════════════
# CREATE ENVIRONMENT CONFIG
# ═══════════════════════════════════════════════════════════════════════════

setup_env() {
    echo -e "\n${YELLOW}⟡ Creating environment configuration...${NC}"

    ENV_FILE="$HOME/.orb-env"

    cat > "$ENV_FILE" << 'ENVEOF'
# ═══════════════════════════════════════════════════════════════════════════
# 0RB SYSTEM ENVIRONMENT
# ═══════════════════════════════════════════════════════════════════════════

# AI Provider Keys (fill these in)
export OPENAI_API_KEY=""
export ANTHROPIC_API_KEY=""
export GROQ_API_KEY=""

# Blockchain
export PRIVATE_KEY=""
export ETHERSCAN_API_KEY=""
export BASESCAN_API_KEY=""

# Paths
export ORB_HOME="$HOME/0rb"
export ORB_PROJECTS="$ORB_HOME/projects"
export ORB_OUTPUTS="$ORB_HOME/outputs"

# Defaults
export ORB_DEFAULT_PROVIDER="anthropic"
export ORB_DEFAULT_MODEL="claude-sonnet-4-20250514"
export ORB_DEFAULT_NETWORK="base"

# Load into shell
export PATH="$ORB_HOME/bin:$PATH"
ENVEOF

    echo -e "${GREEN}  ✓ Environment config created at $ENV_FILE${NC}"
    echo -e "${YELLOW}  ⚠ Don't forget to add your API keys!${NC}"
}

# ═══════════════════════════════════════════════════════════════════════════
# CREATE SHELL CONFIG
# ═══════════════════════════════════════════════════════════════════════════

setup_shell_config() {
    echo -e "\n${YELLOW}⟡ Configuring shell...${NC}"

    ZSHRC="$HOME/.zshrc"

    # Add to .zshrc if not already present
    if ! grep -q "orb-env" "$ZSHRC" 2>/dev/null; then
        cat >> "$ZSHRC" << 'ZSHEOF'

# ═══════════════════════════════════════════════════════════════════════════
# 0RB SYSTEM
# ═══════════════════════════════════════════════════════════════════════════

# Load environment
[ -f "$HOME/.orb-env" ] && source "$HOME/.orb-env"

# NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Pyenv
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)" 2>/dev/null

# Starship prompt
eval "$(starship init zsh)" 2>/dev/null

# Aliases
alias orb="cd $ORB_HOME && claude"
alias ll="eza -la --icons"
alias cat="bat"
alias vim="nvim"

# Quick commands
build() { cd "$ORB_HOME/blkfryday" && claude "$@"; }
factory() { cd "$ORB_HOME/blkfryday" && node -e "require('./core').createORB().then(o => o.build('$1'))"; }

# Plugins
plugins=(git zsh-autosuggestions zsh-syntax-highlighting docker npm node)
ZSHEOF
    fi

    echo -e "${GREEN}  ✓ Shell configured${NC}"
}

# ═══════════════════════════════════════════════════════════════════════════
# CREATE STARTUP SCRIPT
# ═══════════════════════════════════════════════════════════════════════════

create_startup() {
    echo -e "\n${YELLOW}⟡ Creating startup script...${NC}"

    mkdir -p "$HOME/0rb/bin"

    cat > "$HOME/0rb/bin/orb-start" << 'STARTEOF'
#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# 0RB SYSTEM STARTUP
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                           ║"
echo "║     ⟡ 0RB SYSTEM - INITIALIZING ⟡                                        ║"
echo "║                                                                           ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

# Load environment
source "$HOME/.orb-env"

# Check for API keys
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "⚠ Warning: ANTHROPIC_API_KEY not set"
fi

# Start Ollama if installed
if command -v ollama &> /dev/null; then
    echo "⟡ Starting Ollama..."
    ollama serve &>/dev/null &
    sleep 2
    echo "  ✓ Ollama running"
fi

# Start Docker if not running
if command -v docker &> /dev/null; then
    if ! docker info &>/dev/null; then
        echo "⟡ Starting Docker..."
        sudo systemctl start docker 2>/dev/null || open -a Docker 2>/dev/null
        sleep 3
    fi
    echo "  ✓ Docker running"
fi

# Navigate to workspace
cd "$ORB_HOME/blkfryday" 2>/dev/null || cd "$ORB_HOME"

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                           ║"
echo "║     ⟡ SYSTEM READY - BUILD THE FUTURE ⟡                                  ║"
echo "║                                                                           ║"
echo "║     Commands:                                                             ║"
echo "║       orb          - Start Claude in workspace                            ║"
echo "║       build <desc> - Build something with the factory                     ║"
echo "║                                                                           ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

# Start interactive shell or Claude
if command -v claude &> /dev/null; then
    claude
else
    exec zsh
fi
STARTEOF

    chmod +x "$HOME/0rb/bin/orb-start"

    echo -e "${GREEN}  ✓ Startup script created at ~/0rb/bin/orb-start${NC}"
}

# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════

main() {
    echo -e "${CYAN}Starting 0RB System Setup...${NC}\n"

    detect_os

    if [[ "$OS" == "unknown" ]]; then
        echo -e "${RED}Unsupported OS. Please install manually.${NC}"
        exit 1
    fi

    install_base_packages
    install_node
    install_python
    install_ai_stack
    setup_docker
    setup_zsh
    setup_orb
    setup_env
    setup_shell_config
    create_startup

    echo -e "\n${GREEN}"
    cat << 'EOF'
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║     ██████╗ ██████╗ ███╗   ███╗██████╗ ██╗     ███████╗████████╗███████╗  ║
║    ██╔════╝██╔═══██╗████╗ ████║██╔══██╗██║     ██╔════╝╚══██╔══╝██╔════╝  ║
║    ██║     ██║   ██║██╔████╔██║██████╔╝██║     █████╗     ██║   █████╗    ║
║    ██║     ██║   ██║██║╚██╔╝██║██╔═══╝ ██║     ██╔══╝     ██║   ██╔══╝    ║
║    ╚██████╗╚██████╔╝██║ ╚═╝ ██║██║     ███████╗███████╗   ██║   ███████╗  ║
║     ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚══════╝╚══════╝   ╚═╝   ╚══════╝  ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"

    echo -e "${YELLOW}Next steps:${NC}"
    echo -e "  1. Add your API keys to ~/.orb-env"
    echo -e "  2. Run: source ~/.zshrc"
    echo -e "  3. Run: orb-start"
    echo -e ""
    echo -e "${CYAN}Or just run: ~/0rb/bin/orb-start${NC}"
    echo -e ""
}

# Run main
main "$@"

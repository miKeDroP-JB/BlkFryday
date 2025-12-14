#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  ORBOS BOOT LOADER
#  "Plug. Boot. Run."
# ═══════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export ORBOS_ROOT="$SCRIPT_DIR"

clear
cat << 'BANNER'
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     ██████  ██████  ██████   ██████  ███████                 ║
║    ██    ██ ██   ██ ██   ██ ██    ██ ██                      ║
║    ██    ██ ██████  ██████  ██    ██ ███████                 ║
║    ██    ██ ██   ██ ██   ██ ██    ██      ██                 ║
║     ██████  ██   ██ ██████   ██████  ███████                 ║
║                                                               ║
║              ORBITAL OPERATIONS SYSTEM                        ║
║                    v1.0 LIVE                                  ║
╚═══════════════════════════════════════════════════════════════╝
BANNER

echo ""
echo "  [*] ORBOS_ROOT: $ORBOS_ROOT"
echo "  [*] Hostname:   $(hostname)"
echo "  [*] Date:       $(date)"
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "  [!] Node.js not found. Installing..."
    if command -v apt &> /dev/null; then
        sudo apt update && sudo apt install -y nodejs npm
    elif command -v yum &> /dev/null; then
        sudo yum install -y nodejs npm
    elif command -v brew &> /dev/null; then
        brew install node
    else
        echo "  [X] Cannot install Node.js. Please install manually."
        exit 1
    fi
fi

echo "  [*] Node.js: $(node --version)"
echo ""

# Boot menu
echo "═══════════════════════════════════════════════════════════════"
echo "  BOOT OPTIONS"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  1) Quick Boot    - Start CallAgents (static)"
echo "  2) Dynamic Boot  - Start CallAgents (auto-scaling)"
echo "  3) Terminal      - Interactive ORBOS terminal"
echo "  4) ARC Solver    - Run ARC-AGI puzzle solver"
echo "  5) Exit"
echo ""
read -p "  Select [1-5]: " choice

case $choice in
    1)
        echo ""
        echo "  [*] Quick booting CallAgents..."
        bash "$ORBOS_ROOT/system/terminal/bootstrap-callagents.sh"
        ;;
    2)
        echo ""
        echo "  [*] Dynamic booting with auto-scaling..."
        bash "$ORBOS_ROOT/system/terminal/bootstrap-dynamic.sh"
        ;;
    3)
        echo ""
        echo "  [*] Starting interactive terminal..."
        node "$ORBOS_ROOT/system/terminal/0r8-term-core.js"
        ;;
    4)
        echo ""
        echo "  [*] Running ARC-AGI solver..."
        node "$ORBOS_ROOT/system/arc/InfiniteReasoner.js"
        ;;
    5|*)
        echo ""
        echo "  [*] Exiting ORBOS."
        exit 0
        ;;
esac

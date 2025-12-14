#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  ORBOS INSTALLER
#  Run this once on any server to enable auto-boot
# ═══════════════════════════════════════════════════════════

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║              ORBOS INSTALLER                              ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check root
if [ "$EUID" -ne 0 ]; then
    echo "[!] Run as root: sudo ./install.sh"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "[*] Installing Node.js..."
    if command -v apt &> /dev/null; then
        apt update && apt install -y nodejs npm
    elif command -v yum &> /dev/null; then
        yum install -y nodejs npm
    else
        echo "[X] Install Node.js manually"
        exit 1
    fi
fi

echo "[*] Node.js: $(node --version)"

# Update paths in service file
ORBOS_PATH="$SCRIPT_DIR"
sed -i "s|/home/user/BlkFryday|$ORBOS_PATH|g" "$SCRIPT_DIR/orbos.service"

# Install systemd service
echo "[*] Installing systemd service..."
cp "$SCRIPT_DIR/orbos.service" /etc/systemd/system/orbos.service
systemctl daemon-reload
systemctl enable orbos.service

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  INSTALLED!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  Commands:"
echo "    sudo systemctl start orbos    # Start now"
echo "    sudo systemctl status orbos   # Check status"
echo "    sudo systemctl stop orbos     # Stop"
echo "    tail -f $ORBOS_PATH/orbos.log # View logs"
echo ""
echo "  ORBOS will auto-start on boot."
echo ""

read -p "  Start ORBOS now? [y/N]: " start_now
if [[ "$start_now" =~ ^[Yy]$ ]]; then
    systemctl start orbos
    echo ""
    echo "  [*] ORBOS is running!"
    systemctl status orbos --no-pager
fi

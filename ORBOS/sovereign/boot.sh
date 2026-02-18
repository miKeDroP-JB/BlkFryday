#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
#                      ∞Φ∞ SOVEREIGN BUILDER OS ∞Φ∞
#                   Boot to black. One mouth. Infinite build.
# ═══════════════════════════════════════════════════════════════════════════════
#
# USAGE:
#   ./boot.sh           - Start Sovereign OS (opens browser)
#   ./boot.sh --install - Install as startup service
#   ./boot.sh --stop    - Stop the service
#
# ═══════════════════════════════════════════════════════════════════════════════

set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ORBOS_ROOT="$(dirname "$DIR")"
BLKFRYDAY="$(dirname "$ORBOS_ROOT")"
PORT=7433
PID_FILE="/tmp/sovereign.pid"
LOG_FILE="/tmp/sovereign.log"

print_sigil() {
  echo ""
  echo -e "\033[35m╔═══════════════════════════════════════════════════════════╗\033[0m"
  echo -e "\033[35m║               ∞Φ∞  SOVEREIGN BUILDER OS  ∞Φ∞              ║\033[0m"
  echo -e "\033[35m║            Boot to black. One mouth. Infinite build.       ║\033[0m"
  echo -e "\033[35m╚═══════════════════════════════════════════════════════════╝\033[0m"
  echo ""
}

# ─── INSTALL AS SERVICE ────────────────────────────────────────────────────────

install_service() {
  print_sigil
  echo "  Installing Sovereign OS as startup service..."
  echo ""

  # Detect OS
  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux: systemd
    SERVICE_FILE="$HOME/.config/systemd/user/sovereign.service"
    mkdir -p "$(dirname "$SERVICE_FILE")"

    cat > "$SERVICE_FILE" << SVCEOF
[Unit]
Description=∞Φ∞ Sovereign Builder OS
After=network.target

[Service]
ExecStart=/usr/bin/python3 ${DIR}/server.py
WorkingDirectory=${DIR}
Restart=always
RestartSec=3
StandardOutput=append:${LOG_FILE}
StandardError=append:${LOG_FILE}

[Install]
WantedBy=default.target
SVCEOF

    systemctl --user daemon-reload
    systemctl --user enable sovereign.service
    systemctl --user start sovereign.service
    echo "  ✓ Service installed (systemd)"
    echo "  ✓ Auto-starts on login"
    echo ""
    echo "  Commands:"
    echo "    systemctl --user status sovereign"
    echo "    systemctl --user restart sovereign"
    echo "    systemctl --user stop sovereign"

  elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS: launchd
    PLIST="$HOME/Library/LaunchAgents/ai.orbos.sovereign.plist"

    cat > "$PLIST" << PLISTEOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>ai.orbos.sovereign</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/bin/python3</string>
    <string>${DIR}/server.py</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${DIR}</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${LOG_FILE}</string>
  <key>StandardErrorPath</key>
  <string>${LOG_FILE}</string>
</dict>
</plist>
PLISTEOF

    launchctl load "$PLIST"
    echo "  ✓ Service installed (launchd)"
    echo "  ✓ Auto-starts on login"

  else
    echo "  ⚠ Unsupported OS. Run manually: python3 ${DIR}/server.py"
  fi

  echo ""
  echo -e "  \033[36mhttp://localhost:${PORT}\033[0m"
  echo ""
}

# ─── STOP SERVICE ─────────────────────────────────────────────────────────────

stop_service() {
  if [ -f "$PID_FILE" ]; then
    kill $(cat "$PID_FILE") 2>/dev/null && rm "$PID_FILE"
    echo "  ✓ Sovereign OS stopped"
  else
    pkill -f "sovereign/server.py" 2>/dev/null && echo "  ✓ Stopped" || echo "  ⚠ Not running"
  fi
}

# ─── MAIN BOOT ────────────────────────────────────────────────────────────────

boot() {
  print_sigil

  # Check if already running
  if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
    echo "  ✓ Already running (PID: $(cat $PID_FILE))"
    echo ""
    if command -v xdg-open &>/dev/null; then
      xdg-open "http://localhost:${PORT}" 2>/dev/null &
    elif command -v open &>/dev/null; then
      open "http://localhost:${PORT}"
    fi
    echo -e "  \033[36mhttp://localhost:${PORT}\033[0m"
    echo ""
    exit 0
  fi

  echo "  Starting..."
  echo ""

  # Start server
  python3 "$DIR/server.py" &
  SERVER_PID=$!
  echo $SERVER_PID > "$PID_FILE"

  echo -e "  PID: \033[33m$SERVER_PID\033[0m"
  echo -e "  URL: \033[36mhttp://localhost:${PORT}\033[0m"
  echo ""
  echo "  CTRL+C to stop."
  echo ""

  # Wait for server
  wait $SERVER_PID
  rm -f "$PID_FILE"
}

# ─── ENTRY POINT ──────────────────────────────────────────────────────────────

case "${1:-}" in
  --install) install_service ;;
  --stop)    stop_service ;;
  --status)
    if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
      echo "  ✓ Running (PID: $(cat $PID_FILE))"
    else
      echo "  ✗ Not running"
    fi
    ;;
  *) boot ;;
esac

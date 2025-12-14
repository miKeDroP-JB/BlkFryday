#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  ORBOS AUTORUN - Headless server boot
#  Add to /etc/rc.local or systemd for auto-start
# ═══════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export ORBOS_ROOT="$SCRIPT_DIR"

echo "[ORBOS] Auto-starting from $ORBOS_ROOT"
echo "[ORBOS] $(date)"

# Start dynamic CallAgents in background
nohup bash "$ORBOS_ROOT/system/terminal/bootstrap-dynamic.sh" > "$ORBOS_ROOT/orbos.log" 2>&1 &

echo "[ORBOS] PID: $!"
echo "[ORBOS] Log: $ORBOS_ROOT/orbos.log"
echo "[ORBOS] Boot complete."

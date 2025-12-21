#!/usr/bin/env bash
#═══════════════════════════════════════════════════════════════════════════════
# ORBOS HUMAN SAFETY SWITCH (HSS) - COMPLETE DEPLOYMENT
#═══════════════════════════════════════════════════════════════════════════════
# "Agents: full autonomy. Destructive power: gated. Enforcement: OS-level."
#
# Layers:
#   1. Hard System Boundary (root-gated zone)
#   2. Human Auth Tool (the only writer)
#   3. Protected Actions Policy
#   4. Guard Check (used by all agents)
#═══════════════════════════════════════════════════════════════════════════════

set -e

echo "
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║   ██╗  ██╗███████╗███████╗    ██████╗ ███████╗██████╗ ██╗      ██████╗ ██╗   ║
║   ██║  ██║██╔════╝██╔════╝    ██╔══██╗██╔════╝██╔══██╗██║     ██╔═══██╗╚██╗  ║
║   ███████║███████╗███████╗    ██║  ██║█████╗  ██████╔╝██║     ██║   ██║ ██║  ║
║   ██╔══██║╚════██║╚════██║    ██║  ██║██╔══╝  ██╔═══╝ ██║     ██║   ██║ ██║  ║
║   ██║  ██║███████║███████║    ██████╔╝███████╗██║     ███████╗╚██████╔╝██╔╝  ║
║   ╚═╝  ╚═╝╚══════╝╚══════╝    ╚═════╝ ╚══════╝╚═╝     ╚══════╝ ╚═════╝ ╚═╝   ║
║                                                                               ║
║              HUMAN SAFETY SWITCH - OS-LEVEL ENFORCEMENT                       ║
║                    \"Everybody Eats. Safely.\"                                  ║
╚═══════════════════════════════════════════════════════════════════════════════╝
"

#───────────────────────────────────────────────────────────────────────────────
# LAYER 1: HARD SYSTEM BOUNDARY
#───────────────────────────────────────────────────────────────────────────────
echo "[1/4] Creating Hard System Boundary..."

sudo mkdir -p /human_gate
sudo chown root:root /human_gate
sudo chmod 700 /human_gate

# Create initial gate state (CLOSED)
sudo bash -c 'cat > /human_gate/allow.json <<EOF
{
  "human_present": false,
  "timestamp": null,
  "ttl_seconds": 0,
  "session_id": null,
  "allowed_actions": []
}
EOF'

sudo chown root:root /human_gate/allow.json
sudo chmod 600 /human_gate/allow.json

echo "  ✓ /human_gate created and locked"

#───────────────────────────────────────────────────────────────────────────────
# LAYER 2: PROTECTED ACTIONS POLICY
#───────────────────────────────────────────────────────────────────────────────
echo "[2/4] Installing Protected Actions Policy..."

sudo mkdir -p /etc/orbos

sudo bash -c 'cat > /etc/orbos/protected_actions.yaml <<EOF
# ORBOS Protected Actions - Require Human Gate Open
# These actions CANNOT be performed by agents without human authorization

requires_human:
  # Boot & Kernel
  - modify_boot
  - flash_disk
  - change_kernel
  - install_bootloader
  - update_grub
  - modify_initramfs

  # Core System
  - rewrite_orb_core
  - modify_safety_switch
  - disable_observer
  - override_amoeba

  # Storage & Data
  - partition_storage
  - format_disk
  - delete_all_data
  - encrypt_system
  - wipe_memory

  # Network & Security
  - escalate_network
  - expose_ports
  - disable_firewall
  - install_backdoor

  # Identity & Auth
  - change_root_password
  - add_sudo_user
  - modify_ssh_keys
  - regenerate_keys

  # Financial (if integrated)
  - large_transfer
  - drain_wallet
  - sign_contract

  # Agent Control
  - spawn_unlimited_agents
  - disable_rate_limits
  - override_safety
  - grant_root_access

# Auto-allowed (no gate needed)
auto_allow:
  - read_logs
  - query_status
  - run_diagnostics
  - generate_report
  - backup_data
  - compress_files
EOF'

echo "  ✓ /etc/orbos/protected_actions.yaml installed"

#───────────────────────────────────────────────────────────────────────────────
# LAYER 3: HUMAN AUTH TOOL
#───────────────────────────────────────────────────────────────────────────────
echo "[3/4] Installing Human Auth Tool..."

sudo bash -c 'cat > /usr/local/bin/orb-human-auth <<EOF
#!/usr/bin/env bash
#═══════════════════════════════════════════════════════════════════════════════
# ORB-HUMAN-AUTH - The ONLY way to open the human gate
# Usage: orb-human-auth enable|disable [ttl_seconds] [reason]
#═══════════════════════════════════════════════════════════════════════════════
set -e

GATE="/human_gate/allow.json"
LOG="/var/log/orbos/human_gate.log"

# Ensure log directory exists
mkdir -p /var/log/orbos

if [[ "\$1" != "enable" && "\$1" != "disable" && "\$1" != "status" ]]; then
  echo "╔═══════════════════════════════════════════════════════════════╗"
  echo "║           ORB-HUMAN-AUTH - Human Gate Controller              ║"
  echo "╠═══════════════════════════════════════════════════════════════╣"
  echo "║  Usage:                                                       ║"
  echo "║    orb-human-auth enable [ttl_seconds] [reason]               ║"
  echo "║    orb-human-auth disable                                     ║"
  echo "║    orb-human-auth status                                      ║"
  echo "║                                                               ║"
  echo "║  Examples:                                                    ║"
  echo "║    orb-human-auth enable 300 \"boot modifications\"             ║"
  echo "║    orb-human-auth enable 60                                   ║"
  echo "║    orb-human-auth disable                                     ║"
  echo "╚═══════════════════════════════════════════════════════════════╝"
  exit 1
fi

ACTION="\$1"
TTL="\${2:-300}"
REASON="\${3:-manual}"
NOW=\$(date +%s)
TIMESTAMP=\$(date -Iseconds)

if [[ "\$ACTION" == "status" ]]; then
  if [[ -f "\$GATE" ]]; then
    HP=\$(jq -r '.human_present' "\$GATE")
    TS=\$(jq -r '.timestamp' "\$GATE")
    TTL_VAL=\$(jq -r '.ttl_seconds' "\$GATE")
    SESSION=\$(jq -r '.session_id' "\$GATE")

    if [[ "\$HP" == "true" ]]; then
      EXPIRES=\$((TS + TTL_VAL))
      REMAINING=\$((EXPIRES - NOW))
      if (( REMAINING > 0 )); then
        echo "🔓 GATE OPEN | \${REMAINING}s remaining | session=\$SESSION"
      else
        echo "🔒 GATE EXPIRED | was open, now closed"
      fi
    else
      echo "🔒 GATE CLOSED"
    fi
  else
    echo "🔒 GATE NOT INITIALIZED"
  fi
  exit 0
fi

if [[ "\$ACTION" == "enable" ]]; then
  SESSION=\$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid)

  sudo bash -c "cat > \$GATE <<GATEOF
{
  \"human_present\": true,
  \"timestamp\": \$NOW,
  \"ttl_seconds\": \$TTL,
  \"session_id\": \"\$SESSION\",
  \"allowed_actions\": [\"ALL\"],
  \"reason\": \"\$REASON\",
  \"opened_at\": \"\$TIMESTAMP\"
}
GATEOF"

  echo "\$TIMESTAMP | GATE OPENED | ttl=\$TTL | session=\$SESSION | reason=\$REASON" >> "\$LOG"

  echo ""
  echo "╔═══════════════════════════════════════════════════════════════╗"
  echo "║  🔓 HUMAN GATE OPEN                                           ║"
  echo "╠═══════════════════════════════════════════════════════════════╣"
  echo "║  TTL:      \$TTL seconds                                       "
  echo "║  Session:  \$SESSION"
  echo "║  Reason:   \$REASON"
  echo "║  Expires:  \$(date -d @\$((NOW + TTL)) '+%H:%M:%S')"
  echo "╚═══════════════════════════════════════════════════════════════╝"
  echo ""
  echo "  Agents now have access to protected actions."
  echo "  Gate will auto-close in \$TTL seconds."
  echo ""

else
  sudo bash -c "cat > \$GATE <<GATEOF
{
  \"human_present\": false,
  \"timestamp\": null,
  \"ttl_seconds\": 0,
  \"session_id\": null,
  \"allowed_actions\": [],
  \"closed_at\": \"\$TIMESTAMP\"
}
GATEOF"

  echo "\$TIMESTAMP | GATE CLOSED | manual" >> "\$LOG"

  echo ""
  echo "╔═══════════════════════════════════════════════════════════════╗"
  echo "║  🔒 HUMAN GATE CLOSED                                         ║"
  echo "╚═══════════════════════════════════════════════════════════════╝"
  echo ""
  echo "  Protected actions now require human authorization."
  echo ""
fi
EOF'

sudo chmod 700 /usr/local/bin/orb-human-auth

echo "  ✓ /usr/local/bin/orb-human-auth installed"

#───────────────────────────────────────────────────────────────────────────────
# LAYER 4: GUARD CHECK
#───────────────────────────────────────────────────────────────────────────────
echo "[4/4] Installing Guard Check..."

sudo bash -c 'cat > /usr/local/bin/orb-guard <<EOF
#!/usr/bin/env bash
#═══════════════════════════════════════════════════════════════════════════════
# ORB-GUARD - Millisecond check before any protected action
# Usage: orb-guard <action> || exit 1
# Exit codes:
#   0  = ALLOWED (proceed)
#   13 = DENIED (gate closed)
#   14 = DENIED (gate expired)
#   15 = DENIED (action not in allowed list)
#═══════════════════════════════════════════════════════════════════════════════
set -e

ACTION="\$1"
GATE="/human_gate/allow.json"
POLICY="/etc/orbos/protected_actions.yaml"
LOG="/var/log/orbos/guard.log"

mkdir -p /var/log/orbos

if [[ -z "\$ACTION" ]]; then
  echo "Usage: orb-guard <action>"
  exit 2
fi

# Check if action requires human
if ! grep -q "\$ACTION" "\$POLICY" 2>/dev/null; then
  # Not a protected action - auto-allow
  exit 0
fi

# Check if in auto_allow list
if grep -A100 "auto_allow:" "\$POLICY" | grep -q "\$ACTION"; then
  exit 0
fi

# Protected action - check human gate
if [[ ! -f "\$GATE" ]]; then
  echo "DENIED: gate file missing"
  echo "\$(date -Iseconds) | DENIED | \$ACTION | gate_missing" >> "\$LOG"
  exit 13
fi

HP=\$(jq -r '.human_present' "\$GATE" 2>/dev/null)
TS=\$(jq -r '.timestamp' "\$GATE" 2>/dev/null)
TTL=\$(jq -r '.ttl_seconds' "\$GATE" 2>/dev/null)
SESSION=\$(jq -r '.session_id' "\$GATE" 2>/dev/null)

NOW=\$(date +%s)

if [[ "\$HP" != "true" ]]; then
  echo "🔒 DENIED: human gate closed"
  echo "\$(date -Iseconds) | DENIED | \$ACTION | gate_closed" >> "\$LOG"
  exit 13
fi

if [[ "\$TS" == "null" ]] || [[ "\$TTL" == "null" ]]; then
  echo "🔒 DENIED: invalid gate state"
  echo "\$(date -Iseconds) | DENIED | \$ACTION | invalid_state" >> "\$LOG"
  exit 13
fi

EXPIRES=\$((TS + TTL))
if (( NOW > EXPIRES )); then
  echo "🔒 DENIED: human gate expired \$((NOW - EXPIRES))s ago"
  echo "\$(date -Iseconds) | DENIED | \$ACTION | expired" >> "\$LOG"
  exit 14
fi

# ALLOWED
REMAINING=\$((EXPIRES - NOW))
echo "🔓 ALLOWED: \$ACTION (gate expires in \${REMAINING}s)"
echo "\$(date -Iseconds) | ALLOWED | \$ACTION | session=\$SESSION | remaining=\$REMAINING" >> "\$LOG"
exit 0
EOF'

sudo chmod 755 /usr/local/bin/orb-guard

echo "  ✓ /usr/local/bin/orb-guard installed"

#───────────────────────────────────────────────────────────────────────────────
# DEPENDENCIES
#───────────────────────────────────────────────────────────────────────────────
echo ""
echo "[*] Checking dependencies..."

if command -v jq &> /dev/null; then
  echo "  ✓ jq already installed"
else
  echo "  → Installing jq..."
  if command -v pacman &> /dev/null; then
    sudo pacman -S --needed --noconfirm jq
  elif command -v apt &> /dev/null; then
    sudo apt install -y jq
  elif command -v dnf &> /dev/null; then
    sudo dnf install -y jq
  else
    echo "  ⚠ Please install jq manually"
  fi
fi

#───────────────────────────────────────────────────────────────────────────────
# FINAL STATUS
#───────────────────────────────────────────────────────────────────────────────
echo ""
echo "╔═══════════════════════════════════════════════════════════════════════════════╗"
echo "║                    HSS DEPLOYMENT COMPLETE                                    ║"
echo "╠═══════════════════════════════════════════════════════════════════════════════╣"
echo "║                                                                               ║"
echo "║  🔒 Gate Status:  CLOSED (safe default)                                       ║"
echo "║  📁 Gate File:    /human_gate/allow.json                                      ║"
echo "║  📋 Policy:       /etc/orbos/protected_actions.yaml                           ║"
echo "║  🔑 Auth Tool:    /usr/local/bin/orb-human-auth                               ║"
echo "║  🛡️  Guard:        /usr/local/bin/orb-guard                                    ║"
echo "║                                                                               ║"
echo "╠═══════════════════════════════════════════════════════════════════════════════╣"
echo "║  USAGE:                                                                       ║"
echo "║                                                                               ║"
echo "║  Open gate (60s):   sudo orb-human-auth enable 60 \"reason\"                   ║"
echo "║  Close gate:        sudo orb-human-auth disable                               ║"
echo "║  Check status:      orb-human-auth status                                     ║"
echo "║                                                                               ║"
echo "║  In scripts:        orb-guard modify_boot || exit 1                           ║"
echo "║                                                                               ║"
echo "╠═══════════════════════════════════════════════════════════════════════════════╣"
echo "║                                                                               ║"
echo "║  Agents: FULL AUTONOMY    |    Destructive: GATED    |    Latency: <1ms      ║"
echo "║                                                                               ║"
echo "║                    \"Everybody Eats. Safely.\"                                  ║"
echo "╚═══════════════════════════════════════════════════════════════════════════════╝"
echo ""

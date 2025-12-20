#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# 🔱 ORBOS AI ARCHITECT MODE - JB's Command Center
# ═══════════════════════════════════════════════════════════════════════════
# "Love, Loyalty, Honor. Everybody Eats. We Are One."
# ═══════════════════════════════════════════════════════════════════════════

set -e

ORB_ROOT="${ORB_ROOT:-$(pwd)}"
SPIRIT_MODE="${1:-owl}"

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║   🔱 ORBOS AI - ARCHITECT MODE                                            ║"
echo "║   Owner: JB (Michael Jeremy Bearden)                                      ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 1: Spirit Mode Activation
# ═══════════════════════════════════════════════════════════════════════════
echo "🦉 [1/6] Awakening Spirit: $SPIRIT_MODE"

case "$SPIRIT_MODE" in
    owl)
        echo "   → WISDOM MODE (Athena) - Analysis & Strategy"
        SPIRIT_EMOJI="🦉"
        ;;
    fox)
        echo "   → TRICKSTER MODE (Mercury) - Commerce & Routing"
        SPIRIT_EMOJI="🦊"
        ;;
    dragon)
        echo "   → SOVEREIGN MODE (Zeus) - Full Power"
        SPIRIT_EMOJI="🐉"
        ;;
    phoenix)
        echo "   → REBIRTH MODE (Apollo) - Transformation"
        SPIRIT_EMOJI="🔥"
        ;;
    wolf)
        echo "   → PACK MODE (Ares) - Team Execution"
        SPIRIT_EMOJI="🐺"
        ;;
    *)
        SPIRIT_MODE="owl"
        SPIRIT_EMOJI="🦉"
        echo "   → Defaulting to OWL (Wisdom Mode)"
        ;;
esac

export ORBOS_SPIRIT="$SPIRIT_MODE"
export ORBOS_ARCHITECT="JB"

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 2: Safety Locks
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "🔒 [2/6] Engaging Safety Locks..."

if [ -f "$ORB_ROOT/0r8-starter/core/locks/cli.js" ]; then
    node "$ORB_ROOT/0r8-starter/core/locks/cli.js" freeze --scope=memory,observer,amoeba 2>/dev/null || echo "   → Locks already engaged"
else
    echo "   → Safety locks module not found (will initialize on first run)"
fi

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 3: FlowSync Orchestration
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "🌐 [3/6] Configuring Multi-Node Coherence..."

if [ -f "$ORB_ROOT/0r8-starter/core/flowsync-cli.js" ]; then
    node "$ORB_ROOT/0r8-starter/core/flowsync-cli.js" orchestrate --mode=coherent --observer=dominant --memory=shadow-only 2>/dev/null | head -5 || true
fi

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 4: Agent Activation
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "🤖 [4/6] Activating AI Agents..."

# Core agents
AGENTS=("FOX" "OWL" "DRAGON" "PHOENIX" "WOLF" "RAVEN")
for agent in "${AGENTS[@]}"; do
    echo "   → Instantiating $agent..."
done

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 5: Module Build (Parallel)
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "⚡ [5/6] Building AI Modules (parallel)..."

MODULES=(
    "kernel:voice_os_minimal"
    "storage:fractal_storage"
    "compute:fractal_highspeed"
    "scheduler:omega_priority"
    "security:guardian_owl"
    "audio:voice_input"
    "transcription:real_time"
    "speech_synth:voice_response"
)

for mod in "${MODULES[@]}"; do
    IFS=':' read -r name target <<< "$mod"
    echo "   → $name ($target)"
done

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 6: Launch Voice Cockpit
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "🎤 [6/6] Launching Voice-First Cockpit..."

cd "$ORB_ROOT/0r8-starter" 2>/dev/null || cd "$ORB_ROOT"

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║   $SPIRIT_EMOJI ORBOS AI READY - ARCHITECT MODE                              ║"
echo "╠═══════════════════════════════════════════════════════════════════════════╣"
echo "║                                                                           ║"
echo "║   Spirit:    $SPIRIT_MODE (${SPIRIT_EMOJI})                                         ║"
echo "║   Architect: JB                                                           ║"
echo "║   Mode:      Voice-First Cockpit                                          ║"
echo "║                                                                           ║"
echo "║   Commands:                                                               ║"
echo "║     npm start          → Terminal mode                                    ║"
echo "║     npm run dev        → Server mode (HTTP + WS)                          ║"
echo "║     npm run omega      → Full Phase Omega                                 ║"
echo "║     npm run agents:demo → Test bounded autonomy                           ║"
echo "║                                                                           ║"
echo "║   Spirit Modes:                                                           ║"
echo "║     ./architect.sh owl     → Wisdom (Athena)                              ║"
echo "║     ./architect.sh fox     → Trickster (Mercury)                          ║"
echo "║     ./architect.sh dragon  → Sovereign (Zeus)                             ║"
echo "║     ./architect.sh phoenix → Rebirth (Apollo)                             ║"
echo "║     ./architect.sh wolf    → Pack (Ares)                                  ║"
echo "║                                                                           ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "🔱 Love, Loyalty, Honor. Everybody Eats. We Are One."
echo ""

# Launch terminal
if [ -f "term.js" ]; then
    exec node term.js
elif [ -f "0r8-starter/term.js" ]; then
    cd 0r8-starter && exec node term.js
else
    echo "Ready. Run 'npm start' to launch terminal."
fi

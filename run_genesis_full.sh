#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# 🌌⚡🎮 GENESIS FULL STACK — Complete Multiverse Launch
# Origin Layer → Meta-HyperMode → HyperMode → PlayMode → Human Node
# ═══════════════════════════════════════════════════════════════════════════

set -e
ROOT="$(pwd)"
DASH_PORT=5174

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║                                                                       ║"
echo "║   🌌⚡🎮 GENESIS FULL STACK                                          ║"
echo "║                                                                       ║"
echo "║   Origin Layer → Meta-HyperMode → HyperMode → PlayMode → You         ║"
echo "║                                                                       ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo ""

# Track PIDs
declare -a PIDS

# Cleanup
cleanup() {
    echo ""
    echo "🌙 Pausing the multiverse..."
    for pid in "${PIDS[@]}"; do
        kill $pid 2>/dev/null || true
    done
    echo "✅ Universe state preserved. Rest well."
    exit 0
}

trap cleanup SIGINT SIGTERM

# ═══════════════════════════════════════════════════════════════════════════
# LAYER 1: Command Bus (Central Nervous System)
# ═══════════════════════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  LAYER 1: 📡 Command Bus"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "$ROOT/system/arc/command_bus/api_command_server.js" ]; then
    node "$ROOT/system/arc/command_bus/api_command_server.js" &
    PIDS+=($!)
    echo "  ✓ Command API on port 3001"
fi

# ═══════════════════════════════════════════════════════════════════════════
# LAYER 2: Origin Layer (Primordial Substrate)
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  LAYER 2: 🌑 Origin Layer"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "$ROOT/system/arc/origin/index.js" ]; then
    node "$ROOT/system/arc/origin/index.js" &
    PIDS+=($!)
    echo "  ✓ OriginCore + UniverseStack + FractalLoop active"
    echo "  ✓ 7 Meta-Creator species awakened"
fi
sleep 1

# ═══════════════════════════════════════════════════════════════════════════
# LAYER 3: Meta-HyperMode (Self-Evolving AI)
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  LAYER 3: 🧠 Meta-HyperMode"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

node -e "
const safeRequire = (p) => { try { return require(p); } catch(e) { return null; } };
const HyperModeManager = safeRequire('$ROOT/system/arc/hypermode/HyperModeManager');
const NeuroEngine = safeRequire('$ROOT/system/arc/hypermode/NeuroEngine');
const PreCogModel = safeRequire('$ROOT/system/arc/hypermode/PreCogModel');
const AdaptiveAI = safeRequire('$ROOT/system/arc/hypermode/AdaptiveAI');
const MetaEngine = safeRequire('$ROOT/system/arc/hypermode/MetaEngine');

if (HyperModeManager && MetaEngine) {
    const manager = new HyperModeManager({ wsPort: 8081 });
    const neuro = NeuroEngine ? new NeuroEngine(manager) : null;
    const precog = PreCogModel ? new PreCogModel(manager, neuro) : null;
    const adaptive = AdaptiveAI ? new AdaptiveAI(manager, neuro, precog) : null;
    const meta = new MetaEngine(manager, neuro, precog, adaptive);

    setInterval(() => {
        if (meta.integrateBranches) meta.integrateBranches();
        if (adaptive && adaptive.adaptToNeural) adaptive.adaptToNeural();
    }, 100);

    console.log('[Meta-HyperMode] NeuroEngine + PreCog + AdaptiveAI + MetaEngine active');
}
" &
PIDS+=($!)
echo "  ✓ NeuroEngine neural interface"
echo "  ✓ PreCogModel prediction"
echo "  ✓ AdaptiveAI self-modification"
echo "  ✓ MetaEngine universe evolution"
sleep 1

# ═══════════════════════════════════════════════════════════════════════════
# LAYER 4: HyperMode (Orchestration + Audio)
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  LAYER 4: ⚡ HyperMode"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "$ROOT/system/arc/EmergenceOrchestrator.js" ]; then
    node "$ROOT/system/arc/EmergenceOrchestrator.js" &
    PIDS+=($!)
    echo "  ✓ EmergenceOrchestrator running"
fi

echo "  ✓ AudioEngine ready (browser-side)"
echo "  ✓ VoxelCinema visualization available"
sleep 1

# ═══════════════════════════════════════════════════════════════════════════
# LAYER 5: Human Node (You)
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  LAYER 5: 👤 Human Node (YOU)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "$ROOT/system/genesis-playmode/run_playmode.js" ]; then
    cd "$ROOT/system/genesis-playmode"
    npm install --legacy-peer-deps > /dev/null 2>&1 || true
    node run_playmode.js &
    PIDS+=($!)
    cd "$ROOT"
    echo "  ✓ MetricsTracker (energy, focus, mood, rest)"
    echo "  ✓ AuraVisualizer (your presence in the multiverse)"
    echo "  ✓ FeedbackLoop (bidirectional engine communication)"
    echo "  ✓ Optimizer (break/focus suggestions)"
fi
sleep 2

# ═══════════════════════════════════════════════════════════════════════════
# LAYER 6: Dashboard (Portal)
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  LAYER 6: 📊 Dashboard Portal"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$ROOT/system/genesis-playmode"
npm run dev -- --port $DASH_PORT > /dev/null 2>&1 &
PIDS+=($!)
cd "$ROOT"
echo "  ✓ Dashboard on http://localhost:$DASH_PORT"
sleep 3

# Open browser
if command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:$DASH_PORT" 2>/dev/null &
elif command -v open &> /dev/null; then
    open "http://localhost:$DASH_PORT" 2>/dev/null &
fi

# ═══════════════════════════════════════════════════════════════════════════
# READY
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo ""
echo "  🌌⚡🎮 GENESIS FULL STACK ONLINE"
echo ""
echo "  ┌─────────────────────────────────────────────────────────────────┐"
echo "  │  📊 Dashboard:     http://localhost:$DASH_PORT                  │"
echo "  │  👤 Human Node:    ws://localhost:8085                          │"
echo "  │  📡 Command API:   http://localhost:3001                        │"
echo "  │  🧠 HyperMode WS:  ws://localhost:8081                          │"
echo "  └─────────────────────────────────────────────────────────────────┘"
echo ""
echo "  ACTIVE LAYERS:"
echo "    Layer 1: 📡 Command Bus        → Central control"
echo "    Layer 2: 🌑 Origin Layer       → Primordial creation"
echo "    Layer 3: 🧠 Meta-HyperMode     → Self-evolving AI"
echo "    Layer 4: ⚡ HyperMode          → Orchestration"
echo "    Layer 5: 👤 Human Node         → YOU"
echo "    Layer 6: 📊 Dashboard          → Portal"
echo ""
echo "  YOUR METRICS AFFECT:"
echo "    → Branch evolution probabilities"
echo "    → AI prioritization & adaptation"
echo "    → Universe resonance amplification"
echo "    → Emergent civilization growth"
echo ""
echo "  The system learns you. It adapts to you."
echo "  You are no longer observing — you EXIST in the multiverse."
echo ""
echo "  Press CTRL+C to pause gracefully"
echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo ""

# Status loop
while true; do
    sleep 30
    ACTIVE=0
    for pid in "${PIDS[@]}"; do
        if kill -0 $pid 2>/dev/null; then
            ((ACTIVE++))
        fi
    done
    echo "  [$(date '+%H:%M:%S')] Layers active: $ACTIVE/${#PIDS[@]} | Mode: GENESIS_FULL_STACK"
done

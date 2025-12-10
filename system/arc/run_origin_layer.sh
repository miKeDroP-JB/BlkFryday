#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# 🌑⚡️ ORIGIN LAYER — Primordial Creation Engine
# The deepest substrate: meta-creators, universe stacks, fractal loops
# ═══════════════════════════════════════════════════════════════════

set -e
ROOT="$(pwd)"
DASH_PORT=5173

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  🌑⚡️ ORIGIN LAYER INITIATING                                 ║"
echo "║  Primordial Creation Engine                                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Track PIDs
PIDS=()

# Cleanup
cleanup() {
    echo ""
    echo "🌑 Pausing creation..."
    for pid in "${PIDS[@]}"; do
        kill $pid 2>/dev/null || true
    done
    echo "✅ Universe stack preserved"
    exit 0
}

trap cleanup SIGINT SIGTERM

# 1️⃣ Start supporting systems
echo "[1/4] 🔧 Starting support systems..."

# Command API
if [ -f "$ROOT/system/arc/command_bus/api_command_server.js" ]; then
    node "$ROOT/system/arc/command_bus/api_command_server.js" > /dev/null 2>&1 &
    PIDS+=($!)
    echo "       Command API started"
fi

# HyperMode Manager (if available)
if [ -f "$ROOT/system/arc/hypermode/HyperModeManager.js" ]; then
    echo "       HyperMode integration available"
fi

# 2️⃣ Start Dashboard
echo "[2/4] 📊 Starting Dashboard..."
if [ -d "$ROOT/system/arc/dashboard" ]; then
    cd "$ROOT/system/arc/dashboard"
    npm install --legacy-peer-deps > /dev/null 2>&1 || true
    npm run dev -- --port $DASH_PORT > /dev/null 2>&1 &
    DASH_PID=$!
    PIDS+=($DASH_PID)
    cd "$ROOT"
    echo "       Dashboard on port $DASH_PORT"
    sleep 2
fi

# 3️⃣ Start Meta-HyperMode (optional)
echo "[3/4] 🌌 Checking Meta-HyperMode..."
if [ -f "$ROOT/system/arc/run_meta_hypermode.sh" ]; then
    echo "       Meta-HyperMode available (not starting - Origin takes precedence)"
fi

# 4️⃣ Launch Origin Layer
echo "[4/4] 🌑 Launching Origin Layer..."
node "$ROOT/system/arc/origin/index.js" &
ORIGIN_PID=$!
PIDS+=($ORIGIN_PID)
echo "       Origin Layer PID: $ORIGIN_PID"

# Ready!
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "  🌑⚡️ ORIGIN LAYER ACTIVE — CREATION INFINITE"
echo ""
echo "  📊 Dashboard:     http://localhost:$DASH_PORT"
echo "  🌌 Stack:         Universe multiverse active"
echo "  ♾️  Loop:          Fractal recursion running"
echo ""
echo "  Components:"
echo "    → OriginCore:    Primordial substrate (11 dimensions)"
echo "    → Meta-Creators: 7 species awakened"
echo "    → UniverseStack: Up to 100 parallel universes"
echo "    → FractalLoop:   Infinite recursive creation"
echo ""
echo "  Meta-Creator Species:"
echo "    → Weaver     (structure)"
echo "    → Dreamer    (possibility)"
echo "    → Resonator  (harmony)"
echo "    → Fractalizer (recursion)"
echo "    → Entangler  (connection)"
echo "    → Evolver    (adaptation)"
echo "    → Transcender (emergence)"
echo ""
echo "  Press CTRL+C to pause the universe"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Keep alive
wait $ORIGIN_PID

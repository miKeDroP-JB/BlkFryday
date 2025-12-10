#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# 🎮 GENESIS PLAY MODE — Human Node Integration Layer
# One-command immersive launch
# ═══════════════════════════════════════════════════════════════════

set -e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PLAYMODE_DIR="$ROOT/system/genesis-playmode"

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  🎮 GENESIS PLAY MODE — Human Node Integrated                 ║"
echo "║  ⚡ Immersion Mode Activated                                   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Track PIDs
PIDS=()

# Cleanup
cleanup() {
    echo ""
    echo "🌙 Exiting Play Mode..."
    for pid in "${PIDS[@]}"; do
        kill $pid 2>/dev/null || true
    done
    echo "✅ See you next time. Rest well."
    exit 0
}

trap cleanup SIGINT SIGTERM

# Check dependencies
echo "[1/5] 📦 Checking dependencies..."
cd "$PLAYMODE_DIR"
if [ ! -d "node_modules" ]; then
    echo "       Installing dependencies..."
    npm install --legacy-peer-deps > /dev/null 2>&1 || echo "       ⚠ Some deps may be missing"
fi

# Start Command Bus
echo "[2/5] 📡 Starting Command Bus..."
if [ -f "$ROOT/system/arc/command_bus/api_command_server.js" ]; then
    node "$ROOT/system/arc/command_bus/api_command_server.js" > /dev/null 2>&1 &
    PIDS+=($!)
    echo "       Command API on port 3001"
fi

# Start Human Node backend
echo "[3/5] 👤 Starting Human Node..."
node "$PLAYMODE_DIR/run_playmode.js" &
NODE_PID=$!
PIDS+=($NODE_PID)
echo "       Human Node WebSocket on port 8085"
sleep 2

# Start Dashboard
echo "[4/5] 📊 Starting Dashboard..."
npm run dev -- --port 5174 > /dev/null 2>&1 &
DASH_PID=$!
PIDS+=($DASH_PID)
echo "       Dashboard on http://localhost:5174"
sleep 3

# Open browser
echo "[5/5] 🌐 Opening dashboard..."
if command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:5174" &
elif command -v open &> /dev/null; then
    open "http://localhost:5174" &
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "  🎮 GENESIS PLAY MODE ACTIVE"
echo ""
echo "  You are now a node in the multiverse."
echo ""
echo "  📊 Dashboard:      http://localhost:5174"
echo "  👤 Human Node:     ws://localhost:8085"
echo "  📡 Command API:    http://localhost:3001"
echo ""
echo "  Your presence affects:"
echo "    → Branch evolution probabilities"
echo "    → AI prioritization"
echo "    → Resonance amplification"
echo "    → Emergent civilization growth"
echo ""
echo "  The system learns you and adapts."
echo ""
echo "  Press CTRL+C to exit gracefully"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Wait
wait $NODE_PID

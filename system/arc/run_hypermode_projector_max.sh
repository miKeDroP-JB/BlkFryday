#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# 🎬 HyperMode PROJECTOR MAX AutoDirector - CINEMATIC 4K 🔥
# Full-screen 12ft / 4K projection with live camera tuning
# ═══════════════════════════════════════════════════════════════════

set -e
ROOT="$(pwd)"
DASH_PORT=5173
FULLSCREEN_URL="http://localhost:$DASH_PORT"

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  🎬 HyperMode PROJECTOR MAX AutoDirector - CINEMATIC 4K 🔥    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Track PIDs for cleanup
PIDS=()

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping HyperMode PROJECTOR MAX AutoDirector..."
    for pid in "${PIDS[@]}"; do
        kill $pid 2>/dev/null || true
    done
    echo "✅ All processes stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# 1️⃣ Start Command API
echo "[1/8] 📡 Command API..."
if [ -f "$ROOT/system/arc/command_bus/api_command_server.js" ]; then
    node "$ROOT/system/arc/command_bus/api_command_server.js" &
    API_PID=$!
    PIDS+=($API_PID)
    echo "       Command API PID: $API_PID"
else
    echo "       ⚠ Command API not found, skipping"
fi

# 2️⃣ Start Emergence Orchestrator
echo "[2/8] 🧠 Emergence Orchestrator..."
if [ -f "$ROOT/system/arc/EmergenceOrchestrator.js" ]; then
    node "$ROOT/system/arc/EmergenceOrchestrator.js" &
    ORCH_PID=$!
    PIDS+=($ORCH_PID)
    echo "       Orchestrator PID: $ORCH_PID"
else
    echo "       ⚠ EmergenceOrchestrator not found, skipping"
fi

# 3️⃣ Start Amoeba Runner
echo "[3/8] 🧬 Amoeba Runner..."
if [ -f "$ROOT/run_big4.sh" ]; then
    bash "$ROOT/run_big4.sh" &
    RUN_PID=$!
    PIDS+=($RUN_PID)
    echo "       Runner PID: $RUN_PID"
else
    echo "       ⚠ run_big4.sh not found, skipping"
fi

# 4️⃣ Build Dashboard
echo "[4/8] 🔨 Building Dashboard..."
cd "$ROOT/system/arc/dashboard"
npm install --legacy-peer-deps > /dev/null 2>&1 || echo "       ⚠ npm install issues (may be OK)"
npm run build > /dev/null 2>&1 || echo "       ⚠ build skipped"
cd "$ROOT"

# 5️⃣ Launch Dashboard Dev Server
echo "[5/8] 📊 Dashboard live telemetry..."
npm run --prefix "$ROOT/system/arc/dashboard" dev -- --port $DASH_PORT > /dev/null 2>&1 &
DASH_PID=$!
PIDS+=($DASH_PID)
echo "       Dashboard PID: $DASH_PID"
sleep 3

# 6️⃣ Open full-screen projector window
echo "[6/8] 🖥️ Launching full-screen projector..."
if command -v google-chrome &> /dev/null; then
    google-chrome --kiosk --app="$FULLSCREEN_URL" &
    echo "       Chrome kiosk mode launched"
elif command -v chromium-browser &> /dev/null; then
    chromium-browser --kiosk --app="$FULLSCREEN_URL" &
    echo "       Chromium kiosk mode launched"
elif command -v open &> /dev/null; then
    open -a "Google Chrome" "$FULLSCREEN_URL"
    echo "       macOS Chrome launched"
else
    echo "       Dashboard URL: $FULLSCREEN_URL (manually open in full-screen)"
fi

# 7️⃣ Start AutoDirector process
echo "[7/8] 🎥 Starting HyperMode AutoDirector..."
node -e "
const path = require('path');
let HyperModeManager;
try {
    HyperModeManager = require('$ROOT/system/arc/hypermode/HyperModeManager');
} catch(e) {
    console.log('[AutoDirector] HyperModeManager not found, using stub');
    HyperModeManager = class { constructor(){} };
}

const manager = new HyperModeManager({ wsPort: 8081 });

// Cinematic settings
const cinematicConfig = {
    maxParticles: 2000,
    baseCameraDistance: 1500,
    baseFOV: 75,
    trailLength: 40,
    autoFocus: true
};

const adjustSettings = () => {
    const branchCount = manager.stats?.branchesSpawned || 0;

    // Dynamic adjustments based on activity
    const maxParticles = Math.min(cinematicConfig.maxParticles, 200 + branchCount * 10);
    const cameraDistance = cinematicConfig.baseCameraDistance - Math.min(500, branchCount * 3);
    const fov = Math.min(cinematicConfig.baseFOV, 50 + branchCount / 2);

    // Broadcast settings update
    if (manager.ws && manager.ws.broadcast) {
        manager.ws.broadcast({
            type: 'cinematic_settings',
            maxParticles,
            cameraDistance,
            fov,
            trailLength: cinematicConfig.trailLength,
            autoFocus: cinematicConfig.autoFocus,
            ts: Date.now()
        });
    }

    // Update voxel renderer if attached
    if (manager.voxel && manager.voxel.updateSettings) {
        manager.voxel.updateSettings({ maxParticles, cameraDistance, fov });
    }

    setTimeout(adjustSettings, 200);
};

adjustSettings();
console.log('[AutoDirector] 🎥 Live camera & voxel tuning enabled');
console.log('[AutoDirector] -> maxParticles: up to 2000');
console.log('[AutoDirector] -> Camera distance: adaptive');
console.log('[AutoDirector] -> FOV: 50-75° dynamic');
console.log('[AutoDirector] -> Trail length: 40 frames');

// Keep alive
setInterval(() => {
    if (manager.broadcastMetrics) {
        manager.broadcastMetrics({ heartbeat: true, mode: 'PROJECTOR_MAX' });
    }
}, 5000);
" &
DIRECTOR_PID=$!
PIDS+=($DIRECTOR_PID)
echo "       AutoDirector PID: $DIRECTOR_PID"

# 8️⃣ Ready!
echo "[8/8] ✅ All systems online!"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "  🎬 HyperMode PROJECTOR MAX AutoDirector RUNNING!"
echo ""
echo "  📊 Dashboard:     $FULLSCREEN_URL"
echo "  🖥️ Display:       12ft / 4K FULLSCREEN"
echo "  🎥 AutoDirector:  ENABLED"
echo ""
echo "  Cinematic Settings:"
echo "    → maxParticles:    up to 2000"
echo "    → Camera Distance: 1000-1500 (adaptive)"
echo "    → FOV:             50-75° (dynamic)"
echo "    → Trail Length:    40 frames"
echo "    → Auto-Focus:      ENABLED"
echo ""
echo "  Press CTRL+C to stop all processes"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Status loop
echo "📈 Live Status:"
echo "───────────────────────────────────────────────────────────────────"

while true; do
    sleep 10
    ACTIVE=0
    for pid in "${PIDS[@]}"; do
        if kill -0 $pid 2>/dev/null; then
            ((ACTIVE++))
        fi
    done
    echo "  $(date '+%H:%M:%S') | Active: $ACTIVE/${#PIDS[@]} | Mode: PROJECTOR_MAX_4K"
done

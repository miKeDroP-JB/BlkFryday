#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# 🔥 HyperMode MAX - Full Stack Launcher
# Cinematic + Telemetry + Dashboard + Command API
# ═══════════════════════════════════════════════════════════════════

set -e

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ARC_DIR="$ROOT/system/arc"
LOG_DIR="$ARC_DIR/logs"

mkdir -p "$LOG_DIR"

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     🔥 HYPERMODE MAX - FULL STACK LAUNCHER 🔥                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📁 Root: $ROOT"
echo "📁 ARC:  $ARC_DIR"
echo ""

# Track PIDs for cleanup
PIDS=()

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping all HyperMode MAX processes..."
    for pid in "${PIDS[@]}"; do
        kill $pid 2>/dev/null || true
    done
    # Kill any orphaned processes
    pkill -f "amoeba_ws_server" 2>/dev/null || true
    pkill -f "api_command_server" 2>/dev/null || true
    echo "✅ All processes stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# 1️⃣ Start WebSocket servers
echo "[1/6] 🌐 Starting WebSocket servers..."
for PORT in 8080 8081 8082; do
    if [ -f "$ARC_DIR/amoeba_ws_server.js" ]; then
        AMOEBA_WS_PORT=$PORT node "$ARC_DIR/amoeba_ws_server.js" > "$LOG_DIR/ws_$PORT.log" 2>&1 &
        PIDS+=($!)
        echo "       WS server on port $PORT (PID: $!)"
    fi
done
sleep 1

# 2️⃣ Start Command API
echo "[2/6] 📡 Starting Command API..."
if [ -f "$ARC_DIR/command_bus/api_command_server.js" ]; then
    node "$ARC_DIR/command_bus/api_command_server.js" > "$LOG_DIR/command_api.log" 2>&1 &
    API_PID=$!
    PIDS+=($API_PID)
    echo "       Command API PID: $API_PID"
else
    # Create a simple command API if it doesn't exist
    mkdir -p "$ARC_DIR/command_bus"
    cat > "$ARC_DIR/command_bus/api_command_server.js" << 'EOFAPI'
const http = require('http');

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/api/command') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { cmd, payload } = JSON.parse(body);
                console.log('[CommandAPI] Received:', cmd, payload);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, cmd }));
            } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: e.message }));
            }
        });
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(3001, () => {
    console.log('[CommandAPI] 📡 Running on http://localhost:3001');
});
EOFAPI
    node "$ARC_DIR/command_bus/api_command_server.js" > "$LOG_DIR/command_api.log" 2>&1 &
    API_PID=$!
    PIDS+=($API_PID)
    echo "       Command API created and started (PID: $API_PID)"
fi
sleep 1

# 3️⃣ Start HyperMode Manager
echo "[3/6] 🚀 Initializing HyperMode Manager..."
if [ -f "$ARC_DIR/hypermode/HyperModeManager.js" ]; then
    node -e "
        const HyperModeManager = require('$ARC_DIR/hypermode/HyperModeManager.js');
        const hyper = new HyperModeManager({ wsPort: 8081 });
        console.log('[HyperMode] Manager ready');
        // Keep alive
        setInterval(() => hyper.broadcastMetrics({ heartbeat: true }), 5000);
    " > "$LOG_DIR/hypermode.log" 2>&1 &
    HYPER_PID=$!
    PIDS+=($HYPER_PID)
    echo "       HyperMode Manager PID: $HYPER_PID"
fi
sleep 1

# 4️⃣ Start Amoeba orchestrator (cinematic mode)
echo "[4/6] 🧬 Launching Amoeba Orchestrator..."
if [ -f "$ARC_DIR/run_amoeba_cinematic.sh" ]; then
    bash "$ARC_DIR/run_amoeba_cinematic.sh" 5 > "$LOG_DIR/amoeba_cinematic.log" 2>&1 &
    ORCH_PID=$!
    PIDS+=($ORCH_PID)
    echo "       Amoeba Cinematic PID: $ORCH_PID"
elif [ -f "$ARC_DIR/run_amoeba_godmode.sh" ]; then
    bash "$ARC_DIR/run_amoeba_godmode.sh" 5 > "$LOG_DIR/amoeba_godmode.log" 2>&1 &
    ORCH_PID=$!
    PIDS+=($ORCH_PID)
    echo "       Amoeba GODMODE PID: $ORCH_PID"
fi
sleep 1

# 5️⃣ Install dashboard dependencies and start
echo "[5/6] 📊 Starting Dashboard..."
cd "$ARC_DIR/dashboard"
npm install --legacy-peer-deps > "$LOG_DIR/npm_install.log" 2>&1 || echo "       ⚠ npm install issues (may be OK)"
npm run dev > "$LOG_DIR/dashboard.log" 2>&1 &
DASH_PID=$!
PIDS+=($DASH_PID)
echo "       Dashboard PID: $DASH_PID"
cd "$ROOT"
sleep 3

# 6️⃣ Open dashboard in browser
echo "[6/6] 🌐 Opening dashboard..."
DASHBOARD_URL="http://localhost:5173"

if command -v xdg-open &> /dev/null; then
    xdg-open "$DASHBOARD_URL" 2>/dev/null || true
elif command -v open &> /dev/null; then
    open "$DASHBOARD_URL" 2>/dev/null || true
elif command -v start &> /dev/null; then
    start "$DASHBOARD_URL" 2>/dev/null || true
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "  ✅ HyperMode MAX launched!"
echo ""
echo "  📊 Dashboard:    $DASHBOARD_URL"
echo "  📡 Command API:  http://localhost:3001"
echo "  🌐 WS Servers:   ws://localhost:8080, 8081, 8082"
echo ""
echo "  📁 Logs:         $LOG_DIR/"
echo ""
echo "  Press CTRL+C to stop all processes"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Status loop
echo "📈 Live Status (updates every 10s):"
echo "───────────────────────────────────────────────────────────────────"

while true; do
    sleep 10
    ACTIVE=0
    for pid in "${PIDS[@]}"; do
        if kill -0 $pid 2>/dev/null; then
            ((ACTIVE++))
        fi
    done
    echo "  $(date '+%H:%M:%S') | Active processes: $ACTIVE/${#PIDS[@]} | Logs: $(du -sh $LOG_DIR 2>/dev/null | cut -f1)"
done

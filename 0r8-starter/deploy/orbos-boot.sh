#!/bin/bash
# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║   ORBOS PRODUCTION BOOT SCRIPT                                            ║
# ║   RAM-loaded Glyph DB • Local LLMs • Smart Routing                        ║
# ╚═══════════════════════════════════════════════════════════════════════════╝
#
# Usage: sudo ./orbos-boot.sh
#
# Prerequisites:
#   - ORBOS SSD setup complete (orbos-ssd-setup.sh)
#   - Ollama installed with models
#   - Node.js and Python venv ready

set -e

# Configuration
ORB_ROOT="${ORB_ROOT:-/orb}"
RAMDISK_SIZE="${RAMDISK_SIZE:-32G}"
RAMDISK_PATH="/mnt/ramdisk"
WS_PORT="${WS_PORT:-8081}"
HTTP_PORT="${HTTP_PORT:-3000}"

echo "════════════════════════════════════════"
echo "ORBOS Boot Script — $(date)"
echo "════════════════════════════════════════"

# 1️⃣ Prepare RAM disk for glyph DB
echo "[1/7] Mounting RAM disk for Glyph DB..."
mkdir -p "$RAMDISK_PATH"
if ! mountpoint -q "$RAMDISK_PATH"; then
    mount -t tmpfs -o size="$RAMDISK_SIZE" tmpfs "$RAMDISK_PATH"
    echo "[1/7] RAM disk mounted ($RAMDISK_SIZE)"
else
    echo "[1/7] RAM disk already mounted"
fi

# 2️⃣ Load compressed glyph DB
echo "[2/7] Loading Glyph DB into memory..."
if [ -f "$ORB_ROOT/glyphs/glyph_db.gz" ]; then
    gzip -dc "$ORB_ROOT/glyphs/glyph_db.gz" > "$RAMDISK_PATH/glyph_db"
    echo "[2/7] Glyph DB loaded into RAM."
elif [ -f "$ORB_ROOT/data/glyphs/glyph_db.gz" ]; then
    gzip -dc "$ORB_ROOT/data/glyphs/glyph_db.gz" > "$RAMDISK_PATH/glyph_db"
    echo "[2/7] Glyph DB loaded into RAM."
elif [ -d "$ORB_ROOT/data/glyphs" ]; then
    # If no compressed DB, just symlink the directory
    ln -sf "$ORB_ROOT/data/glyphs" "$RAMDISK_PATH/glyphs" 2>/dev/null || true
    echo "[2/7] Glyph directory linked (no compressed DB found)"
else
    echo "[2/7] WARNING: No Glyph DB found. Creating empty structure."
    mkdir -p "$RAMDISK_PATH/glyphs"
fi

# Export for other processes
export GLYPH_DB_PATH="$RAMDISK_PATH/glyph_db"
export GLYPH_DIR="$RAMDISK_PATH/glyphs"

# 3️⃣ Activate Python virtual environment
echo "[3/7] Activating ORBOS Python environment..."
if [ -f "$ORB_ROOT/venv/bin/activate" ]; then
    source "$ORB_ROOT/venv/bin/activate"
    echo "[3/7] Python env ready: $(python3 --version)"
else
    echo "[3/7] WARNING: Python venv not found. Using system Python."
fi

# 4️⃣ Start the local LLMs
echo "[4/7] Launching local LLMs (Ollama)..."
if command -v ollama &> /dev/null; then
    # Check if Ollama is already running
    if ! pgrep -x "ollama" > /dev/null; then
        ollama serve > "$ORB_ROOT/data/ollama.log" 2>&1 &
        sleep 2
        echo "[4/7] Ollama server started"
    else
        echo "[4/7] Ollama already running"
    fi

    # List available models
    echo "[4/7] Available models:"
    ollama list 2>/dev/null | head -5 || echo "  (fetching...)"
else
    echo "[4/7] WARNING: Ollama not installed. Local LLM unavailable."
fi

# Optional: Launch additional local models
if [ -f "$ORB_ROOT/core/launch_local_models.py" ]; then
    python3 "$ORB_ROOT/core/launch_local_models.py" &
fi

# 5️⃣ Start ORBOS Router / Decision Engine
echo "[5/7] Starting Smart Router..."
if [ -f "$ORB_ROOT/router/router.py" ]; then
    python3 "$ORB_ROOT/router/router.py" &
    echo "[5/7] Python Smart Router live"
elif [ -f "$ORB_ROOT/core/local-router.js" ]; then
    echo "[5/7] Using Node.js Smart Router (integrated in server)"
else
    echo "[5/7] Smart Router will run integrated with main server"
fi

# 6️⃣ Launch WebSocket server and HTTP API
echo "[6/7] Starting ORB Server..."
cd "$ORB_ROOT"

# Check if we're using Node.js or Python server
if [ -f "$ORB_ROOT/term.js" ]; then
    # Node.js server
    node term.js --server &
    SERVER_PID=$!
    echo "[6/7] Node.js server started (PID: $SERVER_PID)"
    echo "[6/7] HTTP: http://localhost:$HTTP_PORT"
    echo "[6/7] WebSocket: ws://localhost:$WS_PORT"
elif [ -f "$ORB_ROOT/core/ws-server.js" ]; then
    node "$ORB_ROOT/core/ws-server.js" &
    echo "[6/7] WebSocket server live on port $WS_PORT"
fi

# Save PID for shutdown
echo $SERVER_PID > "$ORB_ROOT/data/orb.pid"

# 7️⃣ Start front-end / CLI
echo "[7/7] Launching ORBOS UI..."

# Option A: CLI (if running interactively)
if [ -t 0 ]; then
    echo "[7/7] Interactive mode available"
fi

# Option B: Browser UI
if [ -n "$DISPLAY" ]; then
    sleep 2  # Wait for server to start
    xdg-open "http://localhost:$HTTP_PORT" 2>/dev/null || \
    open "http://localhost:$HTTP_PORT" 2>/dev/null || \
    echo "[7/7] Open http://localhost:$HTTP_PORT in your browser"
else
    echo "[7/7] Headless mode - access via http://localhost:$HTTP_PORT"
fi

echo ""
echo "════════════════════════════════════════"
echo "ORBOS Boot Complete — System Live"
echo "════════════════════════════════════════"
echo ""
echo "  🔮 HTTP API:    http://localhost:$HTTP_PORT"
echo "  📡 WebSocket:   ws://localhost:$WS_PORT"
echo "  💾 Glyph DB:    $RAMDISK_PATH"
echo "  🦙 Ollama:      http://localhost:11434"
echo ""
echo "  Stop with: kill \$(cat $ORB_ROOT/data/orb.pid)"
echo ""

# Keep script running if in foreground
if [ "$1" = "--foreground" ] || [ "$1" = "-f" ]; then
    echo "Running in foreground. Press Ctrl+C to stop."
    wait
fi

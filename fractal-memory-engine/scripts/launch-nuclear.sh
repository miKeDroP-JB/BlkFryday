#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# FRACTAL MEMORY ENGINE - NUCLEAR LAUNCH SCRIPT
# ═══════════════════════════════════════════════════════════════════════════
#
# Launches the complete Fractal Memory Engine stack
#
# Usage:
#   ./scripts/launch-nuclear.sh [dev|prod|christmas|nye]
#
# ═══════════════════════════════════════════════════════════════════════════

set -e

MODE=${1:-dev}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "═══════════════════════════════════════════════════════════════════════════"
echo "  FRACTAL MEMORY ENGINE - NUCLEAR LAUNCH"
echo "  Mode: $MODE"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

cd "$PROJECT_DIR"

# ─────────────────────────────────────────────────────────────────────────────
# ENVIRONMENT CHECK
# ─────────────────────────────────────────────────────────────────────────────

check_deps() {
  echo "[*] Checking dependencies..."

  if ! command -v docker &> /dev/null; then
    echo "[!] Docker not found. Please install Docker."
    exit 1
  fi

  if ! command -v docker-compose &> /dev/null; then
    echo "[!] Docker Compose not found. Please install Docker Compose."
    exit 1
  fi

  if ! command -v node &> /dev/null; then
    echo "[!] Node.js not found. Please install Node.js 18+."
    exit 1
  fi

  echo "[✓] All dependencies found"
}

# ─────────────────────────────────────────────────────────────────────────────
# LAUNCH MODES
# ─────────────────────────────────────────────────────────────────────────────

launch_dev() {
  echo "[*] Launching in DEVELOPMENT mode..."

  # Start infrastructure
  docker-compose -f docker-compose.full.yml up -d redis

  # Wait for Redis
  echo "[*] Waiting for Redis..."
  sleep 3

  # Start Python services in background
  echo "[*] Starting Python services..."
  cd services/orchestrator && uvicorn app:app --host 0.0.0.0 --port 8000 --reload &
  cd services/ritual-engine && uvicorn app:app --host 0.0.0.0 --port 8020 --reload &
  cd services/external-tether && uvicorn app:app --host 0.0.0.0 --port 8021 --reload &

  # Start Node.js connectors
  echo "[*] Starting Node.js connectors..."
  cd connectors && npm run dev &

  echo ""
  echo "[✓] Development stack launched!"
  echo ""
  echo "  Services:"
  echo "    Gateway:        http://localhost:8888"
  echo "    Orchestrator:   http://localhost:8000"
  echo "    Ritual Engine:  http://localhost:8020"
  echo "    External:       http://localhost:8021"
  echo "    Intent Grid:    http://localhost:8030"
  echo "    Lexicon:        http://localhost:8031"
  echo "    Voice Loop:     http://localhost:8032"
  echo "    Supervisor:     http://localhost:8033"
  echo "    Event Bus:      http://localhost:8040"
  echo ""
}

launch_prod() {
  echo "[*] Launching in PRODUCTION mode..."

  # Build and start all services
  docker-compose -f docker-compose.full.yml build
  docker-compose -f docker-compose.full.yml up -d

  echo ""
  echo "[✓] Production stack launched!"
  echo ""
  echo "  Gateway: http://localhost:8888"
  echo ""
  echo "  Use 'docker-compose -f docker-compose.full.yml logs -f' to view logs"
}

launch_christmas() {
  echo "[*] Launching CHRISTMAS EVENT mode..."
  echo ""
  echo "  🎄 Christmas Awakening Animation ready!"
  echo ""

  launch_prod

  # Trigger Christmas ritual
  echo "[*] Scheduling Christmas Awakening ritual..."
  curl -X POST http://localhost:8020/rituals/christmas-awakening/execute \
    -H "Content-Type: application/json" \
    -d '{"context": {"event": "christmas", "year": 2024}}'

  echo ""
  echo "[✓] Christmas mode activated!"
}

launch_nye() {
  echo "[*] Launching NEW YEAR'S EVE EVENT mode..."
  echo ""
  echo "  🎆 NYE Ascension Ceremony ready!"
  echo ""

  launch_prod

  # Trigger NYE ritual
  echo "[*] Scheduling NYE Ascension ritual..."
  curl -X POST http://localhost:8020/rituals/nye-ascension/execute \
    -H "Content-Type: application/json" \
    -d '{"context": {"event": "nye", "year": 2025}}'

  echo ""
  echo "[✓] NYE mode activated!"
}

# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────

check_deps

case $MODE in
  dev)
    launch_dev
    ;;
  prod|production)
    launch_prod
    ;;
  christmas|xmas)
    launch_christmas
    ;;
  nye|newyear)
    launch_nye
    ;;
  *)
    echo "Unknown mode: $MODE"
    echo "Usage: ./launch-nuclear.sh [dev|prod|christmas|nye]"
    exit 1
    ;;
esac

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "  NUCLEAR LAUNCH COMPLETE"
echo "═══════════════════════════════════════════════════════════════════════════"

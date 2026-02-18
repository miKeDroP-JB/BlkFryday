#!/usr/bin/env bash
# run_big4.sh — One-shot run of V3.6 + V4.0 + Full bench
# ═══════════════════════════════════════════════════════════════════

set -e

BASE="$(cd "$(dirname "$0")" && pwd)"
cd "$BASE"

# Configuration
export NODE_OPTIONS="--max-old-space-size=4096"
TIME_LIMIT_MS=${1:-600000}  # Default 10 minutes per task

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         BIG4 BENCHMARK RUNNER - V3.6 + V4.0                    ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║  Time Limit: ${TIME_LIMIT_MS}ms per task                              ║"
echo "║  Memory:     4GB heap                                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

echo "[BIG4] Starting Full Bench (Emergence + Infinite Search)"
node bench_runner.js ${TIME_LIMIT_MS}

echo ""
echo "[BIG4] Generating report..."
node bench_reporter.js

echo ""
echo "[BIG4] Done! Results in: ${BASE}/bench_results"

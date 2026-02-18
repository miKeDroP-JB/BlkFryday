#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# V4.0 Emergence Orchestrator - Dev→Prod Pipeline
# ═══════════════════════════════════════════════════════════════════
# One-command: build → benchmark → report → tag → deploy

set -e

BASE="$(cd "$(dirname "$0")" && pwd)"
cd "$BASE"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     V4.0 EMERGENCE ORCHESTRATOR - DEPLOYMENT PIPELINE          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Configuration
export NODE_OPTIONS="--max-old-space-size=4096"
TIMESTAMP=$(date +%Y%m%d%H%M)

# 1️⃣ Install/update deps
echo "[1/6] Installing dependencies..."
cd "$BASE/../.."
npm install --legacy-peer-deps 2>/dev/null || echo "  ⚠️  npm install skipped (no package.json or already installed)"
cd "$BASE"

# 2️⃣ Validate orchestrator
echo ""
echo "[2/6] Validating Emergence Orchestrator..."
node -e "
  const Orch = require('./EmergenceOrchestrator');
  const IS = require('./InfiniteSearch');
  const CC = require('./CompositeChains');
  console.log('  ✓ EmergenceOrchestrator loaded');
  console.log('  ✓ InfiniteSearch loaded');
  console.log('  ✓ CompositeChains loaded');
  console.log('  ✓ All modules validated');
"

# 3️⃣ Run full benchmark
echo ""
echo "[3/6] Running Big4 benchmark..."
TIME_LIMIT_MS=${1:-300000}  # 5 min default per task
node bench_runner.js ${TIME_LIMIT_MS}

# 4️⃣ Export metrics
echo ""
echo "[4/6] Exporting metrics..."
node bench_reporter.js

# 5️⃣ Git tag release
echo ""
echo "[5/6] Tagging release..."
cd "$BASE/../.."

git add .
git commit -m "release: V4.0 Emergence Orchestrator - $TIMESTAMP" 2>/dev/null || echo "  ℹ️  No changes to commit"
git tag -a "v4.0-$TIMESTAMP" -m "V4.0 Emergence Orchestrator auto-release - $TIMESTAMP" 2>/dev/null || echo "  ℹ️  Tag may already exist"

# Push to remotes
echo "  Pushing to origin..."
git push origin HEAD 2>/dev/null || echo "  ⚠️  Push to origin failed"
git push origin --tags 2>/dev/null || echo "  ⚠️  Tags push failed"

# Push to GitHub if remote exists
if git remote | grep -q "orb"; then
  echo "  Pushing to orb (GitHub)..."
  git push orb HEAD:main --tags 2>/dev/null || echo "  ⚠️  Push to orb failed"
fi

# 6️⃣ Deploy status
echo ""
echo "[6/6] Deployment check..."
if command -v pm2 &> /dev/null; then
  pm2 restart emergence_orchestrator 2>/dev/null || echo "  ℹ️  PM2 process not found, manual start required"
else
  echo "  ℹ️  PM2 not installed, skipping process management"
fi

# Summary
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    PIPELINE COMPLETE                            ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║  Release Tag:  v4.0-$TIMESTAMP                          ║"
echo "║  Results:      $BASE/bench_results/              ║"
echo "║  Reports:      bench_summary.json, bench_summary.csv           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "✅ V4.0 Emergence Orchestrator pipeline complete!"

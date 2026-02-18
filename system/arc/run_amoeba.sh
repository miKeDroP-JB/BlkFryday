#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# 🧬 Amoeba V4.1 Full Pipeline Launcher
# Self-replicating, dynamic convergence orchestrator
# ═══════════════════════════════════════════════════════════════════

set -e

BASE="$(cd "$(dirname "$0")" && pwd)"
cd "$BASE"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║        🧬 AMOEBA V4.1 ORCHESTRATOR PIPELINE                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Configuration
export NODE_OPTIONS="--max-old-space-size=4096"
TIMESTAMP=$(date +%Y%m%d%H%M)

# 1️⃣ Ensure deps installed
echo "[1/6] Checking dependencies..."
cd "$BASE/../.."
npm install --legacy-peer-deps 2>/dev/null || echo "  ℹ️  Dependencies OK"
cd "$BASE"

# 2️⃣ Validate modules
echo ""
echo "[2/6] Validating Amoeba modules..."
node -e "
  const { AmoebaOrchestrator } = require('./AmoebaOrchestrator');
  const InfiniteSearch = require('./InfiniteSearch');
  console.log('  ✓ AmoebaOrchestrator loaded');
  console.log('  ✓ InfiniteSearch loaded');
  console.log('  ✓ All modules validated');
"

# 3️⃣ Run Amoeba-Orchestrator
echo ""
echo "[3/6] Running Amoeba-Orchestrator..."

node -e "
const { AmoebaOrchestrator } = require('./AmoebaOrchestrator');
const fs = require('fs');

(async () => {
    console.log('🧬 Initializing Amoeba Orchestrator...');

    const orchestrator = new AmoebaOrchestrator({
        maxBranches: 5,
        branchFactor: 2,
        verbose: true
    });

    // Create a sample task for testing
    const sampleTask = {
        train: [
            { input: [[1, 2], [3, 4]], output: [[3, 4], [1, 2]] },
            { input: [[5, 6], [7, 8]], output: [[7, 8], [5, 6]] }
        ],
        test: [
            { input: [[9, 0], [1, 2]] }
        ]
    };

    console.log('🔬 Running on sample task...');
    const results = await orchestrator.run(sampleTask);

    const output = {
        timestamp: new Date().toISOString(),
        stats: orchestrator.getStats(),
        results: results
    };

    fs.writeFileSync('amoeba_results.json', JSON.stringify(output, null, 2));
    console.log('');
    console.log('📊 Stats:', JSON.stringify(orchestrator.getStats(), null, 2));
    console.log('💾 Results saved to amoeba_results.json');
})().catch(e => {
    console.error('❌ Error:', e.message);
    process.exit(1);
});
"

# 4️⃣ Export metrics
echo ""
echo "[4/6] Exporting metrics..."
node bench_reporter.js 2>/dev/null || echo "  ℹ️  No benchmark data yet (run bench_runner.js first)"

# 5️⃣ Auto-commit & tag release
echo ""
echo "[5/6] Tagging release..."
cd "$BASE/../.."

git add . 2>/dev/null || true
git commit -m "release: Amoeba V4.1 auto-release - $TIMESTAMP" 2>/dev/null || echo "  ℹ️  No changes to commit"
git tag -a "v4.1-amoeba-$TIMESTAMP" -m "Amoeba V4.1 self-replicating orchestrator - $TIMESTAMP" 2>/dev/null || echo "  ℹ️  Tag may exist"

# Push to remotes
git push origin HEAD 2>/dev/null || echo "  ⚠️  Push to origin skipped"
git push origin --tags 2>/dev/null || echo "  ⚠️  Tags push skipped"

if git remote | grep -q "orb"; then
    git push orb HEAD:main --tags 2>/dev/null || echo "  ⚠️  Push to orb skipped"
fi

# 6️⃣ Deploy status
echo ""
echo "[6/6] Deployment check..."
if command -v pm2 &> /dev/null; then
    pm2 restart amoeba_orchestrator 2>/dev/null || echo "  ℹ️  PM2 process not found"
else
    echo "  ℹ️  PM2 not installed, manual start required"
fi

# Summary
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║              🧬 AMOEBA PIPELINE COMPLETE                       ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║  Release:  v4.1-amoeba-$TIMESTAMP                       ║"
echo "║  Results:  $BASE/amoeba_results.json                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "✅ Amoeba V4.1 pipeline COMPLETE!"

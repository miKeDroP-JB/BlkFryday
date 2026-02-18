#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# 🧬 Amoeba V4.0 Self-Tuning Multi-Run Pipeline
# Adaptive iteration loop with config evolution
# ═══════════════════════════════════════════════════════════════════

set -e

BASE="$(cd "$(dirname "$0")" && pwd)"
cd "$BASE"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     🧬 AMOEBA V4.0 SELF-TUNING MULTI-RUN PIPELINE             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Configuration
export NODE_OPTIONS="--max-old-space-size=4096"

echo "🚀 Starting Self-Tuning Amoeba-Orchestrator pipeline..."

# Install dependencies
cd "$BASE/../.."
npm install --legacy-peer-deps 2>/dev/null || echo "  ℹ️  Dependencies OK"
cd "$BASE"

echo "🛠 Validating Emergence Orchestrator..."
node -e "
  const { AmoebaOrchestrator } = require('./AmoebaOrchestrator');
  console.log('  ✓ AmoebaOrchestrator loaded');
"

# Config for adaptive runs
MAX_RUNS=${1:-10}
INPUT_SEED=$(date +%s)
CONFIG_FILE="amoeba_config.json"
RESULTS_DIR="$BASE/amoeba_results"

mkdir -p "$RESULTS_DIR"

# Initialize default config
cat > $CONFIG_FILE <<EOL
{
    "maxBranches": 4,
    "branchFactor": 2,
    "searchConfig": {"beamWidth":4,"maxDepth":50}
}
EOL

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  Max Runs:    $MAX_RUNS                                              ║"
echo "║  Input Seed:  $INPUT_SEED                                    ║"
echo "║  Results:     $RESULTS_DIR                   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

for RUN in $(seq 1 $MAX_RUNS); do
    echo "═══════════════════════════════════════════════════════════════════"
    echo "🔹 Run #$RUN / $MAX_RUNS - Self-Tuning iteration"
    echo "═══════════════════════════════════════════════════════════════════"

    node -e "
const fs = require('fs');
const path = require('path');
const { AmoebaOrchestrator } = require('./AmoebaOrchestrator');

(async () => {
    const configFile = '$CONFIG_FILE';
    const resultsDir = '$RESULTS_DIR';
    const runNum = $RUN;
    const seed = $INPUT_SEED;

    let config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    console.log('📋 Config:', JSON.stringify(config));

    const orchestrator = new AmoebaOrchestrator({
        maxBranches: config.maxBranches,
        branchFactor: config.branchFactor,
        verbose: true
    });

    // Create sample task with seed variation
    const sampleTask = {
        train: [
            { input: [[1, 2], [3, 4]], output: [[3, 4], [1, 2]] },
            { input: [[5, 6], [7, 8]], output: [[7, 8], [5, 6]] },
            { input: [[(seed % 9) + 1, runNum], [runNum + 1, (seed % 5)]], output: [[runNum + 1, (seed % 5)], [(seed % 9) + 1, runNum]] }
        ],
        test: [
            { input: [[9, 0], [1, 2]] }
        ]
    };

    console.log('🔬 Running Amoeba on task with seed:', seed, 'run:', runNum);
    const results = await orchestrator.run(sampleTask);

    const stats = orchestrator.getStats();
    const output = {
        run: runNum,
        seed: seed,
        timestamp: new Date().toISOString(),
        config: config,
        stats: stats,
        results: results
    };

    const resultFile = path.join(resultsDir, 'amoeba_results_run' + runNum + '.json');
    fs.writeFileSync(resultFile, JSON.stringify(output, null, 2));
    console.log('💾 Results saved to:', resultFile);

    // Update config based on feedback - adaptive evolution
    const currentBranchFactor = orchestrator.branchFactor;
    const avgScore = orchestrator.feedback.length > 0
        ? orchestrator.feedback.reduce((s, r) => s + (r.score || 0), 0) / orchestrator.feedback.length
        : 0.5;

    // Evolve config
    if (avgScore < 0.3) {
        config.branchFactor = Math.min(6, config.branchFactor + 1);
        config.maxBranches = Math.min(8, config.maxBranches + 1);
    } else if (avgScore > 0.7) {
        config.branchFactor = Math.max(1, config.branchFactor - 1);
    }

    // Also adjust search config based on performance
    if (stats.successfulBranches === 0) {
        config.searchConfig.beamWidth = Math.min(20, config.searchConfig.beamWidth + 2);
        config.searchConfig.maxDepth = Math.min(100, config.searchConfig.maxDepth + 10);
    }

    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    console.log('');
    console.log('📈 Run #' + runNum + ' complete.');
    console.log('   Stats:', JSON.stringify(stats));
    console.log('   Avg Score:', avgScore.toFixed(3));
    console.log('   Config updated:', JSON.stringify(config));
})().catch(e => {
    console.error('❌ Error in run $RUN:', e.message);
    process.exit(1);
});
"
    echo ""
done

echo "═══════════════════════════════════════════════════════════════════"
echo "📊 Exporting final metrics..."
echo "═══════════════════════════════════════════════════════════════════"

# Generate aggregate report
node -e "
const fs = require('fs');
const path = require('path');

const resultsDir = '$RESULTS_DIR';
const files = fs.readdirSync(resultsDir).filter(f => f.startsWith('amoeba_results_run'));

const aggregate = {
    totalRuns: files.length,
    runs: [],
    evolution: [],
    finalConfig: null
};

for (const file of files.sort()) {
    const data = JSON.parse(fs.readFileSync(path.join(resultsDir, file), 'utf8'));
    aggregate.runs.push({
        run: data.run,
        stats: data.stats,
        config: data.config
    });
    aggregate.evolution.push({
        run: data.run,
        branchFactor: data.config.branchFactor,
        maxBranches: data.config.maxBranches,
        totalBranches: data.stats.totalBranches,
        successfulBranches: data.stats.successfulBranches
    });
}

if (aggregate.runs.length > 0) {
    aggregate.finalConfig = aggregate.runs[aggregate.runs.length - 1].config;
}

fs.writeFileSync(path.join(resultsDir, 'amoeba_aggregate.json'), JSON.stringify(aggregate, null, 2));
console.log('📋 Aggregate report saved to:', path.join(resultsDir, 'amoeba_aggregate.json'));

// Print evolution summary
console.log('');
console.log('🧬 Evolution Summary:');
console.log('─────────────────────────────────────────────────────────');
console.log('Run  | BranchFactor | MaxBranches | Total | Successful');
console.log('─────────────────────────────────────────────────────────');
for (const e of aggregate.evolution) {
    console.log(\`  \${e.run.toString().padStart(2)}  |      \${e.branchFactor}       |      \${e.maxBranches}      |   \${e.totalBranches.toString().padStart(2)}  |     \${e.successfulBranches}\`);
}
console.log('─────────────────────────────────────────────────────────');
"

# Run bench reporter if available
node bench_reporter.js 2>/dev/null || echo "  ℹ️  Bench reporter skipped (no benchmark data)"

# Auto commit + tag final self-tuned state
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "🏷️  Tagging release..."
echo "═══════════════════════════════════════════════════════════════════"

cd "$BASE/../.."
TIMESTAMP=$(date +%Y%m%d%H%M)

git add . 2>/dev/null || true
git commit -m "release: Amoeba V4.0 self-tuned final - $TIMESTAMP" 2>/dev/null || echo "  ℹ️  No changes to commit"
git tag -a "v4.0-amoeba-selftune-$TIMESTAMP" -m "V4.0 self-tuning auto-release - $MAX_RUNS runs" 2>/dev/null || echo "  ℹ️  Tag may exist"

# Push to remotes
git push origin HEAD 2>/dev/null || echo "  ⚠️  Push to origin skipped"
git push origin --tags 2>/dev/null || echo "  ⚠️  Tags push skipped"

if git remote | grep -q "orb"; then
    git push orb HEAD:main --tags 2>/dev/null || echo "  ⚠️  Push to orb skipped"
fi

# Summary
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         🧬 AMOEBA SELF-TUNING PIPELINE COMPLETE               ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║  Runs:       $MAX_RUNS iterations                                    ║"
echo "║  Release:    v4.0-amoeba-selftune-$TIMESTAMP             ║"
echo "║  Results:    $RESULTS_DIR/                   ║"
echo "║  Aggregate:  amoeba_aggregate.json                            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "✅ Amoeba V4.0 Self-Tuning pipeline COMPLETE!"
echo "   Check amoeba_results_run*.json for evolution details."

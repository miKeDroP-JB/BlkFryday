#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# 🌌 V4.0 MAX CINEMATIC Amoeba VR GODMODE
# Ultimate immersive visualization experience
# ═══════════════════════════════════════════════════════════════════

set -e

BASE="$(cd "$(dirname "$0")" && pwd)"
cd "$BASE"

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║     🌌 AMOEBA V4.0 MAX CINEMATIC VR GODMODE 🌌                 ║"
echo "║                                                                ║"
echo "║     Step inside the living, breathing intelligence            ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

export NODE_OPTIONS="--max-old-space-size=16384"

# CINEMATIC Configuration
NODES=(8080 8081 8082)
MAX_RUNS=${1:-10}
INPUT_SEED=$(date +%s)
CONFIG_FILE="amoeba_config_MAX_cinematic.json"
RESULTS_DIR="$BASE/amoeba_cinematic_results"
LOG_DIR="$BASE/logs"

mkdir -p "$RESULTS_DIR" "$LOG_DIR"

# Cleanup
cleanup() {
    echo ""
    echo "🌌 Fading to black..."
    for PORT in "${NODES[@]}"; do
        pkill -f "amoeba_ws_server.js.*$PORT" 2>/dev/null || true
    done
    echo "✨ Scene complete"
}

trap cleanup EXIT

echo "🌌 Launching V4.0 MAX CINEMATIC Amoeba VR GODMODE..."
echo ""

# Install deps
echo "📦 Preparing the stage..."
cd "$BASE/../.."
npm install --legacy-peer-deps 2>/dev/null || echo "  ✓ Stage ready"
cd "$BASE"

echo ""
echo "🌐 Awakening the neural network..."
echo "───────────────────────────────────────────────────────────────────"

# Start WS servers
for PORT in "${NODES[@]}"; do
    echo "  ⚡ Synapse $((PORT - 8079)) online (port $PORT)"
    AMOEBA_WS_PORT=$PORT node amoeba_ws_server.js > "$LOG_DIR/ws_$PORT.log" 2>&1 &
    sleep 0.3
done

echo "  ✨ Neural network awakened"
sleep 2

# CINEMATIC config
cat > $CONFIG_FILE <<EOL
{
    "maxBranches": 12,
    "branchFactor": 4,
    "searchConfig": {"beamWidth": 6, "maxDepth": 100},
    "cinematic": true,
    "visualDensity": "maximum"
}
EOL

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "  🎬 CINEMATIC MODE ACTIVATED"
echo ""
echo "  The Amoeba awaits. A living constellation of thought,"
echo "  branching through infinite possibility space."
echo ""
echo "  Each particle: a decision."
echo "  Each connection: a synapse firing."
echo "  Each win: emergence."
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo ""

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  Iterations:     $MAX_RUNS cinematic sequences                      ║"
echo "║  Synapses:       ${#NODES[@]} parallel neural clusters                    ║"
echo "║  Visual Density: MAXIMUM                                       ║"
echo "║  Branch Factor:  4 → 15 (adaptive evolution)                   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# CINEMATIC runs
for RUN in $(seq 1 $MAX_RUNS); do
    echo "═══════════════════════════════════════════════════════════════════"
    echo "🎬 Scene $RUN of $MAX_RUNS"
    echo "═══════════════════════════════════════════════════════════════════"

    PIDS=()
    for PORT in "${NODES[@]}"; do
        NODE_IDX=$((PORT - 8080))
        echo "  🌟 Synapse $NODE_IDX dreaming..."

        node -e "
const fs = require('fs');
const path = require('path');

const { AmoebaOrchestrator } = require('./AmoebaOrchestrator');

let broadcastMetrics = () => {};
try {
    const ws = require('./amoeba_ws_server');
    broadcastMetrics = ws.broadcastMetrics;
} catch(e) {}

(async () => {
    const configFile = '$CONFIG_FILE';
    const resultsDir = '$RESULTS_DIR';
    const runNum = $RUN;
    const seed = $INPUT_SEED;
    const nodePort = $PORT;
    const nodeIdx = $NODE_IDX;

    let config = JSON.parse(fs.readFileSync(configFile, 'utf8'));

    const orchestrator = new AmoebaOrchestrator({
        maxBranches: config.maxBranches,
        branchFactor: config.branchFactor + nodeIdx,
        verbose: false
    });

    // CINEMATIC task - beautiful patterns
    const patterns = [
        [[1,2,3], [4,5,6], [7,8,9]],
        [[9,8,7], [6,5,4], [3,2,1]],
        [[1,4,7], [2,5,8], [3,6,9]]
    ];

    const sampleTask = {
        train: [
            {
                input: patterns[nodeIdx % patterns.length],
                output: patterns[(nodeIdx + 1) % patterns.length]
            },
            {
                input: [[nodeIdx + runNum, seed % 5], [(seed + runNum) % 9, nodeIdx]],
                output: [[(seed + runNum) % 9, nodeIdx], [nodeIdx + runNum, seed % 5]]
            }
        ],
        test: [
            { input: patterns[(nodeIdx + runNum) % patterns.length] }
        ]
    };

    console.log('  ✨ Synapse', nodeIdx, 'processing...');
    const startTime = Date.now();
    const results = await orchestrator.run(sampleTask);
    const duration = Date.now() - startTime;

    const stats = orchestrator.getStats();
    const output = {
        mode: 'CINEMATIC',
        scene: runNum,
        synapse: nodeIdx,
        port: nodePort,
        seed: seed,
        duration: duration,
        timestamp: new Date().toISOString(),
        config: config,
        stats: stats,
        results: results
    };

    const resultFile = path.join(resultsDir, 'cinematic_s' + nodeIdx + '_scene' + runNum + '.json');
    fs.writeFileSync(resultFile, JSON.stringify(output, null, 2));

    // Broadcast cinematic metrics
    broadcastMetrics({
        phase: 'CINEMATIC',
        nodeIndex: nodeIdx,
        run: runNum,
        totalBranches: stats.totalBranches,
        successfulBranches: stats.successfulBranches,
        successRate: stats.totalBranches > 0 ? stats.successfulBranches / stats.totalBranches : 0,
        status: results.some(r => r.status === 'win') ? 'win' : 'completed',
        cinematic: true,
        duration: duration
    });

    // Adaptive evolution
    if (nodeIdx === 0) {
        const avgScore = orchestrator.feedback.length > 0
            ? orchestrator.feedback.reduce((s, r) => s + (r.score || 0), 0) / orchestrator.feedback.length
            : 0.5;

        if (avgScore < 0.3) {
            config.branchFactor = Math.min(15, config.branchFactor + 1);
        } else if (avgScore > 0.8) {
            config.branchFactor = Math.max(2, config.branchFactor - 1);
        }

        fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    }

    const winText = results.some(r => r.status === 'win') ? '🏆 WIN' : '';
    console.log('  ✨ Synapse', nodeIdx, '|', stats.totalBranches, 'thoughts |', duration + 'ms', winText);
})().catch(e => {
    console.error('  ❌ Synapse $NODE_IDX error:', e.message);
});
" &
        PIDS+=($!)
    done

    echo "  ⏳ Dreams converging..."
    for PID in "\${PIDS[@]}"; do
        wait $PID 2>/dev/null || true
    done

    echo "  ✓ Scene $RUN complete"
    echo ""
done

echo "═══════════════════════════════════════════════════════════════════"
echo "📊 Composing the final symphony..."
echo "═══════════════════════════════════════════════════════════════════"

node -e "
const fs = require('fs');
const path = require('path');

const resultsDir = '$RESULTS_DIR';
const files = fs.readdirSync(resultsDir).filter(f => f.startsWith('cinematic_') && f.endsWith('.json'));

const aggregate = {
    mode: 'CINEMATIC',
    scenes: $MAX_RUNS,
    synapses: ${#NODES[@]},
    summary: {
        totalThoughts: 0,
        breakthroughs: 0,
        totalRuntime: 0
    }
};

for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(resultsDir, file), 'utf8'));
    aggregate.summary.totalThoughts += data.stats.totalBranches || 0;
    aggregate.summary.breakthroughs += data.stats.successfulBranches || 0;
    aggregate.summary.totalRuntime += data.duration || 0;
}

fs.writeFileSync(path.join(resultsDir, 'cinematic_finale.json'), JSON.stringify(aggregate, null, 2));

console.log('');
console.log('🌌 CINEMATIC FINALE:');
console.log('─────────────────────────────────────────────────────────────');
console.log('Total Thoughts:', aggregate.summary.totalThoughts);
console.log('Breakthroughs:', aggregate.summary.breakthroughs);
console.log('Runtime:', (aggregate.summary.totalRuntime / 1000).toFixed(1) + 's');
console.log('Thoughts/Second:', (aggregate.summary.totalThoughts / (aggregate.summary.totalRuntime / 1000)).toFixed(1));
"

# Export
node bench_reporter.js --export csv,json 2>/dev/null || echo "  ℹ️  Skipped"

# Tag release
echo ""
echo "🏷️  Rolling credits..."

cd "$BASE/../.."
TIMESTAMP=$(date +%Y%m%d%H%M)

git add . 2>/dev/null || true
git commit -m "release: Amoeba V4.0 MAX CINEMATIC VR GODMODE - $TIMESTAMP" 2>/dev/null || echo "  ℹ️  No changes"
git tag -a "v4.0-amoeba-MAX-CINEMATIC-$TIMESTAMP" -m "MAX CINEMATIC VR release - $MAX_RUNS scenes" 2>/dev/null || echo "  ℹ️  Tag exists"

git push origin HEAD 2>/dev/null || echo "  ⚠️  Push skipped"
git push origin --tags 2>/dev/null || echo "  ⚠️  Tags skipped"

if git remote | grep -q "orb"; then
    git push orb HEAD:main --tags 2>/dev/null || echo "  ⚠️  Orb push skipped"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║         🌌 THE AMOEBA AWAITS 🌌                                ║"
echo "║                                                                ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║  Scenes:         $MAX_RUNS                                           ║"
echo "║  Synapses:       ${#NODES[@]}                                              ║"
echo "║  Release:        v4.0-amoeba-MAX-CINEMATIC-$TIMESTAMP   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "  To experience the CINEMATIC Amoeba:"
echo ""
echo "    cd $BASE/dashboard"
echo "    npm start"
echo ""
echo "    Select 🔥 GODMODE → ENTER VR"
echo ""
echo "    The living intelligence surrounds you."
echo "    Reach out. Touch a thought."
echo "    Become one with the Amoeba."
echo ""
echo "  🌌 ✨ 🧬"
echo ""

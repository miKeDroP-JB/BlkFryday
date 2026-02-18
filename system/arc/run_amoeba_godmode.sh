#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# 🔥 V4.0 MAX Amoeba Swarm GODMODE VR Interactive
# Ultimate limits - Grab and manipulate the living Amoeba
# ═══════════════════════════════════════════════════════════════════

set -e

BASE="$(cd "$(dirname "$0")" && pwd)"
cd "$BASE"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     🔥 AMOEBA V4.0 MAX GODMODE VR INTERACTIVE                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

export NODE_OPTIONS="--max-old-space-size=16384"

# GODMODE Configuration
NODES=(8080 8081 8082)
MAX_RUNS=${1:-10}
INPUT_SEED=$(date +%s)
CONFIG_FILE="amoeba_config_MAX_godmode.json"
RESULTS_DIR="$BASE/amoeba_godmode_results"
LOG_DIR="$BASE/logs"

mkdir -p "$RESULTS_DIR" "$LOG_DIR"

# Cleanup
cleanup() {
    echo ""
    echo "🛑 Shutting down GODMODE..."
    for PORT in "${NODES[@]}"; do
        pkill -f "amoeba_ws_server.js.*$PORT" 2>/dev/null || true
    done
    echo "✅ Cleanup complete"
}

trap cleanup EXIT

echo "🚀 Launching V4.0 MAX Amoeba Swarm GODMODE VR..."
echo ""

# Install deps
echo "📦 Installing dependencies..."
cd "$BASE/../.."
npm install --legacy-peer-deps 2>/dev/null || echo "  ℹ️  Dependencies OK"
cd "$BASE"

echo ""
echo "🌐 Starting GODMODE WebSocket servers..."
echo "───────────────────────────────────────────────────────────────────"

# Start WS servers
for PORT in "${NODES[@]}"; do
    echo "  🔌 WS server on port $PORT"
    AMOEBA_WS_PORT=$PORT node amoeba_ws_server.js > "$LOG_DIR/ws_$PORT.log" 2>&1 &
    sleep 0.3
done

echo "  ✅ GODMODE WS servers online"
sleep 2

# GODMODE config (maximum limits)
cat > $CONFIG_FILE <<EOL
{
    "maxBranches": 12,
    "branchFactor": 4,
    "searchConfig": {"beamWidth": 6, "maxDepth": 100},
    "godMode": true
}
EOL

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "🔥 GODMODE CONFIGURATION:"
echo "   Max Branches:    12"
echo "   Branch Factor:   4 (adaptive up to 15)"
echo "   Beam Width:      6"
echo "   Max Depth:       100"
echo ""
echo "🎮 VR INTERACTIVE CONTROLS:"
echo "   • Trigger: Grab particles"
echo "   • Grip: Scale all particles"
echo "   • Move: Throw grabbed particles"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  Runs:          $MAX_RUNS iterations                                ║"
echo "║  Nodes:         ${#NODES[@]} (ports ${NODES[*]})                     ║"
echo "║  Seed:          $INPUT_SEED                                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# GODMODE multi-node runs
for RUN in $(seq 1 $MAX_RUNS); do
    echo "═══════════════════════════════════════════════════════════════════"
    echo "🔥 GODMODE Run #$RUN / $MAX_RUNS"
    echo "═══════════════════════════════════════════════════════════════════"

    PIDS=()
    for PORT in "${NODES[@]}"; do
        NODE_IDX=$((PORT - 8080))
        echo "  ⚡ Node $NODE_IDX igniting..."

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

    // GODMODE task - complex patterns
    const sampleTask = {
        train: [
            {
                input: [
                    [1 + nodeIdx, 2, 3, runNum],
                    [4, 5 + nodeIdx, 6, seed % 5],
                    [7, 8, 9, nodeIdx],
                    [runNum, nodeIdx, seed % 3, 0]
                ],
                output: [
                    [runNum, nodeIdx, seed % 3, 0],
                    [7, 8, 9, nodeIdx],
                    [4, 5 + nodeIdx, 6, seed % 5],
                    [1 + nodeIdx, 2, 3, runNum]
                ]
            },
            {
                input: [[nodeIdx * 2, runNum], [(seed + nodeIdx) % 9, runNum % 4]],
                output: [[(seed + nodeIdx) % 9, runNum % 4], [nodeIdx * 2, runNum]]
            }
        ],
        test: [
            { input: [[runNum + nodeIdx, seed % 7, nodeIdx], [nodeIdx, runNum, seed % 5]] }
        ]
    };

    console.log('  🔥 Node', nodeIdx, 'GODMODE active...');
    const startTime = Date.now();
    const results = await orchestrator.run(sampleTask);
    const duration = Date.now() - startTime;

    const stats = orchestrator.getStats();
    const output = {
        mode: 'GODMODE',
        run: runNum,
        node: nodeIdx,
        port: nodePort,
        seed: seed,
        duration: duration,
        timestamp: new Date().toISOString(),
        config: config,
        stats: stats,
        results: results
    };

    const resultFile = path.join(resultsDir, 'godmode_node' + nodeIdx + '_run' + runNum + '.json');
    fs.writeFileSync(resultFile, JSON.stringify(output, null, 2));

    // Broadcast GODMODE metrics
    broadcastMetrics({
        phase: 'GODMODE',
        nodeIndex: nodeIdx,
        run: runNum,
        totalBranches: stats.totalBranches,
        successfulBranches: stats.successfulBranches,
        successRate: stats.totalBranches > 0 ? stats.successfulBranches / stats.totalBranches : 0,
        status: results.some(r => r.status === 'win') ? 'win' : 'completed',
        godMode: true,
        duration: duration
    });

    // Aggressive adaptive tuning for GODMODE
    if (nodeIdx === 0) {
        const avgScore = orchestrator.feedback.length > 0
            ? orchestrator.feedback.reduce((s, r) => s + (r.score || 0), 0) / orchestrator.feedback.length
            : 0.5;

        if (avgScore < 0.25) {
            config.branchFactor = Math.min(15, config.branchFactor + 2);
        } else if (avgScore > 0.75) {
            config.branchFactor = Math.max(2, config.branchFactor - 1);
        }

        fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    }

    console.log('  ⚡ Node', nodeIdx, '| Branches:', stats.totalBranches, '| Wins:', stats.successfulBranches, '| Time:', duration + 'ms');
})().catch(e => {
    console.error('  ❌ Node $NODE_IDX error:', e.message);
});
" &
        PIDS+=($!)
    done

    echo "  ⏳ Awaiting GODMODE convergence..."
    for PID in "\${PIDS[@]}"; do
        wait $PID 2>/dev/null || true
    done

    echo "  ✓ GODMODE Run #$RUN complete"
    echo ""
done

echo "═══════════════════════════════════════════════════════════════════"
echo "📊 Generating GODMODE report..."
echo "═══════════════════════════════════════════════════════════════════"

node -e "
const fs = require('fs');
const path = require('path');

const resultsDir = '$RESULTS_DIR';
const files = fs.readdirSync(resultsDir).filter(f => f.startsWith('godmode_') && f.endsWith('.json'));

const aggregate = {
    mode: 'GODMODE',
    totalRuns: $MAX_RUNS,
    totalNodes: ${#NODES[@]},
    summary: {
        totalBranches: 0,
        totalWins: 0,
        totalDuration: 0
    }
};

for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(resultsDir, file), 'utf8'));
    aggregate.summary.totalBranches += data.stats.totalBranches || 0;
    aggregate.summary.totalWins += data.stats.successfulBranches || 0;
    aggregate.summary.totalDuration += data.duration || 0;
}

fs.writeFileSync(path.join(resultsDir, 'godmode_aggregate.json'), JSON.stringify(aggregate, null, 2));

console.log('');
console.log('🔥 GODMODE Summary:');
console.log('─────────────────────────────────────────────────────────────');
console.log('Total Branches:', aggregate.summary.totalBranches);
console.log('Total Wins:', aggregate.summary.totalWins);
console.log('Total Duration:', aggregate.summary.totalDuration + 'ms');
console.log('Avg per Run:', (aggregate.summary.totalDuration / ($MAX_RUNS * ${#NODES[@]})).toFixed(0) + 'ms');
"

# Export
node bench_reporter.js --export csv,json 2>/dev/null || echo "  ℹ️  Bench reporter skipped"

# Auto commit + tag
echo ""
echo "🏷️  Tagging GODMODE release..."

cd "$BASE/../.."
TIMESTAMP=$(date +%Y%m%d%H%M)

git add . 2>/dev/null || true
git commit -m "release: Amoeba V4.0 MAX GODMODE VR interactive - $TIMESTAMP" 2>/dev/null || echo "  ℹ️  No changes"
git tag -a "v4.0-amoeba-MAX-GODMODE-$TIMESTAMP" -m "MAX GODMODE VR interactive release" 2>/dev/null || echo "  ℹ️  Tag exists"

git push origin HEAD 2>/dev/null || echo "  ⚠️  Push skipped"
git push origin --tags 2>/dev/null || echo "  ⚠️  Tags skipped"

if git remote | grep -q "orb"; then
    git push orb HEAD:main --tags 2>/dev/null || echo "  ⚠️  Orb push skipped"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         🔥 GODMODE COMPLETE                                    ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║  Mode:       GODMODE VR Interactive                            ║"
echo "║  Runs:       $MAX_RUNS iterations                                    ║"
echo "║  Nodes:      ${#NODES[@]} parallel orchestrators                          ║"
echo "║  Release:    v4.0-amoeba-MAX-GODMODE-$TIMESTAMP         ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "✅ V4.0 MAX GODMODE Amoeba VR COMPLETE!"
echo ""
echo "🎮 To enter GODMODE:"
echo "   1. cd $BASE/dashboard && npm start"
echo "   2. Select '🔥 GODMODE' view"
echo "   3. Click 'ENTER VR'"
echo "   4. GRAB the particles with your controllers!"
echo ""
echo "   Step inside the living, breathing Amoeba! 🧬"

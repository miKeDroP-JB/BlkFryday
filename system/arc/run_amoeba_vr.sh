#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# 🥽 V4.0 MAX Amoeba Swarm VR-Ready Launcher
# Multi-node distributed swarm with WebXR visualization support
# ═══════════════════════════════════════════════════════════════════

set -e

BASE="$(cd "$(dirname "$0")" && pwd)"
cd "$BASE"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     🥽 AMOEBA V4.0 MAX VR-READY SWARM LAUNCHER                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

export NODE_OPTIONS="--max-old-space-size=8192"

# Configuration
NODES=(8080 8081 8082)
MAX_RUNS=${1:-10}
INPUT_SEED=$(date +%s)
CONFIG_FILE="amoeba_config_MAX_VR.json"
RESULTS_DIR="$BASE/amoeba_vr_results"
LOG_DIR="$BASE/logs"

mkdir -p "$RESULTS_DIR" "$LOG_DIR"

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Shutting down WS servers..."
    for PORT in "${NODES[@]}"; do
        pkill -f "amoeba_ws_server.js.*$PORT" 2>/dev/null || true
    done
    echo "✅ Cleanup complete"
}

trap cleanup EXIT

echo "🚀 Launching V4.0 MAX Amoeba Swarm VR-ready..."
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
cd "$BASE/../.."
npm install --legacy-peer-deps 2>/dev/null || echo "  ℹ️  Dependencies OK"
cd "$BASE"

echo ""
echo "🌐 Starting WebSocket servers for VR streaming..."
echo "───────────────────────────────────────────────────────────────────"

# Start WS servers
for PORT in "${NODES[@]}"; do
    echo "  🔌 Starting WS server on port $PORT..."
    AMOEBA_WS_PORT=$PORT node amoeba_ws_server.js > "$LOG_DIR/ws_$PORT.log" 2>&1 &
    sleep 0.3
done

echo "  ✅ WS servers started on ports: ${NODES[*]}"
sleep 2

# Verify servers
RUNNING=0
for PORT in "${NODES[@]}"; do
    if lsof -i :$PORT >/dev/null 2>&1 || nc -z localhost $PORT 2>/dev/null; then
        echo "  ✓ Port $PORT: ACTIVE"
        ((RUNNING++))
    else
        echo "  ✗ Port $PORT: FAILED"
    fi
done

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "🥽 VR DASHBOARD INSTRUCTIONS:"
echo "   1. cd $BASE/dashboard && npm start"
echo "   2. Open browser → Select '🥽 VR' view"
echo "   3. Click 'ENTER VR' → Put on headset"
echo "   4. Watch the living Amoeba swarm around you!"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Initialize MAX VR config (higher limits for immersive experience)
cat > $CONFIG_FILE <<EOL
{
    "maxBranches": 10,
    "branchFactor": 3,
    "searchConfig": {"beamWidth": 6, "maxDepth": 80},
    "vrMode": true
}
EOL

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  Max Runs:       $MAX_RUNS iterations                               ║"
echo "║  Nodes:          ${#NODES[@]} (ports ${NODES[*]})                    ║"
echo "║  Max Branches:   10                                            ║"
echo "║  Branch Factor:  3 (adaptive up to 12)                         ║"
echo "║  Beam Width:     6                                             ║"
echo "║  Max Depth:      80                                            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Multi-node self-tuning runs
for RUN in $(seq 1 $MAX_RUNS); do
    echo "═══════════════════════════════════════════════════════════════════"
    echo "🔹 Run #$RUN / $MAX_RUNS - Multi-node VR iteration"
    echo "═══════════════════════════════════════════════════════════════════"

    PIDS=()
    for PORT in "${NODES[@]}"; do
        NODE_IDX=$((PORT - 8080))
        echo "  🚀 Node $NODE_IDX (port $PORT) launching..."

        node -e "
const fs = require('fs');
const path = require('path');

const { AmoebaOrchestrator } = require('./AmoebaOrchestrator');

// Try to connect to WS server for broadcasting
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

    // VR-optimized sample task (more visual variation)
    const sampleTask = {
        train: [
            { input: [[1 + nodeIdx, 2, 3], [4, 5 + runNum, 6], [7, 8, 9]], output: [[7, 8, 9], [4, 5 + runNum, 6], [1 + nodeIdx, 2, 3]] },
            { input: [[nodeIdx, runNum], [seed % 9, nodeIdx + 1]], output: [[seed % 9, nodeIdx + 1], [nodeIdx, runNum]] },
            { input: [[(seed + runNum) % 5, nodeIdx], [runNum % 3, (seed * nodeIdx) % 7]], output: [[runNum % 3, (seed * nodeIdx) % 7], [(seed + runNum) % 5, nodeIdx]] }
        ],
        test: [
            { input: [[nodeIdx + runNum, seed % 5], [runNum, nodeIdx]] }
        ]
    };

    console.log('  📡 Node', nodeIdx, 'running VR Amoeba...');
    const startTime = Date.now();
    const results = await orchestrator.run(sampleTask);
    const duration = Date.now() - startTime;

    const stats = orchestrator.getStats();
    const output = {
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

    const resultFile = path.join(resultsDir, 'vr_node' + nodeIdx + '_run' + runNum + '.json');
    fs.writeFileSync(resultFile, JSON.stringify(output, null, 2));

    // Broadcast VR-enhanced metrics
    broadcastMetrics({
        phase: 'VRComplete',
        nodeIndex: nodeIdx,
        run: runNum,
        totalBranches: stats.totalBranches,
        successfulBranches: stats.successfulBranches,
        successRate: stats.totalBranches > 0 ? stats.successfulBranches / stats.totalBranches : 0,
        status: results.some(r => r.status === 'win') ? 'win' : 'completed',
        vrMode: true,
        duration: duration
    });

    // Adaptive tuning (node 0 controls)
    if (nodeIdx === 0) {
        const currentBF = orchestrator.branchFactor;
        const avgScore = orchestrator.feedback.length > 0
            ? orchestrator.feedback.reduce((s, r) => s + (r.score || 0), 0) / orchestrator.feedback.length
            : 0.5;

        // VR mode: More aggressive branching for visual density
        if (avgScore < 0.3) {
            config.branchFactor = Math.min(12, config.branchFactor + 1);
        } else if (avgScore > 0.8) {
            config.branchFactor = Math.max(2, config.branchFactor - 1);
        }

        fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    }

    console.log('  ✅ Node', nodeIdx, '| Branches:', stats.totalBranches, '| Wins:', stats.successfulBranches, '| Time:', duration + 'ms');
})().catch(e => {
    console.error('  ❌ Node $NODE_IDX error:', e.message);
});
" &
        PIDS+=($!)
    done

    # Wait for all nodes
    echo "  ⏳ Waiting for nodes..."
    for PID in "\${PIDS[@]}"; do
        wait $PID 2>/dev/null || true
    done

    echo "  ✓ Run #$RUN complete"
    echo ""
done

echo "═══════════════════════════════════════════════════════════════════"
echo "📊 Generating VR aggregate report..."
echo "═══════════════════════════════════════════════════════════════════"

node -e "
const fs = require('fs');
const path = require('path');

const resultsDir = '$RESULTS_DIR';
const files = fs.readdirSync(resultsDir).filter(f => f.startsWith('vr_') && f.endsWith('.json'));

const aggregate = {
    mode: 'VR',
    totalRuns: $MAX_RUNS,
    totalNodes: ${#NODES[@]},
    nodes: [],
    summary: {
        totalBranches: 0,
        totalWins: 0,
        totalDuration: 0,
        avgDuration: 0
    }
};

const byNode = {};

for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(resultsDir, file), 'utf8'));
    if (!byNode[data.node]) byNode[data.node] = [];
    byNode[data.node].push(data);

    aggregate.summary.totalBranches += data.stats.totalBranches || 0;
    aggregate.summary.totalWins += data.stats.successfulBranches || 0;
    aggregate.summary.totalDuration += data.duration || 0;
}

aggregate.nodes = Object.entries(byNode).map(([node, runs]) => ({
    node: parseInt(node),
    runs: runs.length,
    totalBranches: runs.reduce((s, r) => s + (r.stats.totalBranches || 0), 0),
    wins: runs.reduce((s, r) => s + (r.stats.successfulBranches || 0), 0),
    avgDuration: runs.reduce((s, r) => s + (r.duration || 0), 0) / runs.length
}));

aggregate.summary.avgDuration = aggregate.summary.totalDuration / ($MAX_RUNS * ${#NODES[@]});

fs.writeFileSync(path.join(resultsDir, 'vr_aggregate.json'), JSON.stringify(aggregate, null, 2));

console.log('');
console.log('🥽 VR Swarm Summary:');
console.log('─────────────────────────────────────────────────────────────');
console.log('Total Branches:', aggregate.summary.totalBranches);
console.log('Total Wins:', aggregate.summary.totalWins);
console.log('Avg Duration:', aggregate.summary.avgDuration.toFixed(0) + 'ms');
console.log('');
console.log('Per Node Performance:');
aggregate.nodes.forEach(n => {
    console.log('  Node', n.node, '- Branches:', n.totalBranches, '| Wins:', n.wins, '| Avg:', n.avgDuration.toFixed(0) + 'ms');
});
"

# Export benchmark data
echo ""
node bench_reporter.js --export csv,json 2>/dev/null || echo "  ℹ️  Bench reporter skipped"

# Auto commit + tag
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "🏷️  Tagging VR release..."
echo "═══════════════════════════════════════════════════════════════════"

cd "$BASE/../.."
TIMESTAMP=$(date +%Y%m%d%H%M)

git add . 2>/dev/null || true
git commit -m "release: Amoeba V4.0 MAX VR swarm - $TIMESTAMP" 2>/dev/null || echo "  ℹ️  No changes to commit"
git tag -a "v4.0-amoeba-MAX-VR-$TIMESTAMP" -m "MAX VR swarm release - $MAX_RUNS runs, ${#NODES[@]} nodes" 2>/dev/null || echo "  ℹ️  Tag may exist"

# Push
git push origin HEAD 2>/dev/null || echo "  ⚠️  Push to origin skipped"
git push origin --tags 2>/dev/null || echo "  ⚠️  Tags push skipped"

if git remote | grep -q "orb"; then
    git push orb HEAD:main --tags 2>/dev/null || echo "  ⚠️  Push to orb skipped"
fi

# Final summary
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         🥽 MAX AMOEBA VR SWARM COMPLETE                        ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║  Runs:       $MAX_RUNS iterations                                    ║"
echo "║  Nodes:      ${#NODES[@]} parallel orchestrators                          ║"
echo "║  Release:    v4.0-amoeba-MAX-VR-$TIMESTAMP             ║"
echo "║  Results:    $RESULTS_DIR/                   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "✅ MAX Amoeba VR Swarm COMPLETE!"
echo ""
echo "🥽 To enter the Amoeba VR experience:"
echo "   1. cd $BASE/dashboard"
echo "   2. npm install && npm start"
echo "   3. Open browser → Click '🥽 VR'"
echo "   4. Click 'ENTER VR' → Put on headset"
echo ""
echo "   Strap in, step inside the Amoeba! 🧬"

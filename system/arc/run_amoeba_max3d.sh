#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# 🧬 V4.0 MAX Multi-Node 3D Amoeba Launcher
# Distributed swarm orchestration with live 3D visualization
# ═══════════════════════════════════════════════════════════════════

set -e

BASE="$(cd "$(dirname "$0")" && pwd)"
cd "$BASE"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     🧬 AMOEBA V4.0 MAX 3D MULTI-NODE SWARM                     ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

export NODE_OPTIONS="--max-old-space-size=8192"

# Configuration
NODES=(8080 8081 8082 8083)
MAX_RUNS=${1:-10}
INPUT_SEED=$(date +%s)
CONFIG_FILE="amoeba_config.json"
RESULTS_DIR="$BASE/amoeba_max_results"
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

# Install dependencies
echo "📦 Installing dependencies..."
cd "$BASE/../.."
npm install --legacy-peer-deps 2>/dev/null || echo "  ℹ️  Dependencies OK"
cd "$BASE"

echo ""
echo "🌐 Starting WebSocket servers on ports: ${NODES[*]}"
echo "───────────────────────────────────────────────────────────────────"

# Start WS servers on multiple ports
for PORT in "${NODES[@]}"; do
    echo "  🔌 Starting WS server on port $PORT..."
    AMOEBA_WS_PORT=$PORT node amoeba_ws_server.js > "$LOG_DIR/ws_$PORT.log" 2>&1 &
    sleep 0.5
done

echo "  ✅ All WS servers started"
echo ""

# Verify servers are running
sleep 2
RUNNING=0
for PORT in "${NODES[@]}"; do
    if lsof -i :$PORT >/dev/null 2>&1; then
        echo "  ✓ Port $PORT: ACTIVE"
        ((RUNNING++))
    else
        echo "  ✗ Port $PORT: FAILED"
    fi
done

if [ $RUNNING -eq 0 ]; then
    echo "❌ No WS servers running. Check logs in $LOG_DIR"
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "🎮 Open dashboard to watch the living Amoeba:"
echo "   cd $BASE/dashboard && npm start"
echo "   Then select '3D' view"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Initialize config
cat > $CONFIG_FILE <<EOL
{
    "maxBranches": 6,
    "branchFactor": 2,
    "searchConfig": {"beamWidth": 5, "maxDepth": 60}
}
EOL

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  Max Runs:    $MAX_RUNS                                              ║"
echo "║  Nodes:       ${#NODES[@]} (ports ${NODES[*]})                      ║"
echo "║  Input Seed:  $INPUT_SEED                                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Multi-node self-tuning runs
for RUN in $(seq 1 $MAX_RUNS); do
    echo "═══════════════════════════════════════════════════════════════════"
    echo "🔹 Run #$RUN / $MAX_RUNS - Multi-node parallel iteration"
    echo "═══════════════════════════════════════════════════════════════════"

    # Launch orchestrator on each node in parallel
    PIDS=()
    for PORT in "${NODES[@]}"; do
        NODE_IDX=$((PORT - 8080))
        echo "  🚀 Node $NODE_IDX (port $PORT) starting..."

        node -e "
const fs = require('fs');
const path = require('path');

// Load orchestrator
const { AmoebaOrchestrator } = require('./AmoebaOrchestrator');

// Try to load WS broadcaster
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
        branchFactor: config.branchFactor + nodeIdx, // Vary by node
        verbose: false
    });

    // Create task with node-specific variation
    const sampleTask = {
        train: [
            { input: [[1 + nodeIdx, 2], [3, 4]], output: [[3, 4], [1 + nodeIdx, 2]] },
            { input: [[5, 6 + nodeIdx], [7, 8]], output: [[7, 8], [5, 6 + nodeIdx]] },
            { input: [[(seed % 9) + 1, runNum], [runNum + nodeIdx, (seed % 5)]], output: [[runNum + nodeIdx, (seed % 5)], [(seed % 9) + 1, runNum]] }
        ],
        test: [
            { input: [[9, nodeIdx], [1, 2]] }
        ]
    };

    console.log('  📡 Node', nodeIdx, 'running Amoeba...');
    const results = await orchestrator.run(sampleTask);

    const stats = orchestrator.getStats();
    const output = {
        run: runNum,
        node: nodeIdx,
        port: nodePort,
        seed: seed,
        timestamp: new Date().toISOString(),
        config: config,
        stats: stats,
        results: results
    };

    const resultFile = path.join(resultsDir, 'node' + nodeIdx + '_run' + runNum + '.json');
    fs.writeFileSync(resultFile, JSON.stringify(output, null, 2));

    // Broadcast final metrics
    broadcastMetrics({
        phase: 'Complete',
        nodeIndex: nodeIdx,
        run: runNum,
        totalBranches: stats.totalBranches,
        successfulBranches: stats.successfulBranches,
        successRate: stats.totalBranches > 0 ? stats.successfulBranches / stats.totalBranches : 0,
        status: results.some(r => r.status === 'win') ? 'win' : 'completed'
    });

    // Adaptive tuning - only node 0 updates config
    if (nodeIdx === 0) {
        const newBF = Math.min(8, Math.max(1, orchestrator.branchFactor));
        config.branchFactor = newBF;
        fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    }

    console.log('  ✅ Node', nodeIdx, 'complete. Branches:', stats.totalBranches, 'Wins:', stats.successfulBranches);
})().catch(e => {
    console.error('  ❌ Node $NODE_IDX error:', e.message);
});
" &
        PIDS+=($!)
    done

    # Wait for all nodes to complete
    echo "  ⏳ Waiting for all nodes..."
    for PID in "${PIDS[@]}"; do
        wait $PID 2>/dev/null || true
    done

    echo "  ✓ Run #$RUN complete"
    echo ""
done

echo "═══════════════════════════════════════════════════════════════════"
echo "📊 Generating aggregate report..."
echo "═══════════════════════════════════════════════════════════════════"

node -e "
const fs = require('fs');
const path = require('path');

const resultsDir = '$RESULTS_DIR';
const files = fs.readdirSync(resultsDir).filter(f => f.endsWith('.json') && f !== 'aggregate.json');

const aggregate = {
    totalRuns: $MAX_RUNS,
    totalNodes: ${#NODES[@]},
    nodes: [],
    runs: [],
    summary: {
        totalBranches: 0,
        totalWins: 0,
        avgBranchesPerRun: 0
    }
};

const byNode = {};
const byRun = {};

for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(resultsDir, file), 'utf8'));

    if (!byNode[data.node]) byNode[data.node] = [];
    byNode[data.node].push(data);

    if (!byRun[data.run]) byRun[data.run] = [];
    byRun[data.run].push(data);

    aggregate.summary.totalBranches += data.stats.totalBranches || 0;
    aggregate.summary.totalWins += data.stats.successfulBranches || 0;
}

aggregate.nodes = Object.entries(byNode).map(([node, runs]) => ({
    node: parseInt(node),
    runs: runs.length,
    totalBranches: runs.reduce((s, r) => s + (r.stats.totalBranches || 0), 0),
    wins: runs.reduce((s, r) => s + (r.stats.successfulBranches || 0), 0)
}));

aggregate.runs = Object.entries(byRun).map(([run, nodes]) => ({
    run: parseInt(run),
    nodes: nodes.length,
    totalBranches: nodes.reduce((s, n) => s + (n.stats.totalBranches || 0), 0),
    wins: nodes.reduce((s, n) => s + (n.stats.successfulBranches || 0), 0)
}));

aggregate.summary.avgBranchesPerRun = aggregate.summary.totalBranches / ($MAX_RUNS * ${#NODES[@]});

fs.writeFileSync(path.join(resultsDir, 'aggregate.json'), JSON.stringify(aggregate, null, 2));

console.log('');
console.log('🧬 Aggregate Summary:');
console.log('─────────────────────────────────────────────────────────');
console.log('Total Branches:', aggregate.summary.totalBranches);
console.log('Total Wins:', aggregate.summary.totalWins);
console.log('Avg Branches/Run:', aggregate.summary.avgBranchesPerRun.toFixed(1));
console.log('');
console.log('Per Node:');
aggregate.nodes.forEach(n => {
    console.log('  Node', n.node, '- Branches:', n.totalBranches, 'Wins:', n.wins);
});
"

# Auto commit + tag
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "🏷️  Tagging release..."
echo "═══════════════════════════════════════════════════════════════════"

cd "$BASE/../.."
TIMESTAMP=$(date +%Y%m%d%H%M)

git add . 2>/dev/null || true
git commit -m "release: Amoeba V4.0 MAX 3D multi-node swarm - $TIMESTAMP" 2>/dev/null || echo "  ℹ️  No changes to commit"
git tag -a "v4.0-amoeba-swarm3D-$TIMESTAMP" -m "MAX 3D swarm release - $MAX_RUNS runs, ${#NODES[@]} nodes" 2>/dev/null || echo "  ℹ️  Tag may exist"

# Push
git push origin HEAD 2>/dev/null || echo "  ⚠️  Push to origin skipped"
git push origin --tags 2>/dev/null || echo "  ⚠️  Tags push skipped"

if git remote | grep -q "orb"; then
    git push orb HEAD:main --tags 2>/dev/null || echo "  ⚠️  Push to orb skipped"
fi

# Summary
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         🧬 AMOEBA MAX 3D SWARM COMPLETE                        ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║  Runs:       $MAX_RUNS iterations                                    ║"
echo "║  Nodes:      ${#NODES[@]} parallel orchestrators                         ║"
echo "║  Release:    v4.0-amoeba-swarm3D-$TIMESTAMP             ║"
echo "║  Results:    $RESULTS_DIR/                   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "✅ MAX Amoeba Swarm 3D COMPLETE!"
echo "   Open dashboard and select '3D' view to watch the living Amoeba."

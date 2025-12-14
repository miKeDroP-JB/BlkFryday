#!/bin/bash
# ========================================
# ORBOS CallAgents Full Bootstrap Script
# ========================================

echo "⚡ Bootstrapping CallAgents..."

TERMINAL_PATH="/home/user/BlkFryday/system/terminal/0r8-term-core.js"
TASK_FILE="/home/user/BlkFryday/system/terminal/call_tasks.json"

# Run all commands in a single session
echo "system init --mode production
memory init --engine fractal --persistence temporal

agent create --name CallAgent_1 --type CallAgent --autonomy bounded
agent create --name CallAgent_2 --type CallAgent --autonomy bounded
agent create --name CallAgent_3 --type CallAgent --autonomy bounded

callpool load --file $TASK_FILE --agents CallAgent_1,CallAgent_2,CallAgent_3
callpool set concurrency 3
callpool start

monitor metrics --agents CallAgent_1,CallAgent_2,CallAgent_3 --live

observer enable --agents CallAgent_1,CallAgent_2,CallAgent_3 --auto-correct

callpool status
" | node $TERMINAL_PATH

echo ""
echo "✅ CallAgents boot complete. Agents are live, tasks are running, metrics streaming."
echo "📊 You can now watch ORBOS handle calls in real-time."

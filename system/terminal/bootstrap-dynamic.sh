#!/bin/bash
# ========================================
# ORBOS Dynamic CallAgents Bootstrap Script
# ========================================

echo "⚡ Bootstrapping Dynamic CallAgents..."

# Paths
TERMINAL_PATH="/home/user/BlkFryday/system/terminal/0r8-term-core.js"
TASK_POOL="/home/user/BlkFryday/system/terminal/call_tasks.json"

# Step 1: Initialize system and create agents
echo "system init --mode production
memory init --engine fractal --persistence temporal
agents create --type CallAgent --count 3 --autonomy bounded
agent start CallAgent_1
agent start CallAgent_2
agent start CallAgent_3
observer enable --auto-correct --dominant
" | node $TERMINAL_PATH

# Step 2: Dynamic Task Injector Loop
echo ""
echo "Starting dynamic task injection loop..."
ITERATION=0

while true; do
  ITERATION=$((ITERATION + 1))
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  INJECTION CYCLE $ITERATION"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # Fetch next batch of tasks from central pool
  echo "system init --mode production
agents create --type CallAgent --count 3 --autonomy bounded
agent start CallAgent_1
agent start CallAgent_2
agent start CallAgent_3
callpool fetch --file $TASK_POOL --agents all_active
" | node $TERMINAL_PATH

  # Check system load
  CPU_LOAD=$(top -bn1 2>/dev/null | grep "Cpu(s)" | awk '{print $2 + $4}' || echo "10")
  MEM_USAGE=$(free 2>/dev/null | grep Mem | awk '{print $3/$2 * 100.0}' || echo "30")

  echo ""
  echo "📊 System metrics: CPU=${CPU_LOAD}% MEM=${MEM_USAGE}%"

  # Adjust swarm intensity based on load
  if (( $(echo "${CPU_LOAD:-10} > 80" | bc -l 2>/dev/null || echo 0) )); then
    echo "⚠ High CPU, scaling down agent activity..."
    echo "system init --mode production
agents create --type CallAgent --count 3 --autonomy bounded
agent start CallAgent_1
agent start CallAgent_2
agent start CallAgent_3
agents adjust --intensity low
" | node $TERMINAL_PATH
  elif (( $(echo "${MEM_USAGE:-30} > 70" | bc -l 2>/dev/null || echo 0) )); then
    echo "⚠ High memory usage, optimizing memory..."
    echo "system init --mode production
agents create --type CallAgent --count 3 --autonomy bounded
agent start CallAgent_1
agent start CallAgent_2
agent start CallAgent_3
memory optimize --agents all_active
" | node $TERMINAL_PATH
  else
    echo "🌟 System stable, boosting call throughput..."
    echo "system init --mode production
agents create --type CallAgent --count 3 --autonomy bounded
agent start CallAgent_1
agent start CallAgent_2
agent start CallAgent_3
agents adjust --intensity high
" | node $TERMINAL_PATH
  fi

  # Rotate trained agents
  echo "system init --mode production
agents create --type CallAgent --count 3 --autonomy bounded
agents rotate --trained_to_background --background_to_active
callpool status
" | node $TERMINAL_PATH

  # Wait before next injection (10 seconds)
  echo ""
  echo "💤 Sleeping 10s before next cycle..."

  # Break after 3 iterations for demo (remove for production)
  if [ $ITERATION -ge 3 ]; then
    echo ""
    echo "✅ Demo complete after $ITERATION cycles."
    echo "📊 Remove iteration limit for continuous operation."
    break
  fi

  sleep 10
done

echo ""
echo "✅ Dynamic CallAgents shutdown. Tasks injected continuously. System auto-optimized."

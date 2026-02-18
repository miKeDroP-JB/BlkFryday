#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# 💼⚡ BUSINESS AGENT ARMY — Automated Income Generation
# Coordinated multi-agent system for bug bounty, freelance, content
# ═══════════════════════════════════════════════════════════════════════════

set -e
ROOT="$(pwd)"

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║                                                                       ║"
echo "║   💼⚡ BUSINESS AGENT ARMY                                           ║"
echo "║                                                                       ║"
echo "║   Automated Income Generation System                                  ║"
echo "║   Bug Bounty • Freelance • Content • Outreach                        ║"
echo "║                                                                       ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# INITIALIZATION
# ═══════════════════════════════════════════════════════════════════════════

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  INITIALIZING AGENTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

node -e "
const { createArmy } = require('$ROOT/agents');

// Create the agent army
const army = createArmy({
    brain: {
        priorities: {
            bug_bounty: 0.4,
            freelance: 0.35,
            content: 0.15,
            outreach: 0.1
        }
    },
    revenue: {
        dailyGoal: 100,
        weeklyGoal: 700,
        monthlyGoal: 3000
    }
});

console.log('');
console.log('  ✓ 0rb_brain (Overseer) - Task orchestration');
console.log('  ✓ Sentinel - Security scanning (authorized only)');
console.log('  ✓ Apollo - Freelance gig automation');
console.log('  ✓ Mercury - Outreach & pitching');
console.log('  ✓ Athena - Content generation');
console.log('  ✓ Ares - Bug bounty submission');
console.log('  ✓ Hermes - Client messaging');
console.log('  ✓ Hephaestus - Build automation');
console.log('  ✓ Artemis - Compliance validation');
console.log('');
console.log('  Dashboard Components:');
console.log('  ✓ Revenue Tracker');
console.log('  ✓ Agent Metrics');
console.log('');

// Display initial status
const status = army.getStatus();
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  ARMY STATUS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('  Agents Online: ' + status.agents.length);
console.log('  Active Agents: ' + status.metrics.activeAgents);
console.log('  Idle Agents: ' + status.metrics.idleAgents);
console.log('');

// Show revenue goals
const goals = army.dashboard.revenue.getGoalProgress();
console.log('  REVENUE GOALS:');
console.log('  Daily:   \$' + goals.daily.current + ' / \$' + goals.daily.goal + ' (' + goals.daily.percentage + '%)');
console.log('  Weekly:  \$' + goals.weekly.current + ' / \$' + goals.weekly.goal + ' (' + goals.weekly.percentage + '%)');
console.log('  Monthly: \$' + goals.monthly.current + ' / \$' + goals.monthly.goal + ' (' + goals.monthly.percentage + '%)');
console.log('');

console.log('═══════════════════════════════════════════════════════════════════════');
console.log('');
console.log('  💼⚡ AGENT ARMY ONLINE');
console.log('');
console.log('  INCOME STREAMS:');
console.log('    🛡️  Bug Bounty  → Sentinel + Ares');
console.log('    ☀️  Freelance   → Apollo + Hephaestus');
console.log('    📝  Content     → Athena');
console.log('    📨  Outreach    → Mercury + Hermes');
console.log('    ⚖️  Compliance  → Artemis');
console.log('');
console.log('  HOW IT WORKS:');
console.log('    1. 0rb_brain prioritizes tasks based on revenue potential');
console.log('    2. Agents execute their specialized tasks autonomously');
console.log('    3. Artemis validates all actions for compliance');
console.log('    4. Revenue tracker monitors all income streams');
console.log('');
console.log('  NOTE: Security scanning only runs on authorized targets');
console.log('        All activities comply with platform rules');
console.log('');
console.log('═══════════════════════════════════════════════════════════════════════');
"

echo ""
echo "  Agent Army initialized successfully!"
echo ""
echo "  To integrate with Genesis PlayMode, run:"
echo "  ./run_genesis_full.sh"
echo ""

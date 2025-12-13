#!/usr/bin/env node
/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   FLOWSYNC ORCHESTRATOR CLI                                               ║
 * ║   Usage: ./flowsync orchestrate --mode=coherent --observer=dominant       ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { orchestrator } from './flowsync-orchestrator.js';
import { locks } from './locks/index.js';

const COLORS = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    magenta: '\x1b[35m',
    red: '\x1b[31m'
};

function parseArgs(args) {
    const parsed = { command: args[0], options: {} };
    for (let i = 1; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            const [key, value] = arg.slice(2).split('=');
            parsed.options[key] = value === undefined ? true : value;
        }
    }
    return parsed;
}

function showHelp() {
    console.log(`
${COLORS.magenta}╔═══════════════════════════════════════════════════════════════════════════╗
║   FLOWSYNC ORCHESTRATOR - Multi-Node Coherence                            ║
╚═══════════════════════════════════════════════════════════════════════════╝${COLORS.reset}

${COLORS.cyan}Usage:${COLORS.reset}
  node core/flowsync-cli.js <command> [options]

${COLORS.cyan}Commands:${COLORS.reset}
  ${COLORS.bright}orchestrate${COLORS.reset}   Set orchestration mode
  ${COLORS.bright}status${COLORS.reset}        Show orchestrator status
  ${COLORS.bright}signal${COLORS.reset}        Emit a signal from a node
  ${COLORS.bright}register${COLORS.reset}      Register a new node

${COLORS.cyan}Orchestrate Options:${COLORS.reset}
  --mode=<mode>         Mode: isolated, coherent, swarm
  --observer=<level>    Observer level: normal, dominant
  --memory=<policy>     Memory policy: read-write, shadow-only

${COLORS.cyan}Signal Options:${COLORS.reset}
  --node=<nodeId>       Source node ID
  --type=<type>         Signal type: confidence, risk, entropy, escalation
  --value=<value>       Signal value (0-1)

${COLORS.cyan}Examples:${COLORS.reset}
  ${COLORS.dim}# Enable coherent mode with observer dominance${COLORS.reset}
  node core/flowsync-cli.js orchestrate --mode=coherent --observer=dominant --memory=shadow-only

  ${COLORS.dim}# Check orchestrator status${COLORS.reset}
  node core/flowsync-cli.js status

  ${COLORS.dim}# Emit a risk signal${COLORS.reset}
  node core/flowsync-cli.js signal --node=GiftNode --type=risk --value=0.3

${COLORS.cyan}Mode Descriptions:${COLORS.reset}
  ${COLORS.yellow}isolated${COLORS.reset}    Nodes operate independently, no signal propagation
  ${COLORS.yellow}coherent${COLORS.reset}    Nodes share signals (confidence, risk, entropy)
  ${COLORS.yellow}swarm${COLORS.reset}       Full coordination mode (experimental)

${COLORS.cyan}Philosophy:${COLORS.reset}
  "Flocking behavior, not hive mind"
  - Share signals, not state
  - No memory cross-contamination
  - Observer can veto dangerous signals
`);
}

async function runOrchestrate(options) {
    const mode = options.mode || 'coherent';
    const observer = options.observer || 'normal';
    const memory = options.memory || 'shadow-only';

    console.log(`
${COLORS.magenta}╔═══════════════════════════════════════════════════════════════════════════╗
║   CONFIGURING ORCHESTRATION                                               ║
╚═══════════════════════════════════════════════════════════════════════════╝${COLORS.reset}
`);

    // Check locks
    const lockStatus = locks.getStatus();
    if (!lockStatus.frozen) {
        console.log(`${COLORS.yellow}WARNING: Safety locks not engaged!${COLORS.reset}`);
        console.log(`${COLORS.dim}Recommended: node core/locks/cli.js freeze --scope=memory,observer,amoeba${COLORS.reset}`);
        console.log('');
    }

    console.log(`${COLORS.cyan}Setting mode:${COLORS.reset} ${mode}`);
    console.log(`${COLORS.cyan}Observer:${COLORS.reset} ${observer}`);
    console.log(`${COLORS.cyan}Memory policy:${COLORS.reset} ${memory}`);
    console.log('');

    const result = orchestrator.setMode(mode, {
        observer: observer,
        memory: memory
    });

    if (result.success) {
        console.log(`${COLORS.green}Orchestration configured:${COLORS.reset}`);
        console.log(`  Mode:              ${result.mode}`);
        console.log(`  Previous Mode:     ${result.previousMode}`);
        console.log(`  Observer Dominant: ${result.observerDominance ? COLORS.green + 'YES' : COLORS.dim + 'NO'}${COLORS.reset}`);
        console.log(`  Memory Policy:     ${result.memoryPolicy}`);

        console.log(`
${COLORS.green}╔═══════════════════════════════════════════════════════════════════════════╗
║   ORCHESTRATION ACTIVE                                                    ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║   Nodes now:                                                              ║
║     ${COLORS.cyan}Share signals${COLORS.reset} (confidence, risk, entropy)                        ║
║     ${COLORS.cyan}Propagate warnings${COLORS.reset} across the network                           ║
║     ${COLORS.cyan}Maintain isolation${COLORS.reset} of state and memory                         ║
║                                                                           ║
║   Observer:                                                               ║
║     ${result.observerDominance ? COLORS.green + 'DOMINANT' : COLORS.dim + 'NORMAL'}${COLORS.reset} - Can veto dangerous signals                         ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝${COLORS.reset}
`);
    } else {
        console.error(`${COLORS.red}Error: ${result.error}${COLORS.reset}`);
    }
}

async function runStatus() {
    const status = orchestrator.getStatus();

    console.log(`
${COLORS.magenta}╔═══════════════════════════════════════════════════════════════════════════╗
║   ORCHESTRATOR STATUS                                                     ║
╚═══════════════════════════════════════════════════════════════════════════╝${COLORS.reset}
`);

    console.log(`${COLORS.cyan}Mode:${COLORS.reset}`);
    console.log(`  Current:           ${status.mode}`);
    console.log(`  Observer Dominant: ${status.observerDominance ? COLORS.green + 'YES' : COLORS.dim + 'NO'}${COLORS.reset}`);
    console.log(`  Memory Policy:     ${status.memoryPolicy}`);

    console.log(`\n${COLORS.cyan}Nodes:${COLORS.reset}`);
    console.log(`  Total:             ${status.nodes}`);
    console.log(`  Active:            ${status.activeNodes}`);

    console.log(`\n${COLORS.cyan}Entropy:${COLORS.reset}`);
    console.log(`  System:            ${(status.entropy.system * 100).toFixed(1)}%`);
    if (status.entropy.nodes.length > 0) {
        for (const node of status.entropy.nodes) {
            console.log(`    ${node.id.padEnd(15)} ${(node.entropy * 100).toFixed(1)}%`);
        }
    }

    console.log(`\n${COLORS.cyan}Coherence:${COLORS.reset}`);
    console.log(`  Score:             ${(status.coherence.score * 100).toFixed(1)}%`);
    console.log(`  Signal Coherence:  ${(status.coherence.signalCoherence * 100).toFixed(1)}%`);
    console.log(`  Confidence Align:  ${(status.coherence.confidenceCoherence * 100).toFixed(1)}%`);

    console.log(`\n${COLORS.cyan}Metrics:${COLORS.reset}`);
    console.log(`  Signals Sent:      ${status.metrics.signalsSent}`);
    console.log(`  Signals Received:  ${status.metrics.signalsReceived}`);
    console.log(`  Coherence Events:  ${status.metrics.coherenceEvents}`);
    console.log(`  Signal Queue:      ${status.signalQueueSize}`);
}

async function runSignal(options) {
    const nodeId = options.node || 'cli';
    const type = options.type || 'confidence';
    const value = parseFloat(options.value) || 0.5;

    // Register node if needed
    orchestrator.registerNode(nodeId, { name: nodeId });

    const signalType = orchestrator.SIGNAL_TYPES[type.toUpperCase()];
    if (!signalType) {
        console.error(`${COLORS.red}Unknown signal type: ${type}${COLORS.reset}`);
        console.log(`Valid types: ${Object.keys(orchestrator.SIGNAL_TYPES).join(', ').toLowerCase()}`);
        return;
    }

    console.log(`${COLORS.cyan}Emitting signal:${COLORS.reset}`);
    console.log(`  Node:   ${nodeId}`);
    console.log(`  Type:   ${type}`);
    console.log(`  Value:  ${value}`);

    const payload = {};
    payload[type] = value;

    const result = orchestrator.emitSignal(nodeId, signalType, payload);

    if (result.propagated) {
        console.log(`${COLORS.green}Signal propagated${COLORS.reset}`);
        console.log(`  ID: ${result.signal.id}`);
    } else {
        console.log(`${COLORS.yellow}Signal not propagated: ${result.reason}${COLORS.reset}`);
    }
}

async function runRegister(options) {
    const nodeId = options.node || options.id;
    const name = options.name || nodeId;

    if (!nodeId) {
        console.error(`${COLORS.red}Error: Node ID required (--node=xxx)${COLORS.reset}`);
        return;
    }

    const node = orchestrator.registerNode(nodeId, { name });

    console.log(`${COLORS.green}Node registered:${COLORS.reset}`);
    console.log(`  ID:         ${node.id}`);
    console.log(`  Name:       ${node.name}`);
    console.log(`  Confidence: ${node.confidence}`);
    console.log(`  Risk:       ${node.risk}`);
    console.log(`  Entropy:    ${node.entropy}`);
}

async function main() {
    const args = process.argv.slice(2);
    const { command, options } = parseArgs(args);

    if (!command || command === 'help' || options.help) {
        showHelp();
        process.exit(0);
    }

    switch (command) {
        case 'orchestrate':
            await runOrchestrate(options);
            break;
        case 'status':
            await runStatus();
            break;
        case 'signal':
            await runSignal(options);
            break;
        case 'register':
            await runRegister(options);
            break;
        default:
            console.error(`${COLORS.red}Unknown command: ${command}${COLORS.reset}`);
            showHelp();
            process.exit(1);
    }
}

main();

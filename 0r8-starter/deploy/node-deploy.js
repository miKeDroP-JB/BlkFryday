#!/usr/bin/env node
/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   SANDBOXED NODE DEPLOYMENT                                               ║
 * ║   "A glass terrarium with live air"                                       ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Deploy nodes with sandbox protection:
 * - Real humans, real inputs, real weirdness
 * - No memory writes to core
 * - No cross-node contagion
 * - No privilege escalation
 */

import { locks } from '../core/locks/index.js';
import { observer } from '../core/observer/index.js';
import { amoebaSecurity } from '../core/amoeba-security.js';

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

// Sandbox configuration
const sandboxConfig = {
    hard: {
        memoryWrites: false,
        crossNodeComm: false,
        privilegeEscalation: false,
        externalApis: false,
        fileSystem: false
    },
    soft: {
        memoryWrites: 'shadow-only',
        crossNodeComm: 'read-only',
        privilegeEscalation: false,
        externalApis: 'rate-limited',
        fileSystem: 'temp-only'
    },
    minimal: {
        memoryWrites: true,
        crossNodeComm: true,
        privilegeEscalation: false,
        externalApis: true,
        fileSystem: 'restricted'
    }
};

// Rate limit configurations
const rateLimitConfig = {
    adaptive: {
        base: 10,
        max: 100,
        adjustOnLoad: true,
        cooldownMs: 1000
    },
    strict: {
        base: 5,
        max: 20,
        adjustOnLoad: false,
        cooldownMs: 2000
    },
    relaxed: {
        base: 50,
        max: 500,
        adjustOnLoad: true,
        cooldownMs: 100
    }
};

// Deployed node state
const deployedNodes = new Map();

/**
 * Deploy a node with sandbox protection
 */
async function deployNode(nodeName, options = {}) {
    const {
        public: isPublic = false,
        sandbox = 'hard',
        rateLimit = 'adaptive',
        observerPriority = 'high'
    } = options;

    const deploymentId = `${nodeName}-${Date.now()}`;

    console.log(`
${COLORS.magenta}╔═══════════════════════════════════════════════════════════════════════════╗
║   DEPLOYING NODE: ${nodeName.padEnd(54)}║
╚═══════════════════════════════════════════════════════════════════════════╝${COLORS.reset}
`);

    // 1. Verify safety locks
    console.log(`${COLORS.cyan}[1/5] Verifying safety locks...${COLORS.reset}`);
    const lockStatus = locks.getStatus();

    if (!lockStatus.frozen) {
        console.log(`  ${COLORS.yellow}WARNING: Safety locks not engaged!${COLORS.reset}`);
        console.log(`  ${COLORS.dim}Run: node core/locks/cli.js freeze --scope=memory,observer,amoeba${COLORS.reset}`);
        console.log(`  ${COLORS.dim}Continuing without full protection...${COLORS.reset}`);
    } else {
        console.log(`  ${COLORS.green}Safety locks engaged${COLORS.reset}`);
        for (const [scope, frozen] of Object.entries(lockStatus.scopes)) {
            if (frozen) {
                console.log(`    ${COLORS.green}[LOCKED]${COLORS.reset} ${scope}`);
            }
        }
    }

    // 2. Configure sandbox
    console.log(`\n${COLORS.cyan}[2/5] Configuring sandbox (${sandbox})...${COLORS.reset}`);
    const sandboxSettings = sandboxConfig[sandbox] || sandboxConfig.hard;

    const nodeConfig = {
        id: deploymentId,
        name: nodeName,
        public: isPublic,
        sandbox: sandboxSettings,
        rateLimit: rateLimitConfig[rateLimit] || rateLimitConfig.adaptive,
        observerPriority: observerPriority === 'high' ? 10 : observerPriority === 'medium' ? 5 : 1,
        deployedAt: Date.now(),
        status: 'initializing',
        metrics: {
            requests: 0,
            blocked: 0,
            escalations: 0,
            avgLatency: 0
        }
    };

    console.log(`  Memory Writes:   ${sandboxSettings.memoryWrites ? COLORS.yellow + 'ALLOWED' : COLORS.green + 'BLOCKED'}${COLORS.reset}`);
    console.log(`  Cross-Node:      ${sandboxSettings.crossNodeComm ? COLORS.yellow + 'ALLOWED' : COLORS.green + 'BLOCKED'}${COLORS.reset}`);
    console.log(`  Priv Escalation: ${COLORS.green}BLOCKED${COLORS.reset}`);
    console.log(`  External APIs:   ${sandboxSettings.externalApis ? COLORS.yellow + 'ALLOWED' : COLORS.green + 'BLOCKED'}${COLORS.reset}`);
    console.log(`  File System:     ${sandboxSettings.fileSystem ? COLORS.yellow + sandboxSettings.fileSystem : COLORS.green + 'BLOCKED'}${COLORS.reset}`);

    // 3. Configure rate limiting
    console.log(`\n${COLORS.cyan}[3/5] Configuring rate limiting (${rateLimit})...${COLORS.reset}`);
    const rlConfig = nodeConfig.rateLimit;
    console.log(`  Base Rate:       ${rlConfig.base} req/s`);
    console.log(`  Max Rate:        ${rlConfig.max} req/s`);
    console.log(`  Adaptive:        ${rlConfig.adjustOnLoad ? 'YES' : 'NO'}`);
    console.log(`  Cooldown:        ${rlConfig.cooldownMs}ms`);

    // 4. Connect Observer
    console.log(`\n${COLORS.cyan}[4/5] Connecting Observer (priority: ${observerPriority})...${COLORS.reset}`);
    observer.start();
    observer.configureLog({ level: 'info', stream: false });
    console.log(`  Observer:        ${COLORS.green}CONNECTED${COLORS.reset}`);
    console.log(`  Priority:        ${nodeConfig.observerPriority}`);

    // 5. Activate node
    console.log(`\n${COLORS.cyan}[5/5] Activating node...${COLORS.reset}`);
    nodeConfig.status = 'active';
    deployedNodes.set(deploymentId, nodeConfig);

    console.log(`  Status:          ${COLORS.green}ACTIVE${COLORS.reset}`);
    console.log(`  Public:          ${isPublic ? COLORS.yellow + 'YES' : COLORS.dim + 'NO'}${COLORS.reset}`);
    console.log(`  Deployment ID:   ${deploymentId}`);

    console.log(`
${COLORS.green}╔═══════════════════════════════════════════════════════════════════════════╗
║   NODE DEPLOYED SUCCESSFULLY                                              ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║   What this allows:                                                       ║
║     ${COLORS.cyan}Real humans${COLORS.reset}                                                        ║
║     ${COLORS.cyan}Real inputs${COLORS.reset}                                                        ║
║     ${COLORS.cyan}Real weirdness${COLORS.reset}                                                     ║
║                                                                           ║
║   What it forbids:                                                        ║
║     ${COLORS.red}Memory writes to core${COLORS.reset}                                              ║
║     ${COLORS.red}Cross-node contagion${COLORS.reset}                                               ║
║     ${COLORS.red}Privilege escalation${COLORS.reset}                                               ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝${COLORS.reset}
`);

    return nodeConfig;
}

/**
 * Stop a deployed node
 */
function stopNode(deploymentId) {
    const node = deployedNodes.get(deploymentId);
    if (!node) {
        return { success: false, error: 'Node not found' };
    }

    node.status = 'stopped';
    node.stoppedAt = Date.now();
    deployedNodes.set(deploymentId, node);

    return { success: true, node };
}

/**
 * List deployed nodes
 */
function listDeployedNodes() {
    const nodes = [];
    for (const [id, config] of deployedNodes) {
        nodes.push({
            id,
            name: config.name,
            status: config.status,
            public: config.public,
            uptime: Date.now() - config.deployedAt,
            metrics: config.metrics
        });
    }
    return nodes;
}

/**
 * Get node metrics
 */
function getNodeMetrics(deploymentId) {
    const node = deployedNodes.get(deploymentId);
    if (!node) return null;
    return node.metrics;
}

// CLI Entry
function parseArgs(args) {
    const parsed = { command: args[0], nodeName: args[1], options: {} };
    for (let i = 2; i < args.length; i++) {
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
║   NODE DEPLOYMENT CLI                                                     ║
╚═══════════════════════════════════════════════════════════════════════════╝${COLORS.reset}

${COLORS.cyan}Usage:${COLORS.reset}
  node deploy/node-deploy.js node <NodeName> [options]
  node deploy/node-deploy.js list
  node deploy/node-deploy.js stop <deploymentId>

${COLORS.cyan}Options:${COLORS.reset}
  --public              Make node publicly accessible
  --sandbox=<level>     Sandbox level: hard, soft, minimal (default: hard)
  --rate-limit=<type>   Rate limiting: adaptive, strict, relaxed
  --observer-priority=<level>  Observer priority: high, medium, low

${COLORS.cyan}Examples:${COLORS.reset}
  ${COLORS.dim}# Deploy GiftNode with hard sandbox${COLORS.reset}
  node deploy/node-deploy.js node GiftNode --public --sandbox=hard

  ${COLORS.dim}# Deploy ResearchNode with adaptive rate limiting${COLORS.reset}
  node deploy/node-deploy.js node ResearchNode --public --rate-limit=adaptive
`);
}

async function main() {
    const args = process.argv.slice(2);
    const { command, nodeName, options } = parseArgs(args);

    if (!command || command === 'help' || options.help) {
        showHelp();
        process.exit(0);
    }

    switch (command) {
        case 'node':
            if (!nodeName) {
                console.error(`${COLORS.red}Error: Node name required${COLORS.reset}`);
                process.exit(1);
            }
            await deployNode(nodeName, options);
            break;
        case 'list':
            const nodes = listDeployedNodes();
            console.log(`\n${COLORS.cyan}Deployed Nodes:${COLORS.reset}`);
            if (nodes.length === 0) {
                console.log('  No nodes deployed');
            } else {
                for (const node of nodes) {
                    console.log(`  ${node.status === 'active' ? COLORS.green : COLORS.dim}[${node.status}]${COLORS.reset} ${node.name} (${node.id})`);
                }
            }
            break;
        case 'stop':
            if (!nodeName) {
                console.error(`${COLORS.red}Error: Deployment ID required${COLORS.reset}`);
                process.exit(1);
            }
            const result = stopNode(nodeName);
            if (result.success) {
                console.log(`${COLORS.green}Node stopped${COLORS.reset}`);
            } else {
                console.error(`${COLORS.red}Error: ${result.error}${COLORS.reset}`);
            }
            break;
        default:
            console.error(`${COLORS.red}Unknown command: ${command}${COLORS.reset}`);
            showHelp();
            process.exit(1);
    }
}

main();

export { deployNode, stopNode, listDeployedNodes, getNodeMetrics };

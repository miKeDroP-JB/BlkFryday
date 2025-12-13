#!/usr/bin/env node
/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   SAFETY LOCKS CLI                                                        ║
 * ║   Usage: ./core/locks/freeze --scope=memory,observer,amoeba               ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { locks } from './index.js';

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
║   SAFETY LOCKS - Runtime Invariant Protection                             ║
╚═══════════════════════════════════════════════════════════════════════════╝${COLORS.reset}

${COLORS.cyan}Usage:${COLORS.reset}
  node core/locks/cli.js <command> [options]

${COLORS.cyan}Commands:${COLORS.reset}
  ${COLORS.bright}freeze${COLORS.reset}     Freeze specified scopes
  ${COLORS.bright}unfreeze${COLORS.reset}   Unfreeze specified scopes
  ${COLORS.bright}status${COLORS.reset}     Show current lock status

${COLORS.cyan}Options:${COLORS.reset}
  --scope=<list>    Comma-separated scopes: memory, observer, amoeba

${COLORS.cyan}Examples:${COLORS.reset}
  ${COLORS.dim}# Freeze all invariants${COLORS.reset}
  node core/locks/cli.js freeze --scope=memory,observer,amoeba

  ${COLORS.dim}# Check status${COLORS.reset}
  node core/locks/cli.js status

${COLORS.cyan}What Freezing Does:${COLORS.reset}
  ${COLORS.yellow}memory${COLORS.reset}    -> Becomes append-only (no overwrites/deletes)
  ${COLORS.yellow}observer${COLORS.reset}  -> Authority escalates above all nodes
  ${COLORS.yellow}amoeba${COLORS.reset}    -> Switches to proactive mutation mode
`);
}

async function runFreeze(options) {
    const scopes = options.scope ? options.scope.split(',') : ['memory', 'observer', 'amoeba'];

    console.log(`
${COLORS.magenta}╔═══════════════════════════════════════════════════════════════════════════╗
║   ENGAGING SAFETY LOCKS                                                   ║
╚═══════════════════════════════════════════════════════════════════════════╝${COLORS.reset}
`);

    console.log(`${COLORS.cyan}Freezing scopes:${COLORS.reset} ${scopes.join(', ')}\n`);

    const result = locks.freeze(scopes);

    for (const scope of result.frozen) {
        let effect = '';
        switch (scope) {
            case 'memory':
                effect = 'APPEND-ONLY mode engaged';
                break;
            case 'observer':
                effect = 'Authority ELEVATED above all nodes';
                break;
            case 'amoeba':
                effect = 'PROACTIVE mutation mode engaged';
                break;
        }
        console.log(`  ${COLORS.green}[FROZEN]${COLORS.reset} ${scope.padEnd(12)} -> ${effect}`);
    }

    for (const scope of result.skipped) {
        console.log(`  ${COLORS.dim}[SKIP]${COLORS.reset}   ${scope.padEnd(12)} -> Already frozen`);
    }

    console.log(`
${COLORS.green}Safety locks engaged.${COLORS.reset}
${COLORS.dim}The system will bend, not break.${COLORS.reset}
`);

    return result;
}

async function runUnfreeze(options) {
    const scopes = options.scope ? options.scope.split(',') : ['memory', 'observer', 'amoeba'];

    console.log(`
${COLORS.yellow}╔═══════════════════════════════════════════════════════════════════════════╗
║   RELEASING SAFETY LOCKS                                                  ║
╚═══════════════════════════════════════════════════════════════════════════╝${COLORS.reset}
`);

    const result = locks.unfreeze(scopes);

    for (const scope of result.unfrozen) {
        console.log(`  ${COLORS.yellow}[UNFROZEN]${COLORS.reset} ${scope}`);
    }

    console.log(`
${COLORS.yellow}Safety locks released.${COLORS.reset}
`);

    return result;
}

async function runStatus() {
    const status = locks.getStatus();

    console.log(`
${COLORS.magenta}╔═══════════════════════════════════════════════════════════════════════════╗
║   SAFETY LOCKS STATUS                                                     ║
╚═══════════════════════════════════════════════════════════════════════════╝${COLORS.reset}
`);

    console.log(`${COLORS.cyan}Overall:${COLORS.reset}`);
    console.log(`  Frozen:      ${status.frozen ? COLORS.green + 'YES' : COLORS.dim + 'NO'}${COLORS.reset}`);
    if (status.frozenAt) {
        console.log(`  Since:       ${new Date(status.frozenAt).toISOString()}`);
        console.log(`  Uptime:      ${Math.round(status.uptime / 1000)}s`);
    }

    console.log(`\n${COLORS.cyan}Scopes:${COLORS.reset}`);
    for (const [scope, frozen] of Object.entries(status.scopes)) {
        const icon = frozen ? COLORS.green + '[LOCKED]  ' : COLORS.dim + '[OPEN]    ';
        console.log(`  ${icon}${COLORS.reset} ${scope}`);
    }

    console.log(`\n${COLORS.cyan}Authority Levels:${COLORS.reset}`);
    console.log(`  Observer:    ${status.authority.observer} ${status.authority.observer > 1 ? COLORS.green + '(ELEVATED)' : ''}${COLORS.reset}`);
    console.log(`  Nodes:       ${status.authority.nodes}`);

    console.log(`\n${COLORS.cyan}Modes:${COLORS.reset}`);
    console.log(`  Memory:      ${status.mode.memory === 'append-only' ? COLORS.yellow + 'APPEND-ONLY' : 'read-write'}${COLORS.reset}`);
    console.log(`  Amoeba:      ${status.mode.amoeba === 'proactive' ? COLORS.green + 'PROACTIVE' : 'reactive'}${COLORS.reset}`);

    console.log(`\n${COLORS.cyan}Audit:${COLORS.reset}`);
    console.log(`  Violations:  ${status.violations > 0 ? COLORS.red + status.violations : COLORS.green + '0'}${COLORS.reset}`);
    console.log(`  Write Log:   ${status.writeLogSize} entries`);

    if (status.recentViolations.length > 0) {
        console.log(`\n${COLORS.red}Recent Violations:${COLORS.reset}`);
        for (const v of status.recentViolations) {
            console.log(`  - ${v.type}: ${v.operation} at ${new Date(v.timestamp).toISOString()}`);
        }
    }
}

// Main
async function main() {
    const args = process.argv.slice(2);
    const { command, options } = parseArgs(args);

    if (!command || command === 'help' || options.help) {
        showHelp();
        process.exit(0);
    }

    switch (command) {
        case 'freeze':
            await runFreeze(options);
            break;
        case 'unfreeze':
            await runUnfreeze(options);
            break;
        case 'status':
            await runStatus();
            break;
        default:
            console.error(`${COLORS.red}Unknown command: ${command}${COLORS.reset}`);
            showHelp();
            process.exit(1);
    }
}

main();

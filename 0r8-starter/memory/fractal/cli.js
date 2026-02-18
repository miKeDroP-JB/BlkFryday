#!/usr/bin/env node
/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   FRACTAL MEMORY CLI                                                      ║
 * ║   Usage: ./memory/fractal/ingest --source=GiftNode --mode=shadow          ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { fractalMemory } from './index.js';

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
║   FRACTAL MEMORY - Shadow Learning System                                 ║
╚═══════════════════════════════════════════════════════════════════════════╝${COLORS.reset}

${COLORS.cyan}Usage:${COLORS.reset}
  node memory/fractal/cli.js <command> [options]

${COLORS.cyan}Commands:${COLORS.reset}
  ${COLORS.bright}ingest${COLORS.reset}     Ingest data into shadow memory
  ${COLORS.bright}status${COLORS.reset}     Show memory status
  ${COLORS.bright}pending${COLORS.reset}    Show patterns pending review
  ${COLORS.bright}promote${COLORS.reset}    Promote a pattern to prime memory
  ${COLORS.bright}reject${COLORS.reset}     Reject a pattern
  ${COLORS.bright}auto${COLORS.reset}       Auto-promote ready patterns

${COLORS.cyan}Ingest Options:${COLORS.reset}
  --source=<name>           Source node name
  --mode=<mode>             Mode: shadow, prime (default: shadow)
  --review-threshold=<t>    Threshold: auto, strict, relaxed

${COLORS.cyan}Examples:${COLORS.reset}
  ${COLORS.dim}# Ingest from GiftNode in shadow mode${COLORS.reset}
  node memory/fractal/cli.js ingest --source=GiftNode --mode=shadow

  ${COLORS.dim}# Check pending patterns${COLORS.reset}
  node memory/fractal/cli.js pending

  ${COLORS.dim}# Promote a specific pattern${COLORS.reset}
  node memory/fractal/cli.js promote --id=pat-123456
`);
}

async function runIngest(options) {
    const source = options.source || 'unknown';
    const mode = options.mode || 'shadow';
    const reviewThreshold = options['review-threshold'] || 'auto';

    console.log(`
${COLORS.magenta}╔═══════════════════════════════════════════════════════════════════════════╗
║   FRACTAL MEMORY INGEST                                                   ║
╚═══════════════════════════════════════════════════════════════════════════╝${COLORS.reset}
`);

    console.log(`${COLORS.cyan}Configuration:${COLORS.reset}`);
    console.log(`  Source:           ${source}`);
    console.log(`  Mode:             ${mode === 'shadow' ? COLORS.green + 'SHADOW' : COLORS.yellow + 'PRIME'}${COLORS.reset}`);
    console.log(`  Review Threshold: ${reviewThreshold}`);

    // Simulate ingesting some test patterns
    const testPatterns = [
        { type: 'query', content: 'User asked about gifts' },
        { type: 'response', content: 'Suggested creative gift ideas' },
        { type: 'feedback', content: 'User liked the suggestion' }
    ];

    console.log(`\n${COLORS.cyan}Ingesting patterns...${COLORS.reset}`);

    for (const pattern of testPatterns) {
        const result = fractalMemory.ingest(source, pattern, { mode, reviewThreshold });
        const icon = result.success ? COLORS.green + '[OK]' : COLORS.red + '[ERR]';
        console.log(`  ${icon}${COLORS.reset} ${result.action}: ${pattern.type}`);
    }

    const status = fractalMemory.getStatus();
    console.log(`
${COLORS.cyan}Memory Status:${COLORS.reset}
  Shadow:   ${status.shadow.size} patterns
  Prime:    ${status.prime.size} patterns
  Pending:  ${status.pending} awaiting review
`);
}

async function runStatus() {
    const status = fractalMemory.getStatus();

    console.log(`
${COLORS.magenta}╔═══════════════════════════════════════════════════════════════════════════╗
║   FRACTAL MEMORY STATUS                                                   ║
╚═══════════════════════════════════════════════════════════════════════════╝${COLORS.reset}
`);

    console.log(`${COLORS.cyan}Memory Banks:${COLORS.reset}`);
    console.log(`  Prime Memory:   ${status.prime.size} patterns (production)`);
    console.log(`  Shadow Memory:  ${status.shadow.size} patterns (learning)`);

    console.log(`\n${COLORS.cyan}Pipeline:${COLORS.reset}`);
    console.log(`  Pending Review: ${status.pending}`);

    console.log(`\n${COLORS.cyan}Metrics:${COLORS.reset}`);
    console.log(`  Ingested:       ${status.metrics.ingested}`);
    console.log(`  Promoted:       ${COLORS.green}${status.metrics.promoted}${COLORS.reset}`);
    console.log(`  Rejected:       ${COLORS.red}${status.metrics.rejected}${COLORS.reset}`);
}

async function runPending() {
    const pending = fractalMemory.getPendingPatterns();

    console.log(`
${COLORS.magenta}╔═══════════════════════════════════════════════════════════════════════════╗
║   PATTERNS PENDING REVIEW                                                 ║
╚═══════════════════════════════════════════════════════════════════════════╝${COLORS.reset}
`);

    if (pending.length === 0) {
        console.log(`  ${COLORS.dim}No patterns pending review${COLORS.reset}`);
        return;
    }

    console.log(`${COLORS.cyan}ID${COLORS.reset}                            | Source          | Occ | Conf  | Status`);
    console.log('─'.repeat(80));

    for (const p of pending) {
        const conf = (p.confidence * 100).toFixed(0) + '%';
        const statusColor = p.status === 'ready-for-promotion' ? COLORS.green : COLORS.dim;
        console.log(`${p.id.padEnd(30)} | ${(p.source || 'unknown').padEnd(15)} | ${String(p.occurrences).padStart(3)} | ${conf.padStart(5)} | ${statusColor}${p.status}${COLORS.reset}`);
    }
}

async function runPromote(options) {
    const patternId = options.id;

    if (!patternId) {
        console.error(`${COLORS.red}Error: Pattern ID required (--id=pat-xxx)${COLORS.reset}`);
        process.exit(1);
    }

    const result = fractalMemory.promote(patternId);

    if (result.success) {
        console.log(`${COLORS.green}Pattern promoted to prime memory${COLORS.reset}`);
        console.log(`  ID: ${patternId}`);
    } else {
        console.error(`${COLORS.red}Error: ${result.error}${COLORS.reset}`);
    }
}

async function runReject(options) {
    const patternId = options.id;
    const reason = options.reason || 'manual';

    if (!patternId) {
        console.error(`${COLORS.red}Error: Pattern ID required (--id=pat-xxx)${COLORS.reset}`);
        process.exit(1);
    }

    const result = fractalMemory.reject(patternId, reason);

    if (result.success) {
        console.log(`${COLORS.yellow}Pattern rejected${COLORS.reset}`);
        console.log(`  ID: ${patternId}`);
        console.log(`  Reason: ${reason}`);
    } else {
        console.error(`${COLORS.red}Error: ${result.error}${COLORS.reset}`);
    }
}

async function runAuto() {
    console.log(`${COLORS.cyan}Auto-promoting ready patterns...${COLORS.reset}`);

    const result = fractalMemory.autoPromote();

    console.log(`${COLORS.green}Promoted ${result.promoted} patterns${COLORS.reset}`);
}

async function main() {
    const args = process.argv.slice(2);
    const { command, options } = parseArgs(args);

    if (!command || command === 'help' || options.help) {
        showHelp();
        process.exit(0);
    }

    switch (command) {
        case 'ingest':
            await runIngest(options);
            break;
        case 'status':
            await runStatus();
            break;
        case 'pending':
            await runPending();
            break;
        case 'promote':
            await runPromote(options);
            break;
        case 'reject':
            await runReject(options);
            break;
        case 'auto':
            await runAuto();
            break;
        default:
            console.error(`${COLORS.red}Unknown command: ${command}${COLORS.reset}`);
            showHelp();
            process.exit(1);
    }
}

main();

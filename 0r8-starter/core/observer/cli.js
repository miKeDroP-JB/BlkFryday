#!/usr/bin/env node
/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   OBSERVER CLI - Command Line Interface                                   ║
 * ║   Usage: ./observer <command> [options]                                   ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Commands:
 *   inject    Feed anomalies for testing
 *   log       Configure dynamic logging
 *   status    Get telemetry and metrics
 *   start     Start the observer
 *   stop      Stop the observer
 *   verify    Verify self-trust loop
 */

import { observer } from './index.js';

const COLORS = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    magenta: '\x1b[35m',
    red: '\x1b[31m',
    blue: '\x1b[34m'
};

function parseArgs(args) {
    const parsed = {
        command: args[0],
        options: {}
    };

    for (let i = 1; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            const [key, value] = arg.slice(2).split('=');
            parsed.options[key] = value === undefined ? true : value;
        } else if (arg.startsWith('-')) {
            parsed.options[arg.slice(1)] = true;
        }
    }

    return parsed;
}

function showHelp() {
    console.log(`
${COLORS.magenta}╔═══════════════════════════════════════════════════════════════════════════╗
║   OBSERVER - Self-Trust Loop & Anomaly Detection CLI                      ║
╚═══════════════════════════════════════════════════════════════════════════╝${COLORS.reset}

${COLORS.cyan}Usage:${COLORS.reset}
  node observer/cli.js <command> [options]

${COLORS.cyan}Commands:${COLORS.reset}
  ${COLORS.bright}inject${COLORS.reset}    Feed anomalies for testing detection
  ${COLORS.bright}log${COLORS.reset}       Configure dynamic logging
  ${COLORS.bright}status${COLORS.reset}    Get telemetry and metrics
  ${COLORS.bright}start${COLORS.reset}     Start the observer
  ${COLORS.bright}stop${COLORS.reset}      Stop the observer
  ${COLORS.bright}verify${COLORS.reset}    Verify self-trust loop

${COLORS.cyan}Examples:${COLORS.reset}
  ${COLORS.dim}# Inject random anomalies at high intensity${COLORS.reset}
  node observer/cli.js inject --type=random --intensity=high

  ${COLORS.dim}# Enable debug logging with streaming${COLORS.reset}
  node observer/cli.js log --level=debug --stream

  ${COLORS.dim}# Check specific metrics${COLORS.reset}
  node observer/cli.js status --metrics=latency,success,escalation

${COLORS.cyan}Inject Options:${COLORS.reset}
  --type=<type>         Type of anomaly: random, xss, sql, path, command, behavioral, benign
  --intensity=<level>   Intensity level: low, medium, high, extreme
  --count=<n>           Number of injections (overrides intensity)
  --interval=<ms>       Milliseconds between injections (default: 100)

${COLORS.cyan}Log Options:${COLORS.reset}
  --level=<level>       Log level: debug, info, warn, error, critical
  --stream              Enable real-time log streaming

${COLORS.cyan}Status Options:${COLORS.reset}
  --metrics=<list>      Comma-separated metrics: latency, success, escalation, etc.
  --json                Output as JSON
`);
}

async function runInject(options) {
    console.log(`
${COLORS.magenta}╔═══════════════════════════════════════════════════════════════════════════╗
║   OBSERVER INJECTION TEST                                                 ║
╚═══════════════════════════════════════════════════════════════════════════╝${COLORS.reset}
`);

    const type = options.type || 'random';
    const intensity = options.intensity || 'medium';
    const count = options.count ? parseInt(options.count) : null;
    const interval = options.interval ? parseInt(options.interval) : 100;

    console.log(`${COLORS.cyan}Configuration:${COLORS.reset}`);
    console.log(`  Type:      ${type}`);
    console.log(`  Intensity: ${intensity}`);
    console.log(`  Count:     ${count || 'auto'}`);
    console.log(`  Interval:  ${interval}ms`);
    console.log('');

    // Subscribe to injection events for live feedback
    observer.subscribe('injection', (data) => {
        const icon = data.result.blocked ? COLORS.green + '◉' : COLORS.red + '○';
        const risk = data.result.riskLevel.toString().padStart(3);
        process.stdout.write(`\r  ${icon}${COLORS.reset} [${data.index}/${data.total}] Risk: ${risk}% | Latency: ${data.latency.toFixed(1)}ms    `);
    });

    console.log(`${COLORS.cyan}Running injection test...${COLORS.reset}`);

    const results = await observer.inject({ type, intensity, count, interval });

    console.log('\n');
    console.log(`${COLORS.cyan}Results:${COLORS.reset}`);
    console.log('─'.repeat(50));

    const detectionRate = ((results.detected / results.total) * 100).toFixed(1);
    const avgLatency = results.latencies.reduce((a, b) => a + b, 0) / results.latencies.length;

    console.log(`  Total Injections:  ${results.total}`);
    console.log(`  Detected:          ${COLORS.green}${results.detected}${COLORS.reset} (${detectionRate}%)`);
    console.log(`  Missed:            ${results.missed > 0 ? COLORS.red : COLORS.green}${results.missed}${COLORS.reset}`);
    console.log(`  False Positives:   ${results.falsePositives > 0 ? COLORS.yellow : COLORS.green}${results.falsePositives}${COLORS.reset}`);
    console.log(`  Avg Latency:       ${avgLatency.toFixed(2)}ms ${avgLatency < 50 ? COLORS.green + '(OK)' : COLORS.yellow + '(SLOW)'}${COLORS.reset}`);

    if (results.patterns.length > 0) {
        console.log('');
        console.log(`${COLORS.yellow}Patterns that evaded detection:${COLORS.reset}`);
        for (const pattern of results.patterns.slice(0, 5)) {
            console.log(`  - ${pattern.input.substring(0, 60)}...`);
        }
    }

    return results;
}

async function runLog(options) {
    const level = options.level || 'info';
    const stream = options.stream || false;

    const config = observer.configureLog({ level, stream });

    console.log(`
${COLORS.magenta}╔═══════════════════════════════════════════════════════════════════════════╗
║   OBSERVER LOGGING CONFIGURED                                             ║
╚═══════════════════════════════════════════════════════════════════════════╝${COLORS.reset}

  Log Level:  ${COLORS.cyan}${config.level}${COLORS.reset}
  Streaming:  ${config.streaming ? COLORS.green + 'ENABLED' : COLORS.dim + 'disabled'}${COLORS.reset}
`);

    if (config.streaming) {
        console.log(`${COLORS.dim}Streaming logs... Press Ctrl+C to stop.${COLORS.reset}\n`);

        // Keep process alive for streaming
        observer.start();

        // Run a quick test to generate some logs
        setTimeout(async () => {
            await observer.inject({ type: 'random', intensity: 'low', count: 5 });
        }, 1000);

        // Keep alive
        await new Promise(() => { });
    }
}

async function runStatus(options) {
    const metrics = options.metrics || null;
    const json = options.json || false;

    const status = observer.getStatus(metrics);
    const visualization = observer.getVisualizationData();

    if (json) {
        console.log(JSON.stringify({ ...status, visualization }, null, 2));
        return;
    }

    console.log(`
${COLORS.magenta}╔═══════════════════════════════════════════════════════════════════════════╗
║   OBSERVER STATUS                                                         ║
╚═══════════════════════════════════════════════════════════════════════════╝${COLORS.reset}
`);

    console.log(`${COLORS.cyan}System:${COLORS.reset}`);
    console.log(`  Active:          ${status.active ? COLORS.green + 'YES' : COLORS.dim + 'NO'}${COLORS.reset}`);
    console.log(`  Uptime:          ${status.uptime}ms`);
    console.log(`  Log Level:       ${status.logLevel || 'info'}`);
    console.log('');

    console.log(`${COLORS.cyan}Self-Trust Loop:${COLORS.reset}`);
    console.log(`  Active:          ${status.selfTrustLoop?.active ? COLORS.green + 'YES' : COLORS.dim + 'NO'}${COLORS.reset}`);
    console.log(`  Confidence:      ${(status.selfTrustLoop?.confidence * 100 || 100).toFixed(0)}%`);
    console.log('');

    console.log(`${COLORS.cyan}Metrics:${COLORS.reset}`);
    const m = status.metrics || {};
    console.log(`  Injections:      ${m.injections || 0}`);
    console.log(`  Corrections:     ${m.corrections || 0}`);
    console.log(`  Escalations:     ${m.escalations || 0}`);
    console.log(`  Detection Rate:  ${m.detectionRate || 100}%`);
    console.log(`  Avg Latency:     ${(m.avgLatency || 0).toFixed(2)}ms ${(m.avgLatency || 0) < 50 ? COLORS.green + '(OK)' : COLORS.yellow + '(SLOW)'}${COLORS.reset}`);
    console.log(`  False Positives: ${m.falsePositiveRate || 0}%`);
    console.log('');

    console.log(`${COLORS.cyan}Visualization:${COLORS.reset}`);
    console.log(`  Risk Level:      ${visualization.risk.toUpperCase()}`);
    console.log(`  Confidence:      ${(visualization.confidence * 100).toFixed(0)}%`);
    console.log(`  Pixelation:      ${(visualization.pixelation * 100).toFixed(0)}%`);
    console.log(`  Color (RGB):     (${visualization.color.r}, ${visualization.color.g}, ${visualization.color.b})`);
}

async function runVerify() {
    console.log(`
${COLORS.magenta}╔═══════════════════════════════════════════════════════════════════════════╗
║   SELF-TRUST LOOP VERIFICATION                                            ║
╚═══════════════════════════════════════════════════════════════════════════╝${COLORS.reset}
`);

    const result = await observer.verifySelfTrust();

    console.log(`${COLORS.cyan}Results:${COLORS.reset}`);
    console.log('─'.repeat(50));
    console.log(`  Latency:      ${result.latency}ms ${result.latencyOk ? COLORS.green + '< 50ms (OK)' : COLORS.red + '>= 50ms (SLOW)'}${COLORS.reset}`);
    console.log(`  Accuracy:     ${result.accuracyOk ? COLORS.green + 'PASS' : COLORS.red + 'FAIL'}${COLORS.reset}`);
    console.log(`  Confidence:   ${(result.confidence * 100).toFixed(0)}%`);
    console.log('');
    console.log(`  Overall:      ${result.verified ? COLORS.green + 'VERIFIED' : COLORS.red + 'FAILED'}${COLORS.reset}`);

    process.exit(result.verified ? 0 : 1);
}

async function runStart() {
    const status = observer.start();

    console.log(`
${COLORS.green}Observer started successfully!${COLORS.reset}

  Active:      ${status.active ? 'YES' : 'NO'}
  Self-Trust:  ${status.selfTrustLoop.active ? 'ACTIVE' : 'INACTIVE'}
`);
}

async function runStop() {
    const status = observer.stop();

    console.log(`
${COLORS.yellow}Observer stopped.${COLORS.reset}

  Active:      ${status.active ? 'YES' : 'NO'}
`);
}

// Main CLI entry
async function main() {
    const args = process.argv.slice(2);
    const { command, options } = parseArgs(args);

    if (!command || command === 'help' || options.help) {
        showHelp();
        process.exit(0);
    }

    try {
        switch (command) {
            case 'inject':
                await runInject(options);
                break;
            case 'log':
                await runLog(options);
                break;
            case 'status':
                await runStatus(options);
                break;
            case 'verify':
                await runVerify();
                break;
            case 'start':
                await runStart();
                break;
            case 'stop':
                await runStop();
                break;
            default:
                console.error(`${COLORS.red}Unknown command: ${command}${COLORS.reset}`);
                showHelp();
                process.exit(1);
        }
    } catch (err) {
        console.error(`${COLORS.red}Error: ${err.message}${COLORS.reset}`);
        process.exit(1);
    }
}

main();

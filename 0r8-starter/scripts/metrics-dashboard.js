#!/usr/bin/env node
/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   METRICS DASHBOARD - System Performance Monitor                          ║
 * ║   "Real-time visibility into the consciousness engine"                    ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Provides comprehensive metrics for:
 * - System resources (CPU, memory, uptime)
 * - Node health and routing statistics
 * - Security (Amoeba) metrics
 * - Avatar status
 * - Local router performance
 */

import { getStatus } from '../index.js';
import { amoebaSecurity } from '../core/amoeba-security.js';
import { getRoutingMetrics, listNodes } from '../core/module-router.js';
import { getRouterMetrics } from '../core/local-router.js';
import { twinAvatar } from '../avatars/twin-avatar.js';
import { spiritAnimal } from '../avatars/spirit-animal.js';
import os from 'os';

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

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);

    return parts.join(' ');
}

function bar(value, max, width = 20) {
    const filled = Math.round((value / max) * width);
    const empty = width - filled;
    const color = value / max > 0.9 ? COLORS.red :
        value / max > 0.7 ? COLORS.yellow : COLORS.green;
    return `${color}${'█'.repeat(filled)}${COLORS.dim}${'░'.repeat(empty)}${COLORS.reset}`;
}

async function collectMetrics() {
    const metrics = {
        timestamp: new Date().toISOString(),
        system: {},
        orb: {},
        security: {},
        routing: {},
        avatars: {},
        nodes: []
    };

    // System metrics
    const memUsed = os.totalmem() - os.freemem();
    const memTotal = os.totalmem();
    const cpus = os.cpus();
    const loadAvg = os.loadavg();

    metrics.system = {
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        uptime: os.uptime(),
        cpuCount: cpus.length,
        cpuModel: cpus[0]?.model || 'Unknown',
        loadAvg: loadAvg[0],
        memoryUsed: memUsed,
        memoryTotal: memTotal,
        memoryPercent: (memUsed / memTotal * 100).toFixed(1)
    };

    // ORB status
    const orbStatus = getStatus();
    const processMemory = process.memoryUsage();

    metrics.orb = {
        version: '1.0.0',
        uptime: orbStatus.uptime,
        requests: orbStatus.requests,
        heapUsed: processMemory.heapUsed,
        heapTotal: processMemory.heapTotal,
        external: processMemory.external,
        rss: processMemory.rss
    };

    // Security metrics
    metrics.security = amoebaSecurity.getMetrics();

    // Routing metrics
    const moduleRouting = getRoutingMetrics();
    const localRouting = getRouterMetrics();

    metrics.routing = {
        module: moduleRouting,
        local: localRouting
    };

    // Avatar status
    metrics.avatars = {
        twin: {
            name: twinAvatar.name,
            active: true
        },
        spirit: spiritAnimal.getSpirit()
    };

    // Node health
    const nodes = listNodes({ trusted: true });
    metrics.nodes = nodes.map(n => ({
        name: n.name,
        priority: n.priority,
        trustedOnly: n.trustedOnly
    }));

    return metrics;
}

async function displayDashboard(metrics) {
    console.clear();
    console.log(`
${COLORS.magenta}╔═══════════════════════════════════════════════════════════════════════════╗
║   ◈ ORBOS METRICS DASHBOARD                                               ║
║   ${new Date().toLocaleString().padEnd(71)}║
╚═══════════════════════════════════════════════════════════════════════════╝${COLORS.reset}
`);

    // System Section
    console.log(`${COLORS.cyan}┌─── SYSTEM ─────────────────────────────────────────────────────────────────┐${COLORS.reset}`);
    console.log(`│  Host: ${COLORS.bright}${metrics.system.hostname}${COLORS.reset} | ${metrics.system.platform}/${metrics.system.arch}`);
    console.log(`│  CPU:  ${metrics.system.cpuModel.substring(0, 40)}`);
    console.log(`│  Cores: ${metrics.system.cpuCount} | Load: ${metrics.system.loadAvg.toFixed(2)}`);
    console.log(`│  Uptime: ${formatUptime(metrics.system.uptime)}`);
    console.log(`│`);
    console.log(`│  Memory: ${bar(metrics.system.memoryUsed, metrics.system.memoryTotal)} ${metrics.system.memoryPercent}%`);
    console.log(`│          ${formatBytes(metrics.system.memoryUsed)} / ${formatBytes(metrics.system.memoryTotal)}`);
    console.log(`${COLORS.cyan}└─────────────────────────────────────────────────────────────────────────────┘${COLORS.reset}`);

    // ORB Section
    console.log(`\n${COLORS.cyan}┌─── ORB ENGINE ──────────────────────────────────────────────────────────────┐${COLORS.reset}`);
    console.log(`│  Version: ${COLORS.bright}${metrics.orb.version}${COLORS.reset} | Uptime: ${formatUptime(metrics.orb.uptime)}`);
    console.log(`│  Requests: ${metrics.orb.requests}`);
    console.log(`│`);
    console.log(`│  Heap:     ${bar(metrics.orb.heapUsed, metrics.orb.heapTotal)} ${(metrics.orb.heapUsed / metrics.orb.heapTotal * 100).toFixed(1)}%`);
    console.log(`│            ${formatBytes(metrics.orb.heapUsed)} / ${formatBytes(metrics.orb.heapTotal)}`);
    console.log(`│  RSS:      ${formatBytes(metrics.orb.rss)}`);
    console.log(`${COLORS.cyan}└─────────────────────────────────────────────────────────────────────────────┘${COLORS.reset}`);

    // Security Section
    console.log(`\n${COLORS.cyan}┌─── AMOEBA SECURITY ──────────────────────────────────────────────────────────┐${COLORS.reset}`);
    const sec = metrics.security;
    const blockRate = sec.scans > 0 ? ((sec.blocked / sec.scans) * 100).toFixed(1) : '0.0';
    console.log(`│  Total Scans:    ${COLORS.bright}${sec.scans}${COLORS.reset}`);
    console.log(`│  Blocked:        ${COLORS.red}${sec.blocked}${COLORS.reset} (${blockRate}%)`);
    console.log(`│  Anomalies:      ${COLORS.yellow}${sec.anomalies}${COLORS.reset}`);
    console.log(`│  Patterns Learned: ${COLORS.green}${sec.learned}${COLORS.reset}`);
    console.log(`${COLORS.cyan}└─────────────────────────────────────────────────────────────────────────────┘${COLORS.reset}`);

    // Routing Section
    console.log(`\n${COLORS.cyan}┌─── SMART ROUTING ────────────────────────────────────────────────────────────┐${COLORS.reset}`);
    const mod = metrics.routing.module;
    const local = metrics.routing.local;

    console.log(`│  ${COLORS.bright}Module Router:${COLORS.reset}`);
    console.log(`│    Total Routes: ${mod.totalRoutes} | Avg Latency: ${mod.avgLatency || 0}ms`);
    console.log(`│`);
    console.log(`│  ${COLORS.bright}Local-First Router:${COLORS.reset}`);
    console.log(`│    Ollama: ${local.ollamaAvailable ? COLORS.green + '● CONNECTED' : COLORS.red + '○ OFFLINE'}${COLORS.reset}`);

    const localCount = local.local || 0;
    const cheapCount = local.cheap || 0;
    const premiumCount = local.premium || 0;
    const totalRouted = localCount + cheapCount + premiumCount;

    if (totalRouted > 0) {
        console.log(`│    Local:   ${bar(localCount, totalRouted)} ${localCount} (${(localCount / totalRouted * 100).toFixed(0)}%)`);
        console.log(`│    Cheap:   ${bar(cheapCount, totalRouted, 20)} ${cheapCount} (${(cheapCount / totalRouted * 100).toFixed(0)}%)`);
        console.log(`│    Premium: ${bar(premiumCount, totalRouted, 20)} ${premiumCount} (${(premiumCount / totalRouted * 100).toFixed(0)}%)`);
    } else {
        console.log(`│    No routes processed yet`);
    }
    console.log(`${COLORS.cyan}└─────────────────────────────────────────────────────────────────────────────┘${COLORS.reset}`);

    // Nodes Section
    console.log(`\n${COLORS.cyan}┌─── ACTIVE NODES ─────────────────────────────────────────────────────────────┐${COLORS.reset}`);
    for (const node of metrics.nodes) {
        const icon = node.trustedOnly ? '🔐' : '🌐';
        console.log(`│  ${icon} ${node.name.padEnd(20)} | Priority: ${node.priority}`);
    }
    console.log(`${COLORS.cyan}└─────────────────────────────────────────────────────────────────────────────┘${COLORS.reset}`);

    // Avatars Section
    console.log(`\n${COLORS.cyan}┌─── AVATARS ──────────────────────────────────────────────────────────────────┐${COLORS.reset}`);
    console.log(`│  🔮 Twin Avatar: ${COLORS.bright}${metrics.avatars.twin.name}${COLORS.reset}`);
    console.log(`│  🦊 Spirit Animal: ${COLORS.bright}${metrics.avatars.spirit.name}${COLORS.reset} [${metrics.avatars.spirit.element}]`);
    console.log(`│     Strength: ${metrics.avatars.spirit.strength} | Wisdom: ${metrics.avatars.spirit.wisdom}`);
    console.log(`${COLORS.cyan}└─────────────────────────────────────────────────────────────────────────────┘${COLORS.reset}`);

    console.log(`\n${COLORS.dim}Last updated: ${metrics.timestamp}${COLORS.reset}`);
}

async function exportMetrics() {
    const metrics = await collectMetrics();
    console.log(JSON.stringify(metrics, null, 2));
    return metrics;
}

// Main execution
const args = process.argv.slice(2);

if (args.includes('--json')) {
    // JSON export mode
    exportMetrics().then(() => process.exit(0));
} else if (args.includes('--watch') || args.includes('-w')) {
    // Live watch mode
    const interval = parseInt(args.find(a => a.startsWith('--interval='))?.split('=')[1]) || 2000;

    console.log(`Starting metrics dashboard (refresh every ${interval}ms)...`);
    console.log('Press Ctrl+C to exit.\n');

    const update = async () => {
        try {
            const metrics = await collectMetrics();
            await displayDashboard(metrics);
        } catch (err) {
            console.error('Error collecting metrics:', err.message);
        }
    };

    update();
    setInterval(update, interval);
} else {
    // Single snapshot
    collectMetrics()
        .then(displayDashboard)
        .then(() => process.exit(0))
        .catch(err => {
            console.error('Error:', err.message);
            process.exit(1);
        });
}

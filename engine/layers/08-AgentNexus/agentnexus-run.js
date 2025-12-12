#!/usr/bin/env node
/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   AGENT NEXUS BOOT SCRIPT                                                 ║
 * ║   Launch the orchestrator with optional seed tasks                        ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Usage:
 *   node agentnexus-run.js                    # Start with defaults
 *   node agentnexus-run.js --seed             # Start and load seed tasks
 *   node agentnexus-run.js --scenario=morning_rush  # Run specific scenario
 *   node agentnexus-run.js --http=8777 --ws=8890   # Custom ports
 */

const orchestrator = require('./orchestrator');
const taskManager = require('./task_manager');
const revenueTracker = require('./revenue_tracker');
const exampleTasks = require('./example_tasks.json');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
    seed: args.includes('--seed'),
    scenario: args.find(a => a.startsWith('--scenario='))?.split('=')[1],
    httpPort: parseInt(args.find(a => a.startsWith('--http='))?.split('=')[1]) || 8777,
    wsPort: parseInt(args.find(a => a.startsWith('--ws='))?.split('=')[1]) || 8890,
    tickRate: parseInt(args.find(a => a.startsWith('--tick='))?.split('=')[1]) || 5000
};

console.log('');
console.log('╔═══════════════════════════════════════════════════════════════════════════╗');
console.log('║                                                                           ║');
console.log('║     █████╗  ██████╗ ███████╗███╗   ██╗████████╗                          ║');
console.log('║    ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝                          ║');
console.log('║    ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║                             ║');
console.log('║    ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║                             ║');
console.log('║    ██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║                             ║');
console.log('║    ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝                             ║');
console.log('║                                                                           ║');
console.log('║    ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗                           ║');
console.log('║    ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝                           ║');
console.log('║    ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗                           ║');
console.log('║    ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║                           ║');
console.log('║    ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║                           ║');
console.log('║    ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝                           ║');
console.log('║                                                                           ║');
console.log('║         THE PANTHEON STANDS READY                                        ║');
console.log('║                                                                           ║');
console.log('╚═══════════════════════════════════════════════════════════════════════════╝');
console.log('');

// Display current revenue status
const revenue = revenueTracker.getSummary();
console.log('┌─────────────────────────────────────────────────────────────────────────────┐');
console.log('│ REVENUE STATUS                                                              │');
console.log('├─────────────────────────────────────────────────────────────────────────────┤');
console.log(`│ Total:  $${revenue.total.toFixed(2).padStart(10)}  │  Today: $${revenue.today.toFixed(2).padStart(8)}  │  Week: $${revenue.week.toFixed(2).padStart(8)}  │`);
console.log('└─────────────────────────────────────────────────────────────────────────────┘');
console.log('');

// Load seed tasks if requested
if (options.seed) {
    console.log('[Boot] Loading seed tasks...');
    exampleTasks.seed_tasks.forEach(task => {
        taskManager.enqueue(task);
    });
    console.log(`[Boot] ${exampleTasks.seed_tasks.length} seed tasks loaded`);
}

// Load scenario if specified
if (options.scenario) {
    const scenario = exampleTasks.demo_scenarios[options.scenario];
    if (scenario) {
        console.log(`[Boot] Loading scenario: ${options.scenario}`);
        scenario.forEach(task => {
            taskManager.enqueue(task);
        });
        console.log(`[Boot] ${scenario.length} scenario tasks loaded`);
    } else {
        console.log(`[Boot] Unknown scenario: ${options.scenario}`);
        console.log(`[Boot] Available: ${Object.keys(exampleTasks.demo_scenarios).join(', ')}`);
    }
}

// Display queue status
const queueLength = taskManager.length();
if (queueLength > 0) {
    console.log(`[Boot] Queue has ${queueLength} pending tasks`);
}

// Start the orchestrator
console.log('');
console.log('[Boot] Starting orchestrator...');
console.log('');

orchestrator.start({
    httpPort: options.httpPort,
    wsPort: options.wsPort,
    tickRate: options.tickRate
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('');
    console.log('[Boot] Received SIGINT, shutting down...');
    orchestrator.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('');
    console.log('[Boot] Received SIGTERM, shutting down...');
    orchestrator.stop();
    process.exit(0);
});

// Interactive commands via stdin
if (process.stdin.isTTY) {
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('');
    console.log('Interactive mode enabled. Commands:');
    console.log('  status   - Show orchestrator status');
    console.log('  health   - Show health check');
    console.log('  queue    - Show queue status');
    console.log('  revenue  - Show revenue summary');
    console.log('  cycle <name> - Trigger revenue cycle (morning/afternoon/evening)');
    console.log('  seed     - Load seed tasks');
    console.log('  quit     - Shutdown');
    console.log('');

    rl.on('line', (line) => {
        const cmd = line.trim().toLowerCase();
        const parts = cmd.split(' ');

        switch (parts[0]) {
            case 'status':
                console.log(JSON.stringify(orchestrator.status(), null, 2));
                break;

            case 'health':
                console.log(JSON.stringify(orchestrator.healthCheck(), null, 2));
                break;

            case 'queue':
                const tasks = taskManager.list();
                console.log(`Queue: ${tasks.length} tasks`);
                tasks.slice(0, 10).forEach(t => {
                    console.log(`  [${t.priority}] ${t.agent}:${t.type} (${t.id})`);
                });
                if (tasks.length > 10) {
                    console.log(`  ... and ${tasks.length - 10} more`);
                }
                break;

            case 'revenue':
                console.log(JSON.stringify(revenueTracker.getSummary(), null, 2));
                break;

            case 'cycle':
                if (parts[1]) {
                    orchestrator.triggerCycle(parts[1]);
                } else {
                    console.log('Usage: cycle <morning|afternoon|evening>');
                }
                break;

            case 'seed':
                exampleTasks.seed_tasks.forEach(task => {
                    taskManager.enqueue(task);
                });
                console.log(`Loaded ${exampleTasks.seed_tasks.length} seed tasks`);
                break;

            case 'quit':
            case 'exit':
                console.log('Shutting down...');
                orchestrator.stop();
                rl.close();
                process.exit(0);
                break;

            default:
                if (cmd) {
                    console.log(`Unknown command: ${cmd}`);
                }
        }
    });
}

console.log('[Boot] Agent Nexus is now running');
console.log('[Boot] Press Ctrl+C to shutdown');

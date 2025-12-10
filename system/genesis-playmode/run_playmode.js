#!/usr/bin/env node
/**
 * 🎮 Genesis PlayMode - Full Immersive Mode Launcher
 * Human Node Integration Layer
 */

const path = require('path');
const { spawn } = require('child_process');

// Components
const HumanNode = require('./human_node');
const EmergenceOrchestrator = require('./engines/EmergenceOrchestrator');
const InfiniteSearch = require('./engines/InfiniteSearch');
const MemoryBank = require('./engines/memory_bank');
const Distiller = require('./engines/distiller');
const Fingerprint = require('./engines/fingerprint');

// WebSocket
let WebSocket;
try {
    WebSocket = require('ws');
} catch (e) {
    console.log('[PlayMode] ws not installed, run: npm install ws');
    WebSocket = null;
}

console.log('');
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║  🎮 Genesis PlayMode - Human Node Integration Layer           ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log('');

async function main() {
    // Initialize engines
    console.log('[PlayMode] 🔧 Initializing engines...');

    const orchestrator = new EmergenceOrchestrator({
        branchFactor: 5,
        beamWidth: 10
    });

    const search = new InfiniteSearch({
        beamWidth: 8,
        maxDepth: 15
    });

    const memory = new MemoryBank();
    const distiller = new Distiller();
    const fingerprint = new Fingerprint();

    console.log('[PlayMode] ✅ Engines initialized');

    // Initialize Human Node
    console.log('[PlayMode] 👤 Initializing Human Node...');

    const humanNode = new HumanNode({
        name: 'Player',
        wsPort: 8085,
        auraPort: 8084,
        updateInterval: 100
    });

    // Register engines with human node
    humanNode.registerEngine('orchestrator', orchestrator);
    humanNode.registerEngine('search', search);

    // Initialize WebSocket if available
    if (WebSocket) {
        humanNode.initWebSocket(WebSocket);
    }

    // Start human node
    humanNode.start();

    console.log('[PlayMode] ✅ Human Node started');
    console.log('');

    // Engine event handlers
    orchestrator.on('phase_start', (data) => {
        console.log(`[Orchestrator] Phase: ${data.phase}`);
    });

    orchestrator.on('branch_spawn', (data) => {
        // Broadcast to human node
        if (humanNode.clients) {
            humanNode.clients.forEach(client => {
                try {
                    if (client.readyState === 1) {
                        client.send(JSON.stringify({
                            type: 'branch_event',
                            eventType: 'spawn',
                            branch: data.branch,
                            message: `Branch spawned: ${data.branch.id}`
                        }));
                    }
                } catch (e) {}
            });
        }
    });

    // Run demo search loop
    console.log('[PlayMode] 🔄 Starting demo search loop...');

    let iteration = 0;
    const runIteration = async () => {
        iteration++;

        // Run orchestrator
        const branches = await orchestrator.run({ iteration });

        // Store results
        if (branches[0]) {
            const fp = fingerprint.compute({ iteration, score: branches[0].score });
            memory.store(fp, branches[0]);
            distiller.distill(branches[0], { type: 'demo' });
        }

        // Log status
        if (iteration % 10 === 0) {
            const state = humanNode.getState();
            console.log(`[PlayMode] Iteration ${iteration} | Energy: ${Math.round(state.tracker.metrics.energy)}% | Focus: ${Math.round(state.tracker.metrics.focus)}% | ${state.tracker.state.inFlow ? '🌊 FLOW' : ''}`);
        }

        // Continue loop
        setTimeout(runIteration, 1000 / orchestrator.humanParams.speed);
    };

    runIteration();

    // Start dashboard
    console.log('[PlayMode] 📊 Starting dashboard...');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('');
    console.log('  🎮 Genesis PlayMode ACTIVE!');
    console.log('');
    console.log('  Human Node WebSocket: ws://localhost:8085');
    console.log('  Aura WebSocket:       ws://localhost:8084');
    console.log('');
    console.log('  To start the dashboard:');
    console.log('    cd system/genesis-playmode');
    console.log('    npm install');
    console.log('    npm run dev');
    console.log('');
    console.log('  Press CTRL+C to stop');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('');

    // Handle shutdown
    process.on('SIGINT', () => {
        console.log('');
        console.log('[PlayMode] 🛑 Shutting down...');
        humanNode.stop();
        console.log('[PlayMode] ✅ Goodbye!');
        process.exit(0);
    });
}

main().catch(err => {
    console.error('[PlayMode] Error:', err);
    process.exit(1);
});

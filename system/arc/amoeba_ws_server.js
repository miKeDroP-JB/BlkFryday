/**
 * Amoeba WebSocket Live Dashboard Server
 * Real-time metrics streaming for Amoeba orchestrator
 */

const WebSocket = require('ws');

const PORT = process.env.AMOEBA_WS_PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

console.log(`🌐 Amoeba WS server running on ws://localhost:${PORT}`);

// Track connected clients
let clientCount = 0;

wss.on('connection', ws => {
    clientCount++;
    console.log(`🔗 Client connected (total: ${clientCount})`);

    ws.on('message', message => {
        try {
            const data = JSON.parse(message.toString());
            console.log('📥 Received:', data.type || 'unknown');

            // Handle client commands
            if (data.type === 'subscribe') {
                ws.subscriptions = data.channels || ['metrics', 'progress', 'results'];
                ws.send(JSON.stringify({ type: 'subscribed', channels: ws.subscriptions }));
            }
        } catch (e) {
            console.log('📥 Received raw:', message.toString());
        }
    });

    ws.on('close', () => {
        clientCount--;
        console.log(`🔌 Client disconnected (total: ${clientCount})`);
    });

    ws.on('error', err => {
        console.error('❌ WebSocket error:', err.message);
    });

    // Send welcome message
    ws.send(JSON.stringify({
        type: 'init',
        message: 'Welcome to Amoeba live dashboard!',
        timestamp: new Date().toISOString(),
        serverVersion: '4.0'
    }));
});

/**
 * Broadcast metrics to all connected clients
 * @param {Object} metrics - Metrics object to broadcast
 */
function broadcastMetrics(metrics) {
    const payload = JSON.stringify({
        type: 'metrics',
        data: metrics,
        timestamp: new Date().toISOString()
    });
    broadcast(payload, 'metrics');
}

/**
 * Broadcast progress updates
 * @param {Object} progress - Progress info (run, phase, percent, etc.)
 */
function broadcastProgress(progress) {
    const payload = JSON.stringify({
        type: 'progress',
        data: progress,
        timestamp: new Date().toISOString()
    });
    broadcast(payload, 'progress');
}

/**
 * Broadcast results when a run completes
 * @param {Object} results - Run results
 */
function broadcastResults(results) {
    const payload = JSON.stringify({
        type: 'results',
        data: results,
        timestamp: new Date().toISOString()
    });
    broadcast(payload, 'results');
}

/**
 * Broadcast branch events (spawn, complete, evolve)
 * @param {Object} event - Branch event data
 */
function broadcastBranchEvent(event) {
    const payload = JSON.stringify({
        type: 'branch',
        data: event,
        timestamp: new Date().toISOString()
    });
    broadcast(payload, 'branch');
}

/**
 * Internal broadcast helper with subscription filtering
 */
function broadcast(payload, channel) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            // Check subscription if client has one
            if (!client.subscriptions || client.subscriptions.includes(channel)) {
                client.send(payload);
            }
        }
    });
}

/**
 * Get current connection stats
 */
function getStats() {
    return {
        connectedClients: clientCount,
        serverPort: PORT,
        uptime: process.uptime()
    };
}

/**
 * Graceful shutdown
 */
function shutdown() {
    console.log('🛑 Shutting down Amoeba WS server...');
    wss.clients.forEach(client => {
        client.send(JSON.stringify({ type: 'shutdown', message: 'Server shutting down' }));
        client.close();
    });
    wss.close(() => {
        console.log('✅ WS server closed');
        process.exit(0);
    });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Export for orchestrator usage
module.exports = {
    broadcastMetrics,
    broadcastProgress,
    broadcastResults,
    broadcastBranchEvent,
    getStats,
    shutdown,
    wss
};

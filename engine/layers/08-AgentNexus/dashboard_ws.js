/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   DASHBOARD WEBSOCKET - Real-time Status Broadcasting                     ║
 * ║   Push live updates to connected dashboard clients                        ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const WebSocket = require('ws');

let wss = null;
let clientCount = 0;

/**
 * Start the WebSocket server
 * @param {number} port - Port to listen on (default: 8890)
 * @returns {WebSocket.Server}
 */
function start(port = 8890) {
    if (wss) {
        console.log('[DashboardWS] Already running');
        return wss;
    }

    wss = new WebSocket.Server({ port });

    wss.on('connection', (ws, req) => {
        clientCount++;
        const clientId = `client-${Date.now()}-${clientCount}`;
        ws.clientId = clientId;

        console.log(`[DashboardWS] Client connected: ${clientId} (total: ${wss.clients.size})`);

        // Send welcome message
        ws.send(JSON.stringify({
            type: 'welcome',
            clientId,
            ts: new Date().toISOString(),
            message: 'Connected to AgentNexus Dashboard'
        }));

        // Handle incoming messages from dashboard
        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data);
                handleClientMessage(ws, msg);
            } catch (e) {
                console.error('[DashboardWS] Invalid message:', e.message);
            }
        });

        ws.on('close', () => {
            console.log(`[DashboardWS] Client disconnected: ${clientId}`);
        });

        ws.on('error', (err) => {
            console.error(`[DashboardWS] Client error: ${err.message}`);
        });
    });

    wss.on('error', (err) => {
        console.error('[DashboardWS] Server error:', err.message);
    });

    console.log(`[DashboardWS] Listening on ws://localhost:${port}`);
    return wss;
}

/**
 * Handle messages from dashboard clients
 */
function handleClientMessage(ws, msg) {
    switch (msg.type) {
        case 'ping':
            ws.send(JSON.stringify({ type: 'pong', ts: new Date().toISOString() }));
            break;

        case 'subscribe':
            ws.subscriptions = msg.channels || ['all'];
            ws.send(JSON.stringify({ type: 'subscribed', channels: ws.subscriptions }));
            break;

        case 'request_status':
            // Request full status update
            const tm = require('./task_manager');
            const rt = require('./revenue_tracker');
            ws.send(JSON.stringify({
                type: 'status',
                queue: tm.list(),
                queueLength: tm.length(),
                revenue: rt.getSummary(),
                ts: new Date().toISOString()
            }));
            break;

        default:
            console.log('[DashboardWS] Unknown message type:', msg.type);
    }
}

/**
 * Broadcast a message to all connected clients
 * @param {Object} payload - Message to broadcast
 */
function broadcast(payload) {
    if (!wss) {
        return;
    }

    const msg = JSON.stringify({
        ...payload,
        broadcast_ts: new Date().toISOString()
    });

    let sent = 0;
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(msg);
            sent++;
        }
    });

    return sent;
}

/**
 * Send to a specific client
 */
function sendTo(clientId, payload) {
    if (!wss) return false;

    for (const client of wss.clients) {
        if (client.clientId === clientId && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(payload));
            return true;
        }
    }
    return false;
}

/**
 * Get connected client count
 */
function getClientCount() {
    return wss ? wss.clients.size : 0;
}

/**
 * Stop the WebSocket server
 */
function stop() {
    if (wss) {
        wss.close();
        wss = null;
        console.log('[DashboardWS] Server stopped');
    }
}

/**
 * Broadcast helper functions for common events
 */
const events = {
    taskEnqueued: (task) => broadcast({ type: 'task_enqueued', task }),
    taskStarted: (task) => broadcast({ type: 'task_started', task }),
    taskDone: (task, result) => broadcast({ type: 'task_done', task, result }),
    taskError: (task, error) => broadcast({ type: 'task_error', task, error }),
    revenueUpdate: (summary) => broadcast({ type: 'revenue_update', summary }),
    agentStatus: (agent, status) => broadcast({ type: 'agent_status', agent, status }),
    systemEvent: (event) => broadcast({ type: 'event', event })
};

module.exports = {
    start,
    stop,
    broadcast,
    sendTo,
    getClientCount,
    events
};

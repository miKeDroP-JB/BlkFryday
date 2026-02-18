/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   WS-SERVER - Real-time Dashboard Updates                                 ║
 * ║   "The ORB pulses in real-time"                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * WebSocket server for pushing live dashboard updates to connected clients.
 * Supports batched updates, heartbeat keep-alive, and per-user connections.
 */

import WebSocket, { WebSocketServer } from 'ws';
import { updateDashboard } from '../ui/ui-loader.js';

// Configuration
const WS_PORT = process.env.WS_PORT || 8081;
const BATCH_INTERVAL = 100;      // Flush updates every 100ms
const HEARTBEAT_INTERVAL = 30000; // Ping every 30s

// Server instance (lazy initialized)
let wss = null;

// Client registry: userId → WebSocket
const clients = new Map();

// Pending updates queue: userId → latest dashboardData
const pendingUpdates = new Map();

// Server metrics
const metrics = {
    connections: 0,
    messagesReceived: 0,
    updatesSent: 0,
    errors: 0,
    startTime: null
};

/**
 * Initialize WebSocket server
 */
export function initWebSocketServer(port = WS_PORT) {
    if (wss) {
        console.log('[WS] Server already running');
        return wss;
    }

    wss = new WebSocketServer({ port });
    metrics.startTime = Date.now();

    console.log(`[WS] Server started on port ${port}`);

    // Handle new connections
    wss.on('connection', (ws, req) => {
        const userId = extractUserId(req);
        clients.set(userId, ws);
        metrics.connections++;

        console.log(`[WS] Client connected: ${userId}`);

        // Handle client disconnect
        ws.on('close', () => {
            clients.delete(userId);
            console.log(`[WS] Client disconnected: ${userId}`);
        });

        // Handle incoming messages
        ws.on('message', (msg) => {
            metrics.messagesReceived++;
            handleClientMessage(userId, msg.toString());
        });

        // Handle errors
        ws.on('error', (err) => {
            metrics.errors++;
            console.error(`[WS][${userId}] Error:`, err.message);
        });

        // Send initial dashboard state
        triggerDashboardUpdate(userId);
    });

    // Start batch flush interval
    setInterval(flushPendingUpdates, BATCH_INTERVAL);

    // Start heartbeat interval
    setInterval(sendHeartbeats, HEARTBEAT_INTERVAL);

    return wss;
}

/**
 * Extract userId from WebSocket request URL
 */
function extractUserId(req) {
    const url = req.url || '';
    const match = url.match(/[?&]userId=([^&]+)/);
    return match ? match[1] : `anon_${Date.now()}`;
}

/**
 * Handle incoming client messages
 */
function handleClientMessage(userId, message) {
    console.log(`[WS][${userId}] ${message}`);

    try {
        const data = JSON.parse(message);

        // Handle different message types
        switch (data.type) {
            case 'ping':
                broadcastUpdate(userId, { type: 'pong', timestamp: Date.now() });
                break;
            case 'subscribe':
                // Client wants to subscribe to specific events
                console.log(`[WS][${userId}] Subscribed to: ${data.events?.join(', ')}`);
                break;
            case 'request_dashboard':
                triggerDashboardUpdate(userId);
                break;
            default:
                console.log(`[WS][${userId}] Unknown message type: ${data.type}`);
        }
    } catch (e) {
        // Non-JSON message, just log it
        console.log(`[WS][${userId}] Raw message: ${message}`);
    }
}

/**
 * Broadcast update to specific user
 */
export function broadcastUpdate(userId, payload) {
    const ws = clients.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
        try {
            ws.send(JSON.stringify(payload));
            metrics.updatesSent++;
        } catch (err) {
            metrics.errors++;
            console.error(`[WS][${userId}] Send error:`, err.message);
        }
    }
}

/**
 * Broadcast to all connected clients
 */
export function broadcastToAll(payload) {
    for (const [userId, ws] of clients.entries()) {
        if (ws.readyState === WebSocket.OPEN) {
            try {
                ws.send(JSON.stringify(payload));
                metrics.updatesSent++;
            } catch (err) {
                metrics.errors++;
                console.error(`[WS][${userId}] Broadcast error:`, err.message);
            }
        }
    }
}

/**
 * Queue dashboard update for batching
 */
export function triggerDashboardUpdate(userId, context = {}) {
    try {
        const dashboardData = updateDashboard(userId, context);
        pendingUpdates.set(userId, dashboardData);
    } catch (err) {
        metrics.errors++;
        console.error(`[WS] Failed to queue dashboard update for ${userId}:`, err.message);
    }
}

/**
 * Flush all pending updates (called on interval)
 */
function flushPendingUpdates() {
    for (const [userId, data] of pendingUpdates.entries()) {
        broadcastUpdate(userId, data);
        pendingUpdates.delete(userId);
    }
}

/**
 * Send heartbeat pings to keep connections alive
 */
function sendHeartbeats() {
    for (const [userId, ws] of clients.entries()) {
        if (ws.readyState === WebSocket.OPEN) {
            try {
                ws.ping();
            } catch (err) {
                console.error(`[WS][${userId}] Heartbeat error:`, err.message);
            }
        }
    }
}

/**
 * Get server metrics
 */
export function getMetrics() {
    return {
        ...metrics,
        activeConnections: clients.size,
        pendingUpdates: pendingUpdates.size,
        uptime: metrics.startTime ? Date.now() - metrics.startTime : 0
    };
}

/**
 * Get list of connected users
 */
export function getConnectedUsers() {
    return Array.from(clients.keys());
}

/**
 * Check if user is connected
 */
export function isUserConnected(userId) {
    const ws = clients.get(userId);
    return ws && ws.readyState === WebSocket.OPEN;
}

/**
 * Disconnect a specific user
 */
export function disconnectUser(userId) {
    const ws = clients.get(userId);
    if (ws) {
        ws.close();
        clients.delete(userId);
        return true;
    }
    return false;
}

/**
 * Shutdown WebSocket server
 */
export function shutdown() {
    if (wss) {
        // Close all client connections
        for (const ws of clients.values()) {
            ws.close();
        }
        clients.clear();
        pendingUpdates.clear();

        wss.close();
        wss = null;
        console.log('[WS] Server shutdown');
    }
}

// Export server instance and utilities
export { wss, clients };

export default {
    initWebSocketServer,
    broadcastUpdate,
    broadcastToAll,
    triggerDashboardUpdate,
    getMetrics,
    getConnectedUsers,
    isUserConnected,
    disconnectUser,
    shutdown
};

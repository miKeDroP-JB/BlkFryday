/**
 * Amoeba WebSocket Broadcaster
 * ES Module - Clean broadcast interface for live metrics
 */

import WebSocket from "ws";

let wss = null;
let clientCount = 0;

/**
 * Initialize the WebSocket broadcast server
 * @param {number} port - Port to listen on (default: 8081)
 * @returns {WebSocket.Server} - The WebSocket server instance
 */
export function initBroadcaster(port = 8081) {
    if (wss) return wss;

    wss = new WebSocket.Server({ port });

    console.log(`[WS] 🌐 Broadcaster online on port ${port}`);

    wss.on("connection", (ws) => {
        clientCount++;
        console.log(`[WS] 🔗 Client connected (total: ${clientCount})`);

        // Send welcome message
        ws.send(JSON.stringify({
            type: "meta",
            status: "connected",
            timestamp: Date.now(),
            serverVersion: "4.1"
        }));

        ws.on("close", () => {
            clientCount--;
            console.log(`[WS] 🔌 Client disconnected (total: ${clientCount})`);
        });

        ws.on("error", (err) => {
            console.error(`[WS] ❌ Error:`, err.message);
        });
    });

    wss.on("error", (err) => {
        console.error(`[WS] ❌ Server error:`, err.message);
    });

    return wss;
}

/**
 * Broadcast payload to all connected clients
 * @param {Object} payload - Data to broadcast
 */
export function broadcast(payload) {
    if (!wss) return;

    const data = JSON.stringify({
        ...payload,
        timestamp: payload.timestamp || Date.now()
    });

    let sent = 0;
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
            sent++;
        }
    });

    return sent;
}

/**
 * Broadcast metrics update
 * @param {Object} metrics - Metrics data
 */
export function broadcastMetrics(metrics) {
    return broadcast({
        type: "metrics",
        data: metrics
    });
}

/**
 * Broadcast progress update
 * @param {Object} progress - Progress data
 */
export function broadcastProgress(progress) {
    return broadcast({
        type: "progress",
        data: progress
    });
}

/**
 * Broadcast branch event
 * @param {Object} event - Branch event data
 */
export function broadcastBranchEvent(event) {
    return broadcast({
        type: "branch",
        data: event
    });
}

/**
 * Broadcast result
 * @param {Object} result - Result data
 */
export function broadcastResult(result) {
    return broadcast({
        type: "result",
        data: result
    });
}

/**
 * Get broadcaster stats
 * @returns {Object} - Stats object
 */
export function getStats() {
    return {
        active: wss !== null,
        clients: clientCount,
        port: wss?.options?.port || null
    };
}

/**
 * Close the broadcaster
 */
export function closeBroadcaster() {
    if (!wss) return;

    // Notify clients
    broadcast({
        type: "meta",
        status: "shutdown"
    });

    wss.clients.forEach((client) => {
        client.close();
    });

    wss.close(() => {
        console.log("[WS] 🛑 Broadcaster closed");
    });

    wss = null;
    clientCount = 0;
}

// Graceful shutdown
process.on("SIGINT", () => {
    closeBroadcaster();
    process.exit(0);
});

process.on("SIGTERM", () => {
    closeBroadcaster();
    process.exit(0);
});

// Default export for convenience
export default {
    initBroadcaster,
    broadcast,
    broadcastMetrics,
    broadcastProgress,
    broadcastBranchEvent,
    broadcastResult,
    getStats,
    closeBroadcaster
};

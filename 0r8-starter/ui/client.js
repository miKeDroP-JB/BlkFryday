/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   CLIENT.JS - Browser WebSocket Client                                    ║
 * ║   "Real-time connection to the ORB"                                       ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Client-side WebSocket handler for receiving real-time dashboard updates.
 * Auto-reconnects on disconnect, handles all event types.
 *
 * Usage:
 *   <script src="client.js"></script>
 *   <script>
 *     const orb = new OrbClient('user123');
 *     orb.on('dashboard_update', data => updateUI(data));
 *   </script>
 */

(function(global) {
    'use strict';

    // Configuration
    const DEFAULT_WS_URL = 'ws://localhost:8081';
    const RECONNECT_DELAY = 1000;
    const MAX_RECONNECT_DELAY = 30000;
    const HEARTBEAT_INTERVAL = 25000;

    /**
     * OrbClient - WebSocket client for 0r8 dashboard
     */
    class OrbClient {
        constructor(userId, options = {}) {
            this.userId = userId;
            this.wsUrl = options.wsUrl || DEFAULT_WS_URL;
            this.ws = null;
            this.reconnectDelay = RECONNECT_DELAY;
            this.reconnectTimer = null;
            this.heartbeatTimer = null;
            this.listeners = new Map();
            this.connected = false;
            this.lastUpdate = null;

            // Auto-connect unless disabled
            if (options.autoConnect !== false) {
                this.connect();
            }
        }

        /**
         * Connect to WebSocket server
         */
        connect() {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                console.log('[OrbClient] Already connected');
                return;
            }

            const url = `${this.wsUrl}?userId=${encodeURIComponent(this.userId)}`;
            console.log(`[OrbClient] Connecting to ${url}`);

            try {
                this.ws = new WebSocket(url);
                this.setupEventHandlers();
            } catch (err) {
                console.error('[OrbClient] Connection failed:', err);
                this.scheduleReconnect();
            }
        }

        /**
         * Setup WebSocket event handlers
         */
        setupEventHandlers() {
            this.ws.onopen = () => {
                console.log('[OrbClient] Connected');
                this.connected = true;
                this.reconnectDelay = RECONNECT_DELAY; // Reset delay on success
                this.startHeartbeat();
                this.emit('connected', { userId: this.userId });
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.lastUpdate = Date.now();
                    this.handleMessage(data);
                } catch (err) {
                    console.error('[OrbClient] Failed to parse message:', err);
                }
            };

            this.ws.onclose = (event) => {
                console.log('[OrbClient] Disconnected', event.code, event.reason);
                this.connected = false;
                this.stopHeartbeat();
                this.emit('disconnected', { code: event.code, reason: event.reason });
                this.scheduleReconnect();
            };

            this.ws.onerror = (err) => {
                console.error('[OrbClient] WebSocket error:', err);
                this.emit('error', err);
            };
        }

        /**
         * Handle incoming messages
         */
        handleMessage(data) {
            // Emit specific event type
            if (data.type) {
                this.emit(data.type, data);
            }

            // Emit specific event name if present
            if (data.data?.event) {
                this.emit(data.data.event, data);
            }

            // Always emit 'message' for raw access
            this.emit('message', data);

            // Log for debugging
            console.log('[OrbClient] Received:', data.type || 'unknown', data);
        }

        /**
         * Send message to server
         */
        send(type, payload = {}) {
            if (!this.connected || !this.ws) {
                console.warn('[OrbClient] Not connected, cannot send');
                return false;
            }

            try {
                this.ws.send(JSON.stringify({ type, ...payload }));
                return true;
            } catch (err) {
                console.error('[OrbClient] Send failed:', err);
                return false;
            }
        }

        /**
         * Request dashboard refresh
         */
        requestDashboard() {
            return this.send('request_dashboard');
        }

        /**
         * Subscribe to specific events
         */
        subscribe(events) {
            return this.send('subscribe', { events: Array.isArray(events) ? events : [events] });
        }

        /**
         * Send ping to keep connection alive
         */
        ping() {
            return this.send('ping');
        }

        /**
         * Start heartbeat timer
         */
        startHeartbeat() {
            this.stopHeartbeat();
            this.heartbeatTimer = setInterval(() => {
                this.ping();
            }, HEARTBEAT_INTERVAL);
        }

        /**
         * Stop heartbeat timer
         */
        stopHeartbeat() {
            if (this.heartbeatTimer) {
                clearInterval(this.heartbeatTimer);
                this.heartbeatTimer = null;
            }
        }

        /**
         * Schedule reconnection with exponential backoff
         */
        scheduleReconnect() {
            if (this.reconnectTimer) return;

            console.log(`[OrbClient] Reconnecting in ${this.reconnectDelay}ms...`);

            this.reconnectTimer = setTimeout(() => {
                this.reconnectTimer = null;
                this.connect();
            }, this.reconnectDelay);

            // Exponential backoff
            this.reconnectDelay = Math.min(this.reconnectDelay * 2, MAX_RECONNECT_DELAY);
        }

        /**
         * Add event listener
         */
        on(event, callback) {
            if (!this.listeners.has(event)) {
                this.listeners.set(event, []);
            }
            this.listeners.get(event).push(callback);
            return this;
        }

        /**
         * Remove event listener
         */
        off(event, callback) {
            if (!this.listeners.has(event)) return this;

            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
            return this;
        }

        /**
         * Emit event to listeners
         */
        emit(event, data) {
            if (!this.listeners.has(event)) return;

            for (const callback of this.listeners.get(event)) {
                try {
                    callback(data);
                } catch (err) {
                    console.error(`[OrbClient] Error in ${event} handler:`, err);
                }
            }
        }

        /**
         * Disconnect from server
         */
        disconnect() {
            this.stopHeartbeat();

            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer);
                this.reconnectTimer = null;
            }

            if (this.ws) {
                this.ws.close();
                this.ws = null;
            }

            this.connected = false;
        }

        /**
         * Get connection status
         */
        getStatus() {
            return {
                connected: this.connected,
                userId: this.userId,
                lastUpdate: this.lastUpdate,
                reconnectDelay: this.reconnectDelay
            };
        }
    }

    /**
     * Helper function to create client and setup common handlers
     */
    function initOrbClient(userId, options = {}) {
        const client = new OrbClient(userId, options);

        // Default handlers
        client.on('dashboard_update', (data) => {
            console.log('[ORB] Dashboard update:', data);
            if (typeof window.renderDashboard === 'function') {
                window.renderDashboard(data);
            }
        });

        client.on('xp_bond_update', (data) => {
            console.log('[ORB] XP/Bond update:', data.data);
        });

        client.on('gift_received', (data) => {
            console.log('[ORB] Gift received:', data.data);
        });

        client.on('level_up', (data) => {
            console.log('[ORB] Level up!', data.data);
        });

        client.on('eko_issued', (data) => {
            console.log('[ORB] EKO issued:', data.data);
        });

        client.on('pong', () => {
            console.log('[ORB] Heartbeat OK');
        });

        return client;
    }

    // Export for different module systems
    if (typeof module !== 'undefined' && module.exports) {
        // Node.js / CommonJS
        module.exports = { OrbClient, initOrbClient };
    } else if (typeof define === 'function' && define.amd) {
        // AMD
        define([], function() {
            return { OrbClient, initOrbClient };
        });
    } else {
        // Browser global
        global.OrbClient = OrbClient;
        global.initOrbClient = initOrbClient;
    }

})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);

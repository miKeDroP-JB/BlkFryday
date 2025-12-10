/**
 * API Command Server
 * Central command bus for all HyperMode systems
 * HTTP + WebSocket API for external control
 */

const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.COMMAND_PORT || 3001;

class CommandBus {
    constructor() {
        this.commands = new Map();
        this.handlers = new Map();
        this.clients = new Set();
        this.history = [];
        this.maxHistory = 1000;

        this._registerDefaultCommands();
        console.log('[CommandBus] 📡 Initialized');
    }

    _registerDefaultCommands() {
        // System commands
        this.register('ping', () => ({ status: 'pong', ts: Date.now() }));
        this.register('status', () => this.getStatus());
        this.register('history', (params) => this.getHistory(params?.limit || 50));

        // Engine commands
        this.register('boost', (params) => this._broadcast('boost', params));
        this.register('slow', (params) => this._broadcast('slow', params));
        this.register('freeze', (params) => this._broadcast('freeze', params));
        this.register('resume', (params) => this._broadcast('resume', params));
        this.register('spawn_branch', (params) => this._broadcast('spawn_branch', params));
        this.register('prune_branch', (params) => this._broadcast('prune_branch', params));
        this.register('merge_branches', (params) => this._broadcast('merge_branches', params));

        // Human node commands
        this.register('take_break', (params) => this._broadcast('take_break', params));
        this.register('update_metrics', (params) => this._broadcast('update_metrics', params));
        this.register('set_mode', (params) => this._broadcast('set_mode', params));

        // Origin layer commands
        this.register('spawn_universe', (params) => this._broadcast('spawn_universe', params));
        this.register('collapse_universe', (params) => this._broadcast('collapse_universe', params));
        this.register('evolve', (params) => this._broadcast('evolve', params));
    }

    register(name, handler) {
        this.commands.set(name, handler);
    }

    async execute(command, params = {}) {
        const handler = this.commands.get(command);
        if (!handler) {
            return { error: `Unknown command: ${command}` };
        }

        try {
            const result = await handler(params);
            this._recordHistory(command, params, result);
            return { success: true, command, result };
        } catch (e) {
            return { error: e.message, command };
        }
    }

    onMessage(handler) {
        this.handlers.set('message', handler);
    }

    _broadcast(type, payload) {
        const message = JSON.stringify({ type, payload, ts: Date.now() });
        this.clients.forEach(client => {
            try {
                if (client.readyState === 1) {
                    client.send(message);
                }
            } catch (e) {}
        });
        return { broadcasted: true, type, clients: this.clients.size };
    }

    _recordHistory(command, params, result) {
        this.history.push({
            command,
            params,
            result: typeof result === 'object' ? '...' : result,
            ts: Date.now()
        });
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }

    getStatus() {
        return {
            commands: Array.from(this.commands.keys()),
            clients: this.clients.size,
            historyCount: this.history.length,
            uptime: process.uptime()
        };
    }

    getHistory(limit = 50) {
        return this.history.slice(-limit);
    }
}

// HTTP Server
const bus = new CommandBus();

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const url = new URL(req.url, `http://localhost:${PORT}`);
    const path = url.pathname;

    // GET /status
    if (req.method === 'GET' && path === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(bus.getStatus()));
        return;
    }

    // GET /commands
    if (req.method === 'GET' && path === '/commands') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ commands: Array.from(bus.commands.keys()) }));
        return;
    }

    // POST /execute
    if (req.method === 'POST' && path === '/execute') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const { command, params } = JSON.parse(body);
                const result = await bus.execute(command, params);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // GET /execute/:command
    if (req.method === 'GET' && path.startsWith('/execute/')) {
        const command = path.split('/')[2];
        const params = Object.fromEntries(url.searchParams);
        bus.execute(command, params).then(result => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
        });
        return;
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
});

// WebSocket Server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    bus.clients.add(ws);
    console.log('[CommandBus] Client connected');

    ws.send(JSON.stringify({
        type: 'welcome',
        commands: Array.from(bus.commands.keys()),
        ts: Date.now()
    }));

    ws.on('message', async (data) => {
        try {
            const { command, params } = JSON.parse(data);
            const result = await bus.execute(command, params);
            ws.send(JSON.stringify(result));
        } catch (e) {
            ws.send(JSON.stringify({ error: e.message }));
        }
    });

    ws.on('close', () => {
        bus.clients.delete(ws);
    });
});

server.listen(PORT, () => {
    console.log(`[CommandBus] 📡 API Server running on port ${PORT}`);
    console.log(`[CommandBus] -> HTTP: http://localhost:${PORT}`);
    console.log(`[CommandBus] -> WebSocket: ws://localhost:${PORT}`);
    console.log(`[CommandBus] -> Commands: ${bus.commands.size} registered`);
});

module.exports = { CommandBus, bus };

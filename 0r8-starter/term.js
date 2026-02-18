#!/usr/bin/env node
/**
 * 0r8.term - Entry Point
 * "The terminal that thinks before you do"
 *
 * Usage:
 *   node term.js              - Start as mass user
 *   node term.js --trusted    - Start as trusted creator
 *   node term.js --server     - Start in server mode (headless + WebSocket)
 *   node term.js --help       - Show help
 *
 * Or via npm:
 *   npm start                 - Start terminal
 *   npm run term:trusted      - Start as trusted creator
 *   npm run server            - Start server mode
 */

import { startTerminal, getStatus } from './index.js';
import http from 'http';

// Parse command line arguments
const args = process.argv.slice(2);

const showHelp = () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                          0r8.term HELP                                    ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  Usage:                                                                   ║
║    node term.js [options]                                                 ║
║                                                                           ║
║  Options:                                                                 ║
║    --trusted      Start as trusted creator (2x XP, all features)         ║
║    --server       Start in server mode (WebSocket + health endpoint)     ║
║    --user <id>    Set user ID                                             ║
║    --layout <n>   Set UI layout (default, immersive, minimal)            ║
║    --help         Show this help message                                 ║
║    --version      Show version                                            ║
║                                                                           ║
║  Examples:                                                                ║
║    node term.js                    Start as mass user                     ║
║    node term.js --trusted          Start as trusted creator               ║
║    node term.js --server           Start headless server                  ║
║    node term.js --trusted --user scientist1                              ║
║                                                                           ║
║  npm scripts:                                                             ║
║    npm start                       Start terminal                         ║
║    npm run term:trusted            Start as trusted creator               ║
║    npm run server                  Start server mode                      ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);
    process.exit(0);
};

const showVersion = () => {
    console.log('0r8.term v1.0.0');
    console.log('Built with 🔮 by The Architect');
    process.exit(0);
};

// Parse arguments
if (args.includes('--help') || args.includes('-h')) {
    showHelp();
}

if (args.includes('--version') || args.includes('-v')) {
    showVersion();
}

// Build user context from arguments
const userContext = {
    trusted: args.includes('--trusted') || args.includes('-t'),
    userId: 'terminal_user',
    preferences: {
        layout: 'default'
    }
};

// Parse --user argument
const userIndex = args.indexOf('--user');
if (userIndex !== -1 && args[userIndex + 1]) {
    userContext.userId = args[userIndex + 1];
}

// Parse --layout argument
const layoutIndex = args.indexOf('--layout');
if (layoutIndex !== -1 && args[layoutIndex + 1]) {
    userContext.preferences.layout = args[layoutIndex + 1];
}

// Check for server mode
const isServerMode = args.includes('--server') || args.includes('-s');

if (isServerMode) {
    // ═══════════════════════════════════════════════════════════════════════════
    // SERVER MODE - Headless with HTTP health check + WebSocket
    // ═══════════════════════════════════════════════════════════════════════════
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║   🔮 ORB SERVER MODE                                                      ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);

    const HTTP_PORT = process.env.PORT || 3000;
    const WS_PORT = process.env.WS_PORT || 8081;

    // Create HTTP server for health checks and basic API
    const server = http.createServer((req, res) => {
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        const url = new URL(req.url, `http://localhost:${HTTP_PORT}`);

        // Health check endpoint
        if (url.pathname === '/health' || url.pathname === '/') {
            const status = getStatus();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'ok',
                service: '0r8-starter',
                version: '1.0.0',
                uptime: status.uptime,
                requests: status.requests,
                mode: 'server',
                wsPort: WS_PORT,
                timestamp: Date.now()
            }));
            return;
        }

        // Status endpoint
        if (url.pathname === '/status') {
            const status = getStatus();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(status));
            return;
        }

        // 404 for other routes
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    });

    // Start HTTP server
    server.listen(HTTP_PORT, () => {
        console.log(`   HTTP Server: http://localhost:${HTTP_PORT}`);
        console.log(`   Health Check: http://localhost:${HTTP_PORT}/health`);
    });

    // Initialize WebSocket server
    import('./core/ws-server.js').then(({ initWebSocketServer }) => {
        initWebSocketServer(parseInt(WS_PORT));
        console.log(`   WebSocket: ws://localhost:${WS_PORT}`);
        console.log('');
        console.log('   ORB is running. Waiting for connections...');
        console.log('   Press Ctrl+C to stop.');
    }).catch(err => {
        console.warn('   WebSocket server not available:', err.message);
    });

    // Handle shutdown
    process.on('SIGINT', () => {
        console.log('\n   Shutting down ORB server...');
        server.close();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        console.log('\n   Shutting down ORB server...');
        server.close();
        process.exit(0);
    });

} else {
    // ═══════════════════════════════════════════════════════════════════════════
    // INTERACTIVE MODE - Terminal with readline
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('Starting 0r8.term...\n');

    startTerminal(userContext).catch((err) => {
        console.error('Failed to start 0r8.term:', err.message);
        process.exit(1);
    });
}

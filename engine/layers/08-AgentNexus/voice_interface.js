/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   VOICE INTERFACE - HTTP Endpoint for Voice Commands                      ║
 * ║   Accepts voice->text and routes to appropriate agents                    ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const express = require('express');
const { enqueue } = require('./task_manager');
const { broadcast } = require('./dashboard_ws');
const { resolveAgent } = require('./agents-index');

let server = null;

/**
 * Parse natural language command into task
 */
function parseCommand(text) {
    const lower = text.toLowerCase().trim();

    // Scan/Security commands -> Sentinel
    if (lower.startsWith('scan site') || lower.startsWith('scan ') || lower.includes('security scan')) {
        const target = text.replace(/^(scan site|scan|security scan)\s*/i, '').trim();
        return { agent: 'sentinel', type: 'bug_scan', data: { target: target || 'unknown' } };
    }

    // Gig commands -> Apollo
    if (lower.startsWith('apply gig') || lower.startsWith('find gig') || lower.includes('freelance')) {
        const gigId = text.replace(/^(apply gig|find gig|freelance)\s*/i, '').trim();
        return { agent: 'apollo', type: 'gig_apply', data: { gigId } };
    }

    if (lower.includes('find gigs') || lower.includes('search gigs')) {
        return { agent: 'apollo', type: 'gig_research', data: { query: text } };
    }

    // Outreach commands -> Mercury
    if (lower.startsWith('outreach') || lower.includes('send pitch') || lower.includes('cold email')) {
        return { agent: 'mercury', type: 'outreach', data: { message: text } };
    }

    if (lower.includes('daily outreach')) {
        return { agent: 'mercury', type: 'daily_outreach', data: {} };
    }

    // Content commands -> Athena
    if (lower.startsWith('write') || lower.startsWith('create content') || lower.startsWith('generate')) {
        const prompt = text.replace(/^(write|create content|generate)\s*/i, '').trim();
        return { agent: 'athena', type: 'generate_content', data: { prompt } };
    }

    if (lower.includes('social post') || lower.includes('tweet')) {
        return { agent: 'athena', type: 'social_content', data: { prompt: text } };
    }

    // Bug report commands -> Ares
    if (lower.includes('submit bug') || lower.includes('bug report') || lower.includes('compile report')) {
        return { agent: 'ares', type: 'compile_report', data: { details: text } };
    }

    // Client commands -> Hermes
    if (lower.includes('message client') || lower.includes('client update') || lower.includes('follow up')) {
        return { agent: 'hermes', type: 'client_message', data: { message: text } };
    }

    // Build commands -> Hephaestus
    if (lower.startsWith('build') || lower.startsWith('deploy') || lower.includes('automate')) {
        return { agent: 'hephaestus', type: 'build', data: { spec: text } };
    }

    // Validation commands -> Artemis
    if (lower.includes('validate') || lower.includes('check compliance') || lower.includes('verify')) {
        return { agent: 'artemis', type: 'validate', data: { target: text } };
    }

    // Affiliate commands
    if (lower.includes('affiliate') || lower.includes('find deals')) {
        return { agent: 'apollo', type: 'affiliate_research', data: { query: text } };
    }

    // Status/Info commands (no agent, return info)
    if (lower.includes('status') || lower.includes('how are you') || lower === 'report') {
        return { type: 'status_request', data: {} };
    }

    // Default: send to Athena for general content/response
    return { agent: 'athena', type: 'generate', data: { prompt: text } };
}

/**
 * Start the voice interface HTTP server
 * @param {number} port - Port to listen on (default: 8777)
 */
function start(port = 8777) {
    if (server) {
        console.log('[VoiceInterface] Already running');
        return server;
    }

    const app = express();
    app.use(express.json());

    // CORS for browser clients
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
        if (req.method === 'OPTIONS') return res.sendStatus(200);
        next();
    });

    /**
     * POST /voice-cmd
     * Body: { text: "command text", user: "username" }
     */
    app.post('/voice-cmd', (req, res) => {
        const { text, user = 'unknown' } = req.body || {};

        if (!text) {
            return res.status(400).json({ error: 'No text provided' });
        }

        console.log(`[VoiceInterface] Command from ${user}: "${text}"`);

        // Parse the command
        const task = parseCommand(text);

        // Handle status requests differently
        if (task.type === 'status_request') {
            const tm = require('./task_manager');
            const rt = require('./revenue_tracker');
            return res.json({
                ok: true,
                type: 'status',
                queue: tm.length(),
                revenue: rt.getSummary()
            });
        }

        // Enqueue the task
        task.source = 'voice';
        task.user = user;
        task.original_text = text;

        const enqueuedTask = enqueue(task);

        // Broadcast to dashboard
        broadcast({ type: 'task_enqueued', task: enqueuedTask, source: 'voice' });

        res.json({
            ok: true,
            task: enqueuedTask,
            message: `Task queued: ${task.type} -> ${task.agent}`
        });
    });

    /**
     * GET /status
     * Quick status endpoint
     */
    app.get('/status', (req, res) => {
        const tm = require('./task_manager');
        const rt = require('./revenue_tracker');

        res.json({
            status: 'online',
            queue: tm.length(),
            revenue: rt.getSummary(),
            ts: new Date().toISOString()
        });
    });

    /**
     * POST /enqueue
     * Direct task enqueue endpoint
     */
    app.post('/enqueue', (req, res) => {
        const task = req.body;

        if (!task || !task.agent || !task.type) {
            return res.status(400).json({ error: 'Task must have agent and type' });
        }

        const enqueuedTask = enqueue(task);
        broadcast({ type: 'task_enqueued', task: enqueuedTask });

        res.json({ ok: true, task: enqueuedTask });
    });

    server = app.listen(port, () => {
        console.log(`[VoiceInterface] HTTP endpoint listening on http://localhost:${port}`);
        console.log(`  POST /voice-cmd  - Voice command endpoint`);
        console.log(`  POST /enqueue    - Direct task enqueue`);
        console.log(`  GET  /status     - System status`);
    });

    return server;
}

/**
 * Stop the voice interface server
 */
function stop() {
    if (server) {
        server.close();
        server = null;
        console.log('[VoiceInterface] Server stopped');
    }
}

module.exports = {
    start,
    stop,
    parseCommand
};

/**
 * Main processing endpoint for 0r8-starter
 * POST /api/process
 *
 * Body: { input: string, context?: object }
 * Returns: { success: boolean, output: object }
 */

// Dynamic imports for serverless compatibility
let orbCore = null;

async function loadCore() {
    if (!orbCore) {
        try {
            orbCore = await import('../index.js');
        } catch (e) {
            console.error('Failed to load orb core:', e.message);
            return null;
        }
    }
    return orbCore;
}

export default async function handler(req, res) {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed', allowed: ['POST'] });
        return;
    }

    const startTime = Date.now();

    try {
        const { input, context = {} } = req.body || {};

        if (!input) {
            res.status(400).json({ error: 'Missing required field: input' });
            return;
        }

        // Load the core engine
        const core = await loadCore();

        if (!core) {
            res.status(503).json({
                error: 'Core engine unavailable',
                mode: 'degraded'
            });
            return;
        }

        // Process input through the orb engine
        const result = await core.handleUserInput(input, {
            ...context,
            source: 'vercel-api',
            serverless: true
        });

        res.status(200).json({
            success: true,
            output: result,
            latency: Date.now() - startTime,
            mode: process.env.ORB_MODE || 'serverless'
        });

    } catch (error) {
        console.error('Process error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            latency: Date.now() - startTime
        });
    }
}

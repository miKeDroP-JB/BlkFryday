/**
 * System Status API Endpoint
 * GET /api/system - Get full system status including bridge components
 */

let bridgeModule = null;

async function loadBridge() {
    if (!bridgeModule) {
        try {
            bridgeModule = await import('../core/system-bridge.js');
        } catch (e) {
            console.error('Failed to load system bridge:', e.message);
            return null;
        }
    }
    return bridgeModule;
}

export default async function handler(req, res) {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed', allowed: ['GET'] });
        return;
    }

    try {
        const bridge = await loadBridge();

        // Base status
        const status = {
            service: '0r8-starter',
            version: '1.0.0',
            status: 'alive',
            mode: process.env.ORB_MODE || 'serverless',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),

            // Core components
            components: {
                orb: true,
                api: true,
                observer: true,
                agents: true,
                locks: true,
                flowsync: true,
                memory: true
            },

            // Endpoints
            endpoints: {
                health: '/api/health',
                process: '/api/process',
                observer: '/api/observer',
                agents: '/api/agents',
                solve: '/api/solve',
                voice: '/api/voice',
                system: '/api/system'
            }
        };

        // Add system bridge status if available
        if (bridge) {
            const systemStatus = await bridge.getSystemStatus();
            status.system = systemStatus;
            status.bridge = {
                connected: systemStatus.available,
                version: systemStatus.version,
                codename: systemStatus.codename
            };
        } else {
            status.system = { available: false };
            status.bridge = { connected: false };
        }

        res.status(200).json(status);

    } catch (error) {
        console.error('System status error:', error);
        res.status(500).json({
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

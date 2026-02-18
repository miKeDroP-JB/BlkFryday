/**
 * Observer status and control endpoint
 * GET /api/observer - Get observer status
 * POST /api/observer - Inject anomaly for testing
 */

let observerModule = null;

async function loadObserver() {
    if (!observerModule) {
        try {
            observerModule = await import('../core/observer/index.js');
        } catch (e) {
            console.error('Failed to load observer:', e.message);
            return null;
        }
    }
    return observerModule;
}

export default async function handler(req, res) {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const obs = await loadObserver();

    if (!obs) {
        res.status(503).json({ error: 'Observer module unavailable' });
        return;
    }

    if (req.method === 'GET') {
        // Return observer status
        const status = obs.observer.getStatus();
        res.status(200).json({
            success: true,
            observer: status,
            timestamp: new Date().toISOString()
        });
        return;
    }

    if (req.method === 'POST') {
        // Inject test anomaly
        const { type = 'random', intensity = 'medium' } = req.body || {};

        try {
            const result = await obs.observer.injectAnomaly(type, intensity);
            res.status(200).json({
                success: true,
                injection: result,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
        return;
    }

    res.status(405).json({ error: 'Method not allowed' });
}

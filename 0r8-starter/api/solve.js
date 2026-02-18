/**
 * ARC-AGI Solver API Endpoint
 * POST /api/solve - Solve an ARC task
 *
 * Body: { task: { train: [...], test: [...] } }
 * Returns: { success: boolean, predictions: array, elapsed: number }
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

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed', allowed: ['POST'] });
        return;
    }

    const startTime = Date.now();

    try {
        const { task } = req.body || {};

        if (!task || !task.train || !task.test) {
            res.status(400).json({
                error: 'Missing required field: task (must include train and test arrays)',
                example: {
                    task: {
                        train: [{ input: [[0,1],[1,0]], output: [[1,0],[0,1]] }],
                        test: [{ input: [[0,1],[1,0]] }]
                    }
                }
            });
            return;
        }

        const bridge = await loadBridge();

        if (!bridge) {
            res.status(503).json({
                error: 'Solver bridge unavailable',
                mode: 'degraded'
            });
            return;
        }

        // Solve the task
        const result = await bridge.solveARC(task);

        res.status(200).json({
            success: !result.error,
            predictions: result.predictions || [],
            elapsed: result.elapsed || (Date.now() - startTime),
            solver: result.solver || 'UnlimitedSolver',
            error: result.error || null,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Solve error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            elapsed: Date.now() - startTime
        });
    }
}

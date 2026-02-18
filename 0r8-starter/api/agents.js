/**
 * Bounded Agent Autonomy API
 * GET /api/agents - Get agents status
 * POST /api/agents - Enable/disable or run demo
 */

let agentsModule = null;
let locksModule = null;

async function loadModules() {
    if (!agentsModule) {
        try {
            agentsModule = await import('../agents/index.js');
            locksModule = await import('../core/locks/index.js');
        } catch (e) {
            console.error('Failed to load agents:', e.message);
            return null;
        }
    }
    return { agents: agentsModule, locks: locksModule };
}

export default async function handler(req, res) {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const modules = await loadModules();

    if (!modules) {
        res.status(503).json({ error: 'Agents module unavailable' });
        return;
    }

    const { agents, locks } = modules;

    if (req.method === 'GET') {
        // Return agents status
        const status = agents.agents.getStatus();
        res.status(200).json({
            success: true,
            agents: status,
            timestamp: new Date().toISOString()
        });
        return;
    }

    if (req.method === 'POST') {
        const { action = 'status', scope = 'task-level', autonomy = 'bounded' } = req.body || {};

        try {
            let result;

            switch (action) {
                case 'enable':
                    // Ensure locks are engaged first
                    locks.locks.freeze(['memory', 'observer', 'amoeba']);
                    result = agents.agents.enable({
                        scope,
                        constraints: ['observer', 'amoeba'],
                        autonomy
                    });
                    break;

                case 'disable':
                    result = agents.agents.disable();
                    break;

                case 'demo':
                    // Quick demo
                    locks.locks.freeze(['memory', 'observer', 'amoeba']);
                    agents.agents.enable({ scope: 'task-level', autonomy: 'bounded' });

                    const agentId = `demo-${Date.now()}`;
                    agents.agents.createAgent(agentId, { name: 'Demo Agent' });

                    const task = await agents.agents.startTask(agentId, {
                        type: 'demo',
                        input: 'API test',
                        tools: ['analyze', 'respond']
                    });

                    agents.agents.chooseTool(agentId, 'analyze', 'Testing');
                    agents.agents.chooseTool(agentId, 'respond', 'Responding');

                    result = agents.agents.completeTask(agentId, { response: 'Demo complete' });
                    break;

                default:
                    result = agents.agents.getStatus();
            }

            res.status(200).json({
                success: true,
                action,
                result,
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

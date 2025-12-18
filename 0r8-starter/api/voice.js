/**
 * Voice Command API Endpoint
 * POST /api/voice - Process voice command
 *
 * Body: { command: string, sessionId?: string }
 * Returns: { success: boolean, result: object }
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

    try {
        const { command, sessionId = 'default' } = req.body || {};

        if (!command) {
            res.status(400).json({
                error: 'Missing required field: command',
                example: { command: 'awaken', sessionId: 'user-123' },
                availableCommands: [
                    'awaken - Wake up the system',
                    'status - Get system status',
                    'generate - Generate strategies',
                    'solve - Solve a problem',
                    'oracle - Enter oracle mode',
                    'agents - List agents',
                    'revenue - Get revenue stats'
                ]
            });
            return;
        }

        const bridge = await loadBridge();

        if (!bridge) {
            // Fallback: simple command handling
            const result = handleBasicCommand(command);
            res.status(200).json({
                success: true,
                result,
                mode: 'basic',
                timestamp: new Date().toISOString()
            });
            return;
        }

        // Process through VoiceBrain
        const result = await bridge.processVoice(command, sessionId);

        res.status(200).json({
            success: !result.error,
            result: result.result || result,
            error: result.error || null,
            sessionId,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Voice error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * Basic command handling fallback
 */
function handleBasicCommand(command) {
    const cmd = command.toLowerCase().trim();

    if (cmd.includes('awaken') || cmd.includes('wake')) {
        return {
            type: 'awaken',
            speak: 'The ORB awakens. Systems online. Ready for input.',
            data: { status: 'alive', systems: 'ready' }
        };
    }

    if (cmd.includes('status')) {
        return {
            type: 'status',
            speak: 'All systems operational. 0r8-starter running.',
            data: {
                status: 'alive',
                version: '1.0.0',
                mode: 'serverless'
            }
        };
    }

    if (cmd.includes('help')) {
        return {
            type: 'help',
            speak: 'Available commands: awaken, status, oracle, solve, generate, agents',
            data: {
                commands: ['awaken', 'status', 'oracle', 'solve', 'generate', 'agents', 'revenue']
            }
        };
    }

    return {
        type: 'echo',
        speak: `Command received: ${command}`,
        data: { command, processed: true }
    };
}

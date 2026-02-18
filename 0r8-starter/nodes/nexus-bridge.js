/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   NEXUS BRIDGE - Connect ORB to Agent Nexus Monetization                  ║
 * ║   Routes earning opportunities through the 8-agent pantheon               ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { generateId } from '../core/crypto-utils.js';
import { userStorage } from '../core/storage-hybrid.js';

// Path to Agent Nexus (relative from 0r8-starter)
const NEXUS_PATH = '../engine/layers/08-AgentNexus';

// Bridge state
let nexusConnected = false;
let orchestrator = null;
let strategyGenerator = null;
let taskManager = null;

/**
 * Initialize connection to Agent Nexus
 */
export async function connect() {
    try {
        // Dynamic import for Agent Nexus modules
        orchestrator = await import(`${NEXUS_PATH}/orchestrator.js`).catch(() => null);
        strategyGenerator = await import(`${NEXUS_PATH}/strategy_generator.js`).catch(() => null);
        taskManager = await import(`${NEXUS_PATH}/task_manager.js`).catch(() => null);

        nexusConnected = orchestrator !== null;

        if (nexusConnected) {
            console.log('[NexusBridge] Connected to Agent Nexus');
        } else {
            console.log('[NexusBridge] Agent Nexus not available, running in standalone mode');
        }

        return nexusConnected;
    } catch (error) {
        console.error('[NexusBridge] Connection failed:', error.message);
        return false;
    }
}

/**
 * Nexus Bridge AI Node
 */
export const nexusBridge = {
    name: 'NexusBridge',

    /**
     * Process monetization requests through Agent Nexus
     */
    async process(input, userContext) {
        const inputData = typeof input === 'object' ? input : { raw: input };
        const action = detectMonetizationAction(inputData);

        if (!action) {
            return {
                success: false,
                message: 'No monetization action detected',
                timestamp: Date.now()
            };
        }

        // Route to appropriate handler
        switch (action.type) {
            case 'generate_strategy':
                return await generateStrategy(action, userContext);

            case 'submit_task':
                return await submitTask(action, userContext);

            case 'get_status':
                return await getStatus(userContext);

            case 'trigger_cycle':
                return await triggerCycle(action.cycle);

            case 'affiliate_search':
                return await searchAffiliates(action, userContext);

            default:
                return {
                    success: false,
                    message: `Unknown action: ${action.type}`,
                    timestamp: Date.now()
                };
        }
    }
};

/**
 * Detect monetization intent from input
 */
function detectMonetizationAction(input) {
    const text = (input.raw || input.input || '').toLowerCase();

    // Strategy generation
    if (text.includes('earn') || text.includes('make money') || text.includes('revenue')) {
        const amountMatch = text.match(/\$?(\d+)/);
        return {
            type: 'generate_strategy',
            targetRevenue: amountMatch ? parseInt(amountMatch[1]) : 100
        };
    }

    // Task submission
    if (text.includes('task') || text.includes('job') || text.includes('gig')) {
        return {
            type: 'submit_task',
            description: text
        };
    }

    // Status check
    if (text.includes('status') || text.includes('how much') || text.includes('progress')) {
        return { type: 'get_status' };
    }

    // Revenue cycles
    if (text.includes('morning') || text.includes('afternoon') || text.includes('evening')) {
        const cycle = text.includes('morning') ? 'morning' :
            text.includes('afternoon') ? 'afternoon' : 'evening';
        return { type: 'trigger_cycle', cycle };
    }

    // Affiliate search
    if (text.includes('affiliate') || text.includes('program') || text.includes('partner')) {
        return {
            type: 'affiliate_search',
            query: text
        };
    }

    return null;
}

/**
 * Generate earning strategy via Infinite Strategy Generator
 */
async function generateStrategy(action, userContext) {
    if (strategyGenerator) {
        const strategy = strategyGenerator.generate({
            targetRevenue: action.targetRevenue,
            resources: ['email', 'twitter', 'discord'],
            affiliatePrograms: []
        });

        // Store in user's data
        userStorage.save(userContext.userId || 'anonymous', [{
            type: 'strategy',
            strategy,
            timestamp: Date.now()
        }], { tags: ['monetization', 'strategy'] });

        return {
            success: true,
            type: 'strategy_generated',
            strategy: {
                id: strategy.id,
                avatar: strategy.avatar,
                template: strategy.template,
                target: strategy.target.revenue,
                phases: strategy.phases.length
            },
            message: `Strategy created: ${strategy.avatar} will execute ${strategy.template} targeting $${strategy.target.revenue}`,
            timestamp: Date.now()
        };
    }

    // Fallback: simulate strategy
    return {
        success: true,
        type: 'strategy_simulated',
        message: `Simulated strategy for $${action.targetRevenue} target`,
        recommendation: getRecommendation(action.targetRevenue),
        timestamp: Date.now()
    };
}

/**
 * Submit task to Agent Nexus queue
 */
async function submitTask(action, userContext) {
    const task = {
        id: generateId('task'),
        type: inferTaskType(action.description),
        description: action.description,
        priority: 'normal',
        source: 'orb',
        userId: userContext.userId || 'anonymous',
        created: Date.now()
    };

    if (taskManager) {
        taskManager.enqueue(task);

        return {
            success: true,
            type: 'task_submitted',
            task: {
                id: task.id,
                type: task.type,
                priority: task.priority
            },
            message: `Task queued: ${task.type} (${task.id})`,
            timestamp: Date.now()
        };
    }

    // Fallback: store locally
    userStorage.save(userContext.userId || 'anonymous', [task], {
        tags: ['task', 'pending']
    });

    return {
        success: true,
        type: 'task_stored',
        message: 'Task stored locally (Agent Nexus offline)',
        timestamp: Date.now()
    };
}

/**
 * Get monetization status
 */
async function getStatus(userContext) {
    if (orchestrator) {
        const status = orchestrator.status();

        return {
            success: true,
            type: 'nexus_status',
            status: {
                running: status.running,
                queue: status.queue,
                revenue: status.revenue,
                strategies: status.strategyGenerator
            },
            timestamp: Date.now()
        };
    }

    // Fallback: local status
    const userData = userStorage.loadFull(userContext.userId || 'anonymous');

    return {
        success: true,
        type: 'local_status',
        status: {
            items: userData.items?.length || 0,
            strategies: userData.items?.filter(i => i.data?.type === 'strategy').length || 0,
            tasks: userData.items?.filter(i => i.data?.type === 'task').length || 0
        },
        timestamp: Date.now()
    };
}

/**
 * Trigger revenue cycle
 */
async function triggerCycle(cycleName) {
    if (orchestrator && orchestrator.triggerCycle) {
        const result = orchestrator.triggerCycle(cycleName);

        return {
            success: true,
            type: 'cycle_triggered',
            cycle: cycleName,
            tasks: result?.length || 0,
            timestamp: Date.now()
        };
    }

    return {
        success: false,
        type: 'cycle_unavailable',
        message: 'Revenue cycles require Agent Nexus',
        timestamp: Date.now()
    };
}

/**
 * Search affiliate programs
 */
async function searchAffiliates(action, userContext) {
    // Simulated affiliate data
    const affiliates = [
        { name: 'Amazon Associates', commission: '1-10%', category: 'general' },
        { name: 'ShareASale', commission: '5-30%', category: 'varied' },
        { name: 'ClickBank', commission: '50-75%', category: 'digital' },
        { name: 'CJ Affiliate', commission: '3-50%', category: 'enterprise' },
        { name: 'Rakuten', commission: '5-20%', category: 'retail' }
    ];

    return {
        success: true,
        type: 'affiliate_results',
        affiliates,
        recommendation: 'Start with high-commission digital products on ClickBank',
        timestamp: Date.now()
    };
}

/**
 * Infer task type from description
 */
function inferTaskType(description) {
    const text = description.toLowerCase();

    if (text.includes('scan') || text.includes('security')) return 'bug_scan';
    if (text.includes('gig') || text.includes('freelance')) return 'gig_research';
    if (text.includes('outreach') || text.includes('email')) return 'daily_outreach';
    if (text.includes('content') || text.includes('write')) return 'generate_content';
    if (text.includes('build') || text.includes('create')) return 'build';

    return 'general';
}

/**
 * Get recommendation based on target
 */
function getRecommendation(target) {
    if (target < 50) {
        return 'Start with affiliate content and referral programs';
    } else if (target < 200) {
        return 'Combine freelance gigs with affiliate marketing';
    } else if (target < 500) {
        return 'Focus on higher-ticket services and product launches';
    } else {
        return 'Build automated funnels with multiple revenue streams';
    }
}

/**
 * Check connection status
 */
export function isConnected() {
    return nexusConnected;
}

/**
 * Get bridge status
 */
export function getBridgeStatus() {
    return {
        connected: nexusConnected,
        orchestrator: orchestrator !== null,
        strategyGenerator: strategyGenerator !== null,
        taskManager: taskManager !== null
    };
}

export default {
    nexusBridge,
    connect,
    isConnected,
    getBridgeStatus
};

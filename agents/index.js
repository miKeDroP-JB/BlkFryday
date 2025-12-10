/**
 * Business Agent Army - Index
 * Unified exports for all agents
 */

const OrbBrain = require('./0rb_brain');
const Sentinel = require('./sentinel');
const Apollo = require('./apollo');
const Mercury = require('./mercury');
const Athena = require('./athena');
const Ares = require('./ares');
const Hermes = require('./hermes');
const Hephaestus = require('./hephaestus');
const Artemis = require('./artemis');

// Dashboard components
const RevenueTracker = require('./dashboard/revenue_tracker');
const AgentMetrics = require('./dashboard/agent_metrics');

module.exports = {
    // Core orchestrator
    OrbBrain,

    // Business agents
    Sentinel,      // Security scanning
    Apollo,        // Freelance automation
    Mercury,       // Outreach & pitching
    Athena,        // Content generation
    Ares,          // Bug bounty submission
    Hermes,        // Client messaging
    Hephaestus,    // Build automation
    Artemis,       // Compliance validation

    // Dashboard
    RevenueTracker,
    AgentMetrics,

    // Factory function
    createArmy: (config = {}) => {
        const brain = new OrbBrain(config.brain || {});

        // Initialize all agents
        const agents = {
            sentinel: new Sentinel(config.sentinel || {}),
            apollo: new Apollo(config.apollo || {}),
            mercury: new Mercury(config.mercury || {}),
            athena: new Athena(config.athena || {}),
            ares: new Ares(config.ares || {}),
            hermes: new Hermes(config.hermes || {}),
            hephaestus: new Hephaestus(config.hephaestus || {}),
            artemis: new Artemis(config.artemis || {})
        };

        // Register agents with brain
        for (const [id, agent] of Object.entries(agents)) {
            brain.registerAgent(id, agent);
        }

        // Initialize dashboard components
        const dashboard = {
            revenue: new RevenueTracker(config.revenue || {}),
            metrics: new AgentMetrics(config.metrics || {})
        };

        return {
            brain,
            agents,
            dashboard,

            // Convenience methods
            queueTask: (task) => brain.queueTask(task),
            getStatus: () => ({
                brain: brain.getStatus(),
                agents: Object.entries(agents).map(([id, a]) => ({
                    id,
                    name: a.name,
                    stats: a.getStats ? a.getStats() : null
                })),
                revenue: dashboard.revenue.getSummary('month'),
                metrics: dashboard.metrics.getAllAgentsSummary()
            })
        };
    }
};

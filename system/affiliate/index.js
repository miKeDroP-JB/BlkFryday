/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   AFFILIATE SYSTEM - Autonomous Income Engine                             ║
 * ║   "Join the swarm. Earn while you sleep."                                 ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const AffiliateSwarm = require('./AffiliateSwarm');

// Singleton instance
let swarmInstance = null;

/**
 * Initialize the affiliate swarm
 */
async function initializeAffiliateSwarm(config = {}) {
    if (swarmInstance) {
        return swarmInstance;
    }

    swarmInstance = new AffiliateSwarm({
        platformFee: 0.30,      // 30% platform fee
        userShare: 0.70,        // 70% to users
        minPayout: 25,          // $25 minimum payout
        researchInterval: 6 * 60 * 60 * 1000, // Research every 6 hours
        ...config
    });

    // Set up event logging
    swarmInstance.on('research:complete', ({ deals, hot }) => {
        console.log(`[AffiliateSystem] Research complete: ${deals} deals, ${hot} hot deals`);
    });

    swarmInstance.on('user:registered', (user) => {
        console.log(`[AffiliateSystem] New user: ${user.id} (${user.email})`);
    });

    swarmInstance.on('conversion', ({ amount, userShare, platformShare }) => {
        console.log(`[AffiliateSystem] Conversion: $${amount} (User: $${userShare}, Platform: $${platformShare})`);
    });

    console.log(`
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║   █████╗ ███████╗███████╗██╗██╗     ██╗ █████╗ ████████╗███████╗        ║
║  ██╔══██╗██╔════╝██╔════╝██║██║     ██║██╔══██╗╚══██╔══╝██╔════╝        ║
║  ███████║█████╗  █████╗  ██║██║     ██║███████║   ██║   █████╗          ║
║  ██╔══██║██╔══╝  ██╔══╝  ██║██║     ██║██╔══██║   ██║   ██╔══╝          ║
║  ██║  ██║██║     ██║     ██║███████╗██║██║  ██║   ██║   ███████╗        ║
║  ╚═╝  ╚═╝╚═╝     ╚═╝     ╚═╝╚══════╝╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝        ║
║                                                                          ║
║  SYSTEM ONLINE - Autonomous affiliate research active                    ║
║                                                                          ║
║  Revenue Split: 70% User / 30% Platform                                  ║
║  Research Cycle: Every 6 hours                                           ║
║  Payout Threshold: $25 minimum                                           ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
    `);

    return swarmInstance;
}

/**
 * Get the current swarm instance
 */
function getSwarm() {
    return swarmInstance;
}

/**
 * API handlers for integration
 */
const api = {
    // Get all deals
    getDeals: (options = {}) => {
        if (!swarmInstance) return { error: 'Swarm not initialized' };
        return swarmInstance.getDeals(options);
    },

    // Get hot deals
    getHotDeals: () => {
        if (!swarmInstance) return { error: 'Swarm not initialized' };
        return swarmInstance.getHotDeals();
    },

    // Get categories
    getCategories: () => {
        if (!swarmInstance) return { error: 'Swarm not initialized' };
        return swarmInstance.getCategories();
    },

    // Register user
    registerUser: (userData) => {
        if (!swarmInstance) return { error: 'Swarm not initialized' };
        return swarmInstance.registerUser(userData);
    },

    // Get user dashboard
    getUserDashboard: (userId) => {
        if (!swarmInstance) return { error: 'Swarm not initialized' };
        return swarmInstance.getUserDashboard(userId);
    },

    // Track click
    trackClick: (dealId, userId) => {
        if (!swarmInstance) return { error: 'Swarm not initialized' };
        return swarmInstance.trackClick(dealId, userId);
    },

    // Record conversion
    recordConversion: (dealId, userId, amount) => {
        if (!swarmInstance) return { error: 'Swarm not initialized' };
        return swarmInstance.recordConversion(dealId, userId, amount);
    },

    // Get stats
    getStats: () => {
        if (!swarmInstance) return { error: 'Swarm not initialized' };
        return swarmInstance.getStats();
    },

    // Trigger manual research
    triggerResearch: async () => {
        if (!swarmInstance) return { error: 'Swarm not initialized' };
        await swarmInstance.runResearch();
        return { success: true };
    }
};

module.exports = {
    AffiliateSwarm,
    initializeAffiliateSwarm,
    getSwarm,
    api,
    AFFILIATE_NETWORKS: AffiliateSwarm.AFFILIATE_NETWORKS,
    DEAL_CATEGORIES: AffiliateSwarm.DEAL_CATEGORIES
};

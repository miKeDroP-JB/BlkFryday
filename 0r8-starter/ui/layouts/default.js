/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   DEFAULT LAYOUT - Standard ORB Interface                                 ║
 * ║   Balanced information density with clear visual hierarchy                ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// Layout state
let state = {
    initialized: false,
    lastRender: null,
    data: null
};

const defaultLayout = {
    name: 'default',
    description: 'Standard balanced layout with all features visible',

    /**
     * Initialize layout
     */
    init(preferences = {}) {
        state.initialized = true;
        state.preferences = preferences;
        console.log('[Layout:Default] Initialized');
    },

    /**
     * Display data in default layout
     */
    display(data, preferences = {}) {
        state.lastRender = Date.now();
        state.data = data;

        // Build layout structure
        const layout = {
            header: this.renderHeader(data),
            main: this.renderMain(data),
            sidebar: this.renderSidebar(data),
            footer: this.renderFooter(data)
        };

        // Log for terminal output
        console.log('\n╔═══════════════════════════════════════════════════════════════╗');
        console.log('║                     ORB INTERFACE                             ║');
        console.log('╠═══════════════════════════════════════════════════════════════╣');

        if (data.modules) {
            console.log('║ MODULES:');
            data.modules.forEach(m => {
                console.log(`║   • ${m.node || 'Unknown'}: ${m.output ? 'OK' : 'Error'}`);
            });
        }

        if (data.avatars) {
            console.log('╠───────────────────────────────────────────────────────────────╣');
            console.log('║ AVATARS:');
            if (data.avatars.twin) {
                console.log(`║   Twin: ${data.avatars.twin.name} (${data.avatars.twin.mood})`);
            }
            if (data.avatars.spiritAnimal) {
                console.log(`║   Spirit: ${data.avatars.spiritAnimal.species} (${data.avatars.spiritAnimal.energy})`);
            }
        }

        if (data.security) {
            console.log('╠───────────────────────────────────────────────────────────────╣');
            console.log(`║ SECURITY: Risk ${(data.security.riskScore * 100).toFixed(0)}%`);
            if (data.security.anomalies?.length > 0) {
                console.log(`║   Anomalies: ${data.security.anomalies.join(', ')}`);
            }
        }

        console.log('╚═══════════════════════════════════════════════════════════════╝\n');

        return layout;
    },

    /**
     * Render header section
     */
    renderHeader(data) {
        return {
            title: 'ORB Interface',
            timestamp: new Date().toISOString(),
            status: data.security?.blocked ? 'blocked' : 'active'
        };
    },

    /**
     * Render main content
     */
    renderMain(data) {
        return {
            modules: data.modules?.map(m => ({
                name: m.node,
                status: m.output ? 'success' : 'error',
                output: m.output
            })) || []
        };
    },

    /**
     * Render sidebar
     */
    renderSidebar(data) {
        return {
            avatars: data.avatars || {},
            quickActions: ['refresh', 'settings', 'help']
        };
    },

    /**
     * Render footer
     */
    renderFooter(data) {
        return {
            security: data.security || {},
            version: '0r8 v1.0'
        };
    },

    /**
     * Update layout with new data
     */
    update(data, preferences = {}) {
        return this.display({ ...state.data, ...data }, preferences);
    },

    /**
     * Destroy layout
     */
    destroy() {
        state = { initialized: false, lastRender: null, data: null };
        console.log('[Layout:Default] Destroyed');
    },

    /**
     * Get current state
     */
    getState() {
        return { ...state };
    }
};

export default defaultLayout;

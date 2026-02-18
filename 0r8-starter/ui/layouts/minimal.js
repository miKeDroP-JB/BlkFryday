/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   MINIMAL LAYOUT - Distraction-Free Interface                             ║
 * ║   Focus on content, hide the chrome                                       ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

let state = {
    initialized: false,
    lastRender: null,
    data: null
};

const minimalLayout = {
    name: 'minimal',
    description: 'Clean, distraction-free interface focused on content',

    /**
     * Initialize layout
     */
    init(preferences = {}) {
        state.initialized = true;
        state.preferences = preferences;
        console.log('[Layout:Minimal] Initialized');
    },

    /**
     * Display data in minimal layout
     */
    display(data, preferences = {}) {
        state.lastRender = Date.now();
        state.data = data;

        // Minimal output
        console.log('\n┌───────────────────────────────────────┐');

        if (data.modules && data.modules.length > 0) {
            const primary = data.modules[0];
            if (primary.output?.data) {
                try {
                    const parsed = JSON.parse(primary.output.data);
                    console.log(`│ ${parsed.text || 'Processing...'}`);
                } catch {
                    console.log(`│ ${primary.node}: Ready`);
                }
            } else {
                console.log(`│ ${primary.node}: Ready`);
            }
        } else {
            console.log('│ Awaiting input...');
        }

        if (data.security?.blocked) {
            console.log('│ ⚠ Security alert');
        }

        console.log('└───────────────────────────────────────┘\n');

        return {
            content: this.extractContent(data),
            status: data.security?.blocked ? 'blocked' : 'ready'
        };
    },

    /**
     * Extract primary content
     */
    extractContent(data) {
        if (!data.modules || data.modules.length === 0) {
            return null;
        }

        const primary = data.modules[0];
        if (primary.output?.data) {
            try {
                return JSON.parse(primary.output.data);
            } catch {
                return primary.output;
            }
        }
        return primary.output;
    },

    /**
     * Update layout
     */
    update(data, preferences = {}) {
        return this.display({ ...state.data, ...data }, preferences);
    },

    /**
     * Destroy layout
     */
    destroy() {
        state = { initialized: false, lastRender: null, data: null };
        console.log('[Layout:Minimal] Destroyed');
    },

    /**
     * Get current state
     */
    getState() {
        return { ...state };
    }
};

export default minimalLayout;

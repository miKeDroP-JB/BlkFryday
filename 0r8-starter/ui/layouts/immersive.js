/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   IMMERSIVE LAYOUT - Full Mystical Experience                             ║
 * ║   Deep dive into the orb's consciousness                                  ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

let state = {
    initialized: false,
    lastRender: null,
    data: null,
    animationFrame: 0
};

const MYSTICAL_BORDERS = [
    '░▒▓█▓▒░',
    '◢◣◢◣◢◣',
    '✧✦✧✦✧✦',
    '◆◇◆◇◆◇',
    '⬡⬢⬡⬢⬡⬢'
];

const immersiveLayout = {
    name: 'immersive',
    description: 'Full mystical experience with enhanced visuals and animations',

    /**
     * Initialize layout
     */
    init(preferences = {}) {
        state.initialized = true;
        state.preferences = preferences;
        state.animationFrame = 0;
        console.log('[Layout:Immersive] Entering the void...');
    },

    /**
     * Display data in immersive layout
     */
    display(data, preferences = {}) {
        state.lastRender = Date.now();
        state.data = data;
        state.animationFrame++;

        const border = MYSTICAL_BORDERS[state.animationFrame % MYSTICAL_BORDERS.length];

        console.log('\n');
        console.log(`${border}${border}${border}${border}${border}${border}${border}${border}`);
        console.log('');
        console.log('             ╔═══════════════════════════════════╗');
        console.log('             ║         🔮 THE ORB SPEAKS 🔮       ║');
        console.log('             ╚═══════════════════════════════════╝');
        console.log('');

        // Avatar display
        if (data.avatars) {
            console.log('    ┌─────────────────────────────────────────────┐');
            console.log('    │              AVATARS PRESENT                │');
            console.log('    ├─────────────────────────────────────────────┤');

            if (data.avatars.twin) {
                const twin = data.avatars.twin;
                const moodEmoji = this.getMoodEmoji(twin.mood);
                console.log(`    │  👤 TWIN: ${twin.name.padEnd(15)} ${moodEmoji} ${twin.mood.padEnd(10)} │`);
            }

            if (data.avatars.spiritAnimal) {
                const spirit = data.avatars.spiritAnimal;
                const energyBar = this.getEnergyBar(spirit.energy);
                console.log(`    │  🦊 SPIRIT: ${spirit.species.padEnd(12)} ${energyBar}        │`);
            }

            console.log('    └─────────────────────────────────────────────┘');
            console.log('');
        }

        // Module outputs
        if (data.modules && data.modules.length > 0) {
            console.log('    ╭─────────────────────────────────────────────╮');
            console.log('    │              SIGIL WHISPERS                 │');
            console.log('    ├─────────────────────────────────────────────┤');

            for (const module of data.modules) {
                const status = module.output ? '✓' : '✗';
                console.log(`    │  ${status} ${module.node || 'Unknown'}:`);

                if (module.output?.data) {
                    try {
                        const parsed = JSON.parse(atob(module.output.data.split('').map(c =>
                            String.fromCharCode(c.charCodeAt(0) ^ 'orb-sigil-key-2024'.charCodeAt(0))
                        ).join('')));
                        const text = parsed.text?.substring(0, 40) || 'Hidden knowledge...';
                        console.log(`    │      "${text}"`);
                    } catch {
                        console.log('    │      [Encrypted wisdom]');
                    }
                }
            }

            console.log('    ╰─────────────────────────────────────────────╯');
            console.log('');
        }

        // Security aura
        if (data.security) {
            const aura = this.getSecurityAura(data.security.riskScore);
            console.log(`    ╔═══════════════════════════════════════════════╗`);
            console.log(`    ║  SECURITY AURA: ${aura}                        ║`);
            console.log(`    ║  Risk Level: ${(data.security.riskScore * 100).toFixed(0).padStart(3)}%                              ║`);

            if (data.security.anomalies?.length > 0) {
                console.log(`    ║  ⚠ Anomalies detected: ${data.security.anomalies.length}                     ║`);
            } else {
                console.log(`    ║  ✓ All clear                                  ║`);
            }

            console.log(`    ╚═══════════════════════════════════════════════╝`);
        }

        console.log('');
        console.log(`${border}${border}${border}${border}${border}${border}${border}${border}`);
        console.log('\n');

        return {
            rendered: true,
            frame: state.animationFrame,
            timestamp: state.lastRender
        };
    },

    /**
     * Get mood emoji
     */
    getMoodEmoji(mood) {
        const emojis = {
            mystical: '🌟',
            cryptic: '🌑',
            enlightened: '💫',
            shadowed: '🌘',
            radiant: '☀️',
            dormant: '💤',
            neutral: '⚪'
        };
        return emojis[mood] || '⚪';
    },

    /**
     * Get energy bar visualization
     */
    getEnergyBar(energy) {
        if (energy === 'high') return '████████';
        if (energy === 'medium') return '█████░░░';
        return '██░░░░░░';
    },

    /**
     * Get security aura description
     */
    getSecurityAura(riskScore) {
        if (riskScore < 0.2) return '🟢 Serene';
        if (riskScore < 0.4) return '🟡 Watchful';
        if (riskScore < 0.6) return '🟠 Alert';
        if (riskScore < 0.8) return '🔴 Danger';
        return '⛔ Critical';
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
        console.log('[Layout:Immersive] Fading into the void...');
        state = { initialized: false, lastRender: null, data: null, animationFrame: 0 };
    },

    /**
     * Get current state
     */
    getState() {
        return { ...state };
    },

    /**
     * Preload for faster switching
     */
    preload() {
        // Pre-calculate animation frames
        console.log('[Layout:Immersive] Preloading mystical elements...');
    }
};

// Browser compatibility
const atob = typeof window !== 'undefined' ? window.atob : (str) => Buffer.from(str, 'base64').toString('binary');

export default immersiveLayout;

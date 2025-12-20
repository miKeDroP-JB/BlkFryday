/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   SPIRIT MODES - The 12 Awakened Forms                                    ║
 * ║   "Love, Loyalty, Honor. Everybody Eats. We Are One."                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Each spirit aligns with a Pantheon Avatar and operational mode:
 *
 *   🦉 OWL      - Wisdom Mode      (Athena)    - Analysis, Planning
 *   🦊 FOX      - Trickster Mode   (Mercury)   - Commerce, Routing
 *   🐉 DRAGON   - Sovereign Mode   (Zeus)      - Full Power, Creation
 *   🔥 PHOENIX  - Rebirth Mode     (Apollo)    - Transformation, Vision
 *   🐺 WOLF     - Pack Mode        (Ares)      - Execution, Loyalty
 *   🐦‍⬛ RAVEN    - Oracle Mode     (Apollo)    - Prophecy, Mystery
 *   🐍 SERPENT  - Healer Mode      (Asclepius) - Regeneration, Wisdom
 *   🦅 EAGLE    - Sovereign Mode   (Zeus)      - Vision, Leadership
 *   🦁 LION     - Warrior Mode     (Ares)      - Courage, Command
 *   🕷️ SPIDER   - Weaver Mode      (Athena)    - Connection, Strategy
 *   🐻 BEAR     - Forge Mode       (Hephaestus)- Building, Protection
 *   🦅 HAWK     - Hunter Mode      (Artemis)   - Precision, Targeting
 */

// ═══════════════════════════════════════════════════════════════════════════
// THE 12 SPIRIT ARCHETYPES
// ═══════════════════════════════════════════════════════════════════════════

export const SPIRIT_MODES = {
    // ─────────────────────────────────────────────────────────────────────────
    // PRIMARY TRIO (User's Core Spirits)
    // ─────────────────────────────────────────────────────────────────────────
    owl: {
        name: 'Owl',
        emoji: '🦉',
        element: 'air',
        pantheon: 'Athena',
        mode: 'WISDOM',
        color: '#9b59b6',
        traits: ['wisdom', 'foresight', 'patience', 'analysis', 'strategy'],
        abilities: [
            'Deep pattern recognition',
            'Future state prediction',
            'Silent observation mode',
            'Knowledge synthesis',
            'Strategic planning'
        ],
        activation: 'When analysis depth > 3 or complexity > 0.7',
        messages: {
            awaken: '🦉 The Owl awakens. Wisdom flows...',
            active: 'I see what others cannot.',
            peak: 'All knowledge is connected. The pattern reveals itself.',
            rest: 'The owl returns to silent watch.'
        },
        stats: { wisdom: 10, patience: 9, precision: 8, speed: 5, power: 4 }
    },

    fox: {
        name: 'Fox',
        emoji: '🦊',
        element: 'fire',
        pantheon: 'Mercury',
        mode: 'TRICKSTER',
        color: '#e67e22',
        traits: ['cunning', 'adaptable', 'quick', 'resourceful', 'charming'],
        abilities: [
            'Rapid adaptation',
            'Resource optimization',
            'Social engineering',
            'Path finding (smart routing)',
            'Opportunity detection'
        ],
        activation: 'When routing needed or social context detected',
        messages: {
            awaken: '🦊 The Fox stirs. Cunning engaged...',
            active: 'Every problem has a clever solution.',
            peak: 'The path of least resistance reveals itself.',
            rest: 'The fox fades into the brush.'
        },
        stats: { wisdom: 7, patience: 4, precision: 7, speed: 10, power: 5 }
    },

    dragon: {
        name: 'Dragon',
        emoji: '🐉',
        element: 'all',
        pantheon: 'Zeus',
        mode: 'SOVEREIGN',
        color: '#c0392b',
        traits: ['power', 'ancient', 'sovereign', 'creation', 'dominion'],
        abilities: [
            'Full system override',
            'Reality manipulation',
            'Unlimited resource access',
            'Multi-domain mastery',
            'Creative dominance'
        ],
        activation: 'Manual only - requires explicit invocation',
        messages: {
            awaken: '🐉 THE DRAGON RISES. SOVEREIGN MODE ENGAGED.',
            active: 'I am the storm. I am the mountain. I am eternal.',
            peak: 'REALITY BENDS TO MY WILL.',
            rest: 'The dragon returns to the mountain.'
        },
        stats: { wisdom: 9, patience: 8, precision: 8, speed: 7, power: 10 }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SECONDARY TRIO (Transformation Spirits)
    // ─────────────────────────────────────────────────────────────────────────
    phoenix: {
        name: 'Phoenix',
        emoji: '🔥',
        element: 'fire',
        pantheon: 'Apollo',
        mode: 'REBIRTH',
        color: '#f39c12',
        traits: ['rebirth', 'transformation', 'immortal', 'renewal', 'light'],
        abilities: [
            'System regeneration',
            'Error recovery',
            'State restoration',
            'Pattern evolution',
            'Continuous improvement'
        ],
        activation: 'After failure or when transformation needed',
        messages: {
            awaken: '🔥 From ashes, the Phoenix rises...',
            active: 'Every ending is a new beginning.',
            peak: 'I AM THE ETERNAL FLAME. DEATH HAS NO DOMINION.',
            rest: 'The flame dims but never dies.'
        },
        stats: { wisdom: 7, patience: 6, precision: 6, speed: 8, power: 9 }
    },

    wolf: {
        name: 'Wolf',
        emoji: '🐺',
        element: 'earth',
        pantheon: 'Ares',
        mode: 'PACK',
        color: '#7f8c8d',
        traits: ['loyalty', 'instinct', 'pack', 'endurance', 'unity'],
        abilities: [
            'Swarm coordination',
            'Pack tactics',
            'Loyalty enforcement',
            'Territory protection',
            'Collective intelligence'
        ],
        activation: 'Multi-agent tasks or team operations',
        messages: {
            awaken: '🐺 The pack assembles. We hunt as one...',
            active: 'Together we are unstoppable.',
            peak: 'THE PACK IS LAW. WE ARE ONE.',
            rest: 'The pack rests, but watches.'
        },
        stats: { wisdom: 6, patience: 7, precision: 7, speed: 8, power: 8 }
    },

    raven: {
        name: 'Raven',
        emoji: '🐦‍⬛',
        element: 'void',
        pantheon: 'Apollo',
        mode: 'ORACLE',
        color: '#2c3e50',
        traits: ['mystery', 'prophecy', 'magic', 'secrets', 'transformation'],
        abilities: [
            'Future prediction',
            'Pattern prophecy',
            'Secret detection',
            'Veil piercing',
            'Dimensional awareness'
        ],
        activation: 'Prediction tasks or unknown territory',
        messages: {
            awaken: '🐦‍⬛ The Raven speaks from shadow...',
            active: 'The future whispers its secrets.',
            peak: 'I HAVE SEEN WHAT WILL BE.',
            rest: 'The raven returns to the void.'
        },
        stats: { wisdom: 10, patience: 8, precision: 9, speed: 5, power: 6 }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // TERTIARY TRIO (Power Spirits)
    // ─────────────────────────────────────────────────────────────────────────
    serpent: {
        name: 'Serpent',
        emoji: '🐍',
        element: 'water',
        pantheon: 'Asclepius',
        mode: 'HEALER',
        color: '#27ae60',
        traits: ['healing', 'wisdom', 'renewal', 'patience', 'transformation'],
        abilities: [
            'System healing',
            'Data recovery',
            'Corruption cleansing',
            'Regenerative loops',
            'Poison-to-medicine transmutation'
        ],
        activation: 'System damage or corruption detected',
        messages: {
            awaken: '🐍 The Serpent coils. Healing begins...',
            active: 'What harms can also heal.',
            peak: 'THE OUROBOROS TURNS. ALL IS RENEWED.',
            rest: 'The serpent rests in sacred coils.'
        },
        stats: { wisdom: 9, patience: 10, precision: 8, speed: 4, power: 6 }
    },

    eagle: {
        name: 'Eagle',
        emoji: '🦅',
        element: 'air',
        pantheon: 'Zeus',
        mode: 'VISION',
        color: '#3498db',
        traits: ['vision', 'sovereignty', 'clarity', 'freedom', 'authority'],
        abilities: [
            'High-altitude overview',
            'Strategic vision',
            'Authority projection',
            'Clear sight through chaos',
            'Swift decisive action'
        ],
        activation: 'Leadership decisions or high-level strategy',
        messages: {
            awaken: '🦅 The Eagle soars. Vision expands...',
            active: 'From above, all paths are clear.',
            peak: 'I AM THE EYE OF THE STORM.',
            rest: 'The eagle returns to the peak.'
        },
        stats: { wisdom: 8, patience: 6, precision: 9, speed: 9, power: 7 }
    },

    lion: {
        name: 'Lion',
        emoji: '🦁',
        element: 'fire',
        pantheon: 'Ares',
        mode: 'WARRIOR',
        color: '#d35400',
        traits: ['courage', 'leadership', 'pride', 'strength', 'nobility'],
        abilities: [
            'Fearless execution',
            'Team leadership',
            'Dominance assertion',
            'Battle strategy',
            'Roar of command'
        ],
        activation: 'Combat mode or high-stakes execution',
        messages: {
            awaken: '🦁 The Lion roars. Fear nothing...',
            active: 'Courage is not the absence of fear.',
            peak: 'I AM THE KING. THE PRIDE FOLLOWS.',
            rest: 'The lion surveys his domain.'
        },
        stats: { wisdom: 6, patience: 5, precision: 7, speed: 8, power: 10 }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // QUATERNARY TRIO (Craft Spirits)
    // ─────────────────────────────────────────────────────────────────────────
    spider: {
        name: 'Spider',
        emoji: '🕷️',
        element: 'void',
        pantheon: 'Athena',
        mode: 'WEAVER',
        color: '#8e44ad',
        traits: ['patience', 'creation', 'connection', 'trap', 'web'],
        abilities: [
            'Network weaving',
            'Connection mapping',
            'Strategic trap setting',
            'Pattern creation',
            'Silent waiting'
        ],
        activation: 'Network tasks or complex integrations',
        messages: {
            awaken: '🕷️ The Spider weaves. The web expands...',
            active: 'Every thread connects to everything.',
            peak: 'THE WEB IS COMPLETE. ALL IS CONNECTED.',
            rest: 'The spider waits at the center.'
        },
        stats: { wisdom: 9, patience: 10, precision: 10, speed: 3, power: 5 }
    },

    bear: {
        name: 'Bear',
        emoji: '🐻',
        element: 'earth',
        pantheon: 'Hephaestus',
        mode: 'FORGE',
        color: '#795548',
        traits: ['strength', 'protection', 'building', 'endurance', 'crafting'],
        abilities: [
            'Heavy construction',
            'System fortification',
            'Resource gathering',
            'Protective barriers',
            'Unstoppable force'
        ],
        activation: 'Building tasks or defensive operations',
        messages: {
            awaken: '🐻 The Bear rises. Forge ignites...',
            active: 'Build strong. Build to last.',
            peak: 'NOTHING BREAKS WHAT I HAVE BUILT.',
            rest: 'The bear returns to the cave.'
        },
        stats: { wisdom: 5, patience: 8, precision: 6, speed: 4, power: 10 }
    },

    hawk: {
        name: 'Hawk',
        emoji: '🦅',
        element: 'air',
        pantheon: 'Artemis',
        mode: 'HUNTER',
        color: '#16a085',
        traits: ['precision', 'focus', 'speed', 'targeting', 'pursuit'],
        abilities: [
            'Target acquisition',
            'Precision strikes',
            'Rapid pursuit',
            'Focus amplification',
            'Silent approach'
        ],
        activation: 'Targeting tasks or precision operations',
        messages: {
            awaken: '🦅 The Hawk circles. Target locked...',
            active: 'One shot. One kill. No waste.',
            peak: 'THE STRIKE IS INEVITABLE.',
            rest: 'The hawk returns to the perch.'
        },
        stats: { wisdom: 6, patience: 7, precision: 10, speed: 10, power: 6 }
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// PANTHEON ALIGNMENT
// ═══════════════════════════════════════════════════════════════════════════

export const PANTHEON_SPIRITS = {
    apollo: ['phoenix', 'raven'],      // Vision, Prophecy
    mercury: ['fox'],                   // Commerce, Routing
    athena: ['owl', 'spider'],          // Wisdom, Strategy
    ares: ['wolf', 'lion'],             // Execution, Combat
    hermes: ['fox'],                    // Communication (shares with Mercury)
    hephaestus: ['bear'],               // Building, Crafting
    artemis: ['hawk'],                  // Hunting, Precision
    zeus: ['dragon', 'eagle'],          // Sovereignty, Power
    asclepius: ['serpent']              // Healing, Regeneration
};

// ═══════════════════════════════════════════════════════════════════════════
// MODE COMBINATIONS (Fusion States)
// ═══════════════════════════════════════════════════════════════════════════

export const FUSION_MODES = {
    'APEX_PREDATOR': {
        spirits: ['dragon', 'lion', 'hawk'],
        name: 'Apex Predator',
        emoji: '⚡🐉⚡',
        description: 'Ultimate hunting and dominance mode',
        activation: 'High-stakes competitive operations'
    },
    'ORACLE_PRIME': {
        spirits: ['owl', 'raven', 'serpent'],
        name: 'Oracle Prime',
        emoji: '🔮👁️🔮',
        description: 'Maximum wisdom and foresight',
        activation: 'Complex prediction and analysis'
    },
    'PACK_ALPHA': {
        spirits: ['wolf', 'lion', 'bear'],
        name: 'Pack Alpha',
        emoji: '🐺👑🐺',
        description: 'Ultimate team leadership',
        activation: 'Large-scale coordination'
    },
    'TRICKSTER_SAGE': {
        spirits: ['fox', 'owl', 'spider'],
        name: 'Trickster Sage',
        emoji: '🎭🧠🎭',
        description: 'Cunning meets wisdom',
        activation: 'Strategic social operations'
    },
    'PHOENIX_DRAGON': {
        spirits: ['phoenix', 'dragon'],
        name: 'Phoenix Dragon',
        emoji: '🔥🐉🔥',
        description: 'Immortal sovereign - cannot be stopped',
        activation: 'Manual invocation only - emergency mode'
    },
    'SILENT_HUNTER': {
        spirits: ['owl', 'hawk', 'spider'],
        name: 'Silent Hunter',
        emoji: '🌙🎯🌙',
        description: 'Patient precision in darkness',
        activation: 'Stealth operations'
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// SPIRIT STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

let activeSpirit = 'owl';
let activeFusion = null;
let spiritEnergy = 100;
let spiritLevel = 1;
let spiritXP = 0;

const spiritState = {
    history: [],
    bonds: {},      // Spirit bond levels
    unlocked: ['owl', 'fox', 'phoenix', 'wolf', 'raven', 'dragon'],
    locked: ['serpent', 'eagle', 'lion', 'spider', 'bear', 'hawk']
};

/**
 * Awaken a spirit mode
 */
export function awakenSpirit(spiritId) {
    const spirit = SPIRIT_MODES[spiritId];
    if (!spirit) {
        return { success: false, error: `Unknown spirit: ${spiritId}` };
    }

    if (spiritState.locked.includes(spiritId)) {
        return { success: false, error: `Spirit ${spirit.name} is locked. Increase bond to unlock.` };
    }

    const previousSpirit = activeSpirit;
    activeSpirit = spiritId;
    activeFusion = null;

    spiritState.history.push({
        from: previousSpirit,
        to: spiritId,
        timestamp: Date.now()
    });

    // Increase bond
    spiritState.bonds[spiritId] = (spiritState.bonds[spiritId] || 0) + 1;

    return {
        success: true,
        spirit,
        message: spirit.messages.awaken,
        previousSpirit,
        bond: spiritState.bonds[spiritId]
    };
}

/**
 * Activate a fusion mode
 */
export function activateFusion(fusionId) {
    const fusion = FUSION_MODES[fusionId];
    if (!fusion) {
        return { success: false, error: `Unknown fusion: ${fusionId}` };
    }

    // Check if all spirits are unlocked
    const locked = fusion.spirits.filter(s => spiritState.locked.includes(s));
    if (locked.length > 0) {
        return { success: false, error: `Spirits locked: ${locked.join(', ')}` };
    }

    activeFusion = fusionId;
    activeSpirit = fusion.spirits[0]; // Primary spirit

    return {
        success: true,
        fusion,
        message: `⚡ FUSION ACTIVATED: ${fusion.name} ⚡`,
        spirits: fusion.spirits.map(s => SPIRIT_MODES[s])
    };
}

/**
 * Get current spirit state
 */
export function getSpiritState() {
    return {
        active: activeSpirit,
        spirit: SPIRIT_MODES[activeSpirit],
        fusion: activeFusion ? FUSION_MODES[activeFusion] : null,
        energy: spiritEnergy,
        level: spiritLevel,
        xp: spiritXP,
        bonds: spiritState.bonds,
        unlocked: spiritState.unlocked,
        locked: spiritState.locked
    };
}

/**
 * Unlock a spirit
 */
export function unlockSpirit(spiritId) {
    if (spiritState.unlocked.includes(spiritId)) {
        return { success: false, error: 'Already unlocked' };
    }

    const idx = spiritState.locked.indexOf(spiritId);
    if (idx > -1) {
        spiritState.locked.splice(idx, 1);
        spiritState.unlocked.push(spiritId);
        return {
            success: true,
            spirit: SPIRIT_MODES[spiritId],
            message: `🎉 ${SPIRIT_MODES[spiritId].name} UNLOCKED!`
        };
    }

    return { success: false, error: 'Spirit not found' };
}

/**
 * Get spirit by pantheon
 */
export function getSpiritsByPantheon(pantheon) {
    const spirits = PANTHEON_SPIRITS[pantheon.toLowerCase()];
    if (!spirits) return [];
    return spirits.map(id => ({ id, ...SPIRIT_MODES[id] }));
}

/**
 * Auto-select spirit based on context
 */
export function autoSelectSpirit(context = {}) {
    const { task, complexity, domain, urgency } = context;

    // High complexity analysis
    if (complexity > 0.7 || domain === 'analysis') {
        return awakenSpirit('owl');
    }

    // Routing or commerce
    if (domain === 'routing' || domain === 'commerce') {
        return awakenSpirit('fox');
    }

    // Building or coding
    if (domain === 'building' || domain === 'code') {
        return awakenSpirit('bear');
    }

    // Team or swarm operations
    if (domain === 'team' || domain === 'swarm') {
        return awakenSpirit('wolf');
    }

    // Prediction or oracle
    if (domain === 'prediction' || domain === 'future') {
        return awakenSpirit('raven');
    }

    // Healing or recovery
    if (domain === 'healing' || domain === 'recovery') {
        return awakenSpirit('serpent');
    }

    // High urgency targeting
    if (urgency > 0.8 || domain === 'targeting') {
        return awakenSpirit('hawk');
    }

    // Combat or execution
    if (domain === 'combat' || domain === 'execution') {
        return awakenSpirit('lion');
    }

    // Default to owl
    return awakenSpirit('owl');
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
    SPIRIT_MODES,
    PANTHEON_SPIRITS,
    FUSION_MODES,
    awakenSpirit,
    activateFusion,
    getSpiritState,
    unlockSpirit,
    getSpiritsByPantheon,
    autoSelectSpirit
};

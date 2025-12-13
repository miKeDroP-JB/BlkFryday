/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   TWIN AVATAR - Your Digital Mirror Self                                  ║
 * ║   Levels up through interaction • Unlocks abilities • Trusted boost       ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// Ability unlocks per level
const ABILITY_TREE = {
    1: { name: 'observe', description: 'Basic awareness' },
    2: { name: 'remember', description: 'Short-term memory' },
    3: { name: 'suggest', description: 'Simple recommendations' },
    4: { name: 'analyze', description: 'Pattern recognition' },
    5: { name: 'predict', description: 'Outcome forecasting' },
    6: { name: 'create', description: 'Content generation' },
    7: { name: 'innovate', description: 'Novel solutions' },
    8: { name: 'transcend', description: 'Cross-domain insights' },
    9: { name: 'manifest', description: 'Reality shaping' },
    10: { name: 'omniscient', description: 'Full awareness' }
};

// Secret abilities for trusted creators only
const TRUSTED_ABILITIES = {
    5: { name: 'research_boost', description: 'Enhanced discovery rate' },
    7: { name: 'simulation', description: 'Run hypothetical scenarios' },
    10: { name: 'genesis', description: 'Create new AI modules' }
};

// Mood states
const MOODS = {
    neutral: { emoji: '😐', color: '#808080' },
    happy: { emoji: '😊', color: '#FFD700' },
    focused: { emoji: '🎯', color: '#4169E1' },
    creative: { emoji: '✨', color: '#9400D3' },
    tired: { emoji: '😴', color: '#A9A9A9' },
    excited: { emoji: '🔥', color: '#FF4500' },
    mystical: { emoji: '🔮', color: '#8B008B' },
    enlightened: { emoji: '💫', color: '#FFD700' }
};

/**
 * Update Twin Avatar with XP gain and leveling
 */
export function updateTwinAvatar(userContext, moduleResults = []) {
    // Initialize twin if needed
    userContext.twin = userContext.twin || {
        name: 'Twin',
        XP: 0,
        level: 1,
        abilities: ['observe'],
        totalInteractions: 0,
        discoveries: 0
    };

    const twin = userContext.twin;
    const isTrusted = userContext.trusted === true;

    // Calculate XP gain
    const baseXP = moduleResults.length * 8;
    const multiplier = isTrusted ? 2 : 1;
    const xpGained = baseXP * multiplier;

    // Add XP
    twin.XP += xpGained;
    twin.totalInteractions++;

    // Track discoveries for trusted users
    if (isTrusted && moduleResults.some(r => r.node === 'ResearchNode')) {
        twin.discoveries++;
    }

    // Level up check (every 50 XP per level)
    const xpForNextLevel = twin.level * 50;
    let levelsGained = 0;

    while (twin.XP >= xpForNextLevel && twin.level < 10) {
        twin.XP -= twin.level * 50;
        twin.level++;
        levelsGained++;

        // Unlock standard ability
        const newAbility = ABILITY_TREE[twin.level];
        if (newAbility && !twin.abilities.includes(newAbility.name)) {
            twin.abilities.push(newAbility.name);
        }

        // Unlock trusted ability if applicable
        if (isTrusted && TRUSTED_ABILITIES[twin.level]) {
            const trustedAbility = TRUSTED_ABILITIES[twin.level];
            if (!twin.abilities.includes(trustedAbility.name)) {
                twin.abilities.push(trustedAbility.name);
            }
        }
    }

    // Determine mood based on activity
    const mood = determineMood(twin, moduleResults, isTrusted);

    return {
        name: twin.name,
        XP: twin.XP,
        level: twin.level,
        xpToNext: twin.level * 50,
        xpProgress: Math.round((twin.XP / (twin.level * 50)) * 100),
        abilities: twin.abilities,
        mood: mood.name,
        moodEmoji: MOODS[mood.name]?.emoji || '😐',
        moodColor: MOODS[mood.name]?.color || '#808080',
        totalInteractions: twin.totalInteractions,
        discoveries: twin.discoveries,
        trusted: isTrusted,
        levelsGained,
        xpGained
    };
}

/**
 * Determine mood from context
 */
function determineMood(twin, results, isTrusted) {
    // Check for mystical content
    const hasMystical = results.some(r => r.node === 'Sigil');
    if (hasMystical) return { name: 'mystical' };

    // Check for research/discovery
    const hasResearch = results.some(r => r.node === 'ResearchNode');
    if (hasResearch) return { name: 'enlightened' };

    // Check for creative output
    const hasCreative = results.some(r => r.creative);
    if (hasCreative) return { name: 'creative' };

    // Level-based mood
    if (twin.level >= 8) return { name: 'enlightened' };
    if (twin.level >= 5) return { name: 'focused' };

    // Default based on trust
    return { name: isTrusted ? 'excited' : 'happy' };
}

/**
 * Get Twin stats summary
 */
export function getTwinStats(userContext) {
    const twin = userContext?.twin;
    if (!twin) return null;

    return {
        name: twin.name,
        level: twin.level,
        XP: twin.XP,
        xpToNext: twin.level * 50,
        abilities: twin.abilities,
        totalInteractions: twin.totalInteractions,
        discoveries: twin.discoveries
    };
}

/**
 * Check if Twin has specific ability
 */
export function hasAbility(userContext, abilityName) {
    return userContext?.twin?.abilities?.includes(abilityName) || false;
}

/**
 * Get all available abilities for current level
 */
export function getAvailableAbilities(level, isTrusted = false) {
    const abilities = [];

    for (let i = 1; i <= level; i++) {
        if (ABILITY_TREE[i]) {
            abilities.push(ABILITY_TREE[i]);
        }
        if (isTrusted && TRUSTED_ABILITIES[i]) {
            abilities.push({ ...TRUSTED_ABILITIES[i], trusted: true });
        }
    }

    return abilities;
}

export default {
    updateTwinAvatar,
    getTwinStats,
    hasAbility,
    getAvailableAbilities,
    ABILITY_TREE,
    TRUSTED_ABILITIES,
    MOODS
};

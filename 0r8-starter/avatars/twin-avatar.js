/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   TWIN AVATAR - Your Digital Mirror Self                                  ║
 * ║   Learns from you, evolves with you, represents you                       ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// Default twin template
const DEFAULT_TWIN = {
    name: 'Twin',
    mood: 'neutral',
    energy: 100,
    level: 1,
    xp: 0,
    abilities: [],
    traits: [],
    memory: []
};

// Mood states and transitions
const MOODS = {
    neutral: { emoji: '😐', color: '#808080', energy: 0 },
    happy: { emoji: '😊', color: '#FFD700', energy: 10 },
    focused: { emoji: '🎯', color: '#4169E1', energy: -5 },
    creative: { emoji: '✨', color: '#9400D3', energy: -10 },
    tired: { emoji: '😴', color: '#A9A9A9', energy: -20 },
    excited: { emoji: '🔥', color: '#FF4500', energy: 15 },
    calm: { emoji: '🧘', color: '#20B2AA', energy: 5 },
    mystical: { emoji: '🔮', color: '#8B008B', energy: 0 }
};

// Ability tiers
const ABILITIES = {
    tier1: ['observe', 'remember', 'suggest'],
    tier2: ['analyze', 'predict', 'create'],
    tier3: ['innovate', 'transcend', 'manifest']
};

// Twin state cache
const twins = {};

/**
 * Update or create twin avatar based on context
 */
export function updateTwinAvatar(userContext, moduleResults = []) {
    const userId = userContext?.userId || 'default';

    // Get or create twin
    if (!twins[userId]) {
        twins[userId] = createTwin(userContext);
    }

    const twin = twins[userId];

    // Determine mood from module results
    const newMood = determineMood(moduleResults, twin);
    if (newMood !== twin.mood) {
        twin.mood = newMood;
        twin.moodHistory = twin.moodHistory || [];
        twin.moodHistory.push({ mood: newMood, timestamp: Date.now() });

        // Keep mood history manageable
        if (twin.moodHistory.length > 100) {
            twin.moodHistory = twin.moodHistory.slice(-50);
        }
    }

    // Update energy
    const moodData = MOODS[newMood] || MOODS.neutral;
    twin.energy = Math.max(0, Math.min(100, twin.energy + moodData.energy));

    // Gain XP from interactions
    const xpGained = calculateXP(moduleResults);
    twin.xp += xpGained;

    // Level up check
    const xpForNextLevel = twin.level * 100;
    if (twin.xp >= xpForNextLevel) {
        twin.level++;
        twin.xp -= xpForNextLevel;
        unlockAbility(twin);
    }

    // Learn from results
    learnFromResults(twin, moduleResults);

    // Update last active
    twin.lastActive = Date.now();

    return {
        name: twin.name,
        mood: twin.mood,
        moodEmoji: moodData.emoji,
        moodColor: moodData.color,
        energy: twin.energy,
        level: twin.level,
        xp: twin.xp,
        xpToNext: twin.level * 100,
        abilities: twin.abilities,
        traits: twin.traits
    };
}

/**
 * Create a new twin
 */
function createTwin(userContext) {
    const twin = { ...DEFAULT_TWIN };

    // Personalize from context
    if (userContext?.preferences?.twinName) {
        twin.name = userContext.preferences.twinName;
    }

    // Initial traits from preferences
    if (userContext?.preferences?.traits) {
        twin.traits = [...userContext.preferences.traits];
    }

    // Start with tier 1 abilities
    twin.abilities = [...ABILITIES.tier1];

    twin.created = Date.now();
    twin.lastActive = Date.now();

    return twin;
}

/**
 * Determine mood from module results
 */
function determineMood(results, twin) {
    if (!results || results.length === 0) {
        return twin.energy < 30 ? 'tired' : 'neutral';
    }

    // Analyze results
    const successCount = results.filter(r => r.output || r.lawful).length;
    const totalCount = results.length;
    const successRate = successCount / totalCount;

    // Check for specific patterns
    const hasMystical = results.some(r => r.node === 'Sigil' || r.pattern);
    const hasCreative = results.some(r => r.output?.creative || r.type === 'create');
    const hasAnalysis = results.some(r => r.output?.analysis || r.type === 'analyze');

    if (hasMystical) return 'mystical';
    if (hasCreative && successRate > 0.7) return 'creative';
    if (hasAnalysis) return 'focused';
    if (successRate > 0.8) return 'excited';
    if (successRate > 0.5) return 'happy';
    if (twin.energy < 30) return 'tired';

    return 'calm';
}

/**
 * Calculate XP gained from results
 */
function calculateXP(results) {
    if (!results || results.length === 0) return 1;

    let xp = results.length; // Base XP per interaction

    // Bonus for successful results
    xp += results.filter(r => r.output || r.lawful).length * 2;

    // Bonus for mystical results
    xp += results.filter(r => r.node === 'Sigil').length * 5;

    return xp;
}

/**
 * Unlock new ability on level up
 */
function unlockAbility(twin) {
    if (twin.level >= 5 && twin.level < 10) {
        // Unlock tier 2 abilities
        const tier2 = ABILITIES.tier2.filter(a => !twin.abilities.includes(a));
        if (tier2.length > 0) {
            twin.abilities.push(tier2[0]);
        }
    } else if (twin.level >= 10) {
        // Unlock tier 3 abilities
        const tier3 = ABILITIES.tier3.filter(a => !twin.abilities.includes(a));
        if (tier3.length > 0) {
            twin.abilities.push(tier3[0]);
        }
    }
}

/**
 * Learn from module results
 */
function learnFromResults(twin, results) {
    if (!results || results.length === 0) return;

    for (const result of results) {
        // Extract learnable patterns
        if (result.lawful && result.pattern) {
            twin.memory.push({
                type: 'pattern',
                pattern: result.pattern,
                timestamp: Date.now()
            });
        }

        // Learn from outputs
        if (result.output?.text) {
            twin.memory.push({
                type: 'interaction',
                node: result.node,
                timestamp: Date.now()
            });
        }
    }

    // Keep memory manageable
    if (twin.memory.length > 1000) {
        twin.memory = twin.memory.slice(-500);
    }
}

/**
 * Get twin stats
 */
export function getTwinStats(userId = 'default') {
    const twin = twins[userId];
    if (!twin) return null;

    return {
        name: twin.name,
        level: twin.level,
        xp: twin.xp,
        energy: twin.energy,
        abilities: twin.abilities.length,
        traits: twin.traits.length,
        memories: twin.memory.length,
        age: Date.now() - twin.created,
        mood: twin.mood
    };
}

/**
 * Reset twin
 */
export function resetTwin(userId = 'default') {
    delete twins[userId];
    return true;
}

export default {
    updateTwinAvatar,
    getTwinStats,
    resetTwin,
    MOODS,
    ABILITIES
};

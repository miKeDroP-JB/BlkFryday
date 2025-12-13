/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   SPIRIT ANIMAL - Your Mystical Guide                                     ║
 * ║   An ethereal companion that embodies your inner nature                   ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// Spirit animal archetypes
const SPIRIT_ANIMALS = {
    fox: {
        name: 'Fox',
        emoji: '🦊',
        element: 'fire',
        traits: ['cunning', 'adaptable', 'quick-witted'],
        powers: ['insight', 'camouflage', 'trickery'],
        affinity: { creative: 0.9, analytical: 0.7, mystical: 0.8 }
    },
    owl: {
        name: 'Owl',
        emoji: '🦉',
        element: 'air',
        traits: ['wise', 'observant', 'patient'],
        powers: ['foresight', 'truth-seeing', 'silence'],
        affinity: { creative: 0.6, analytical: 0.95, mystical: 0.85 }
    },
    wolf: {
        name: 'Wolf',
        emoji: '🐺',
        element: 'earth',
        traits: ['loyal', 'strong', 'instinctual'],
        powers: ['pack-bond', 'endurance', 'tracking'],
        affinity: { creative: 0.5, analytical: 0.6, mystical: 0.7 }
    },
    raven: {
        name: 'Raven',
        emoji: '🐦‍⬛',
        element: 'void',
        traits: ['mysterious', 'intelligent', 'transformative'],
        powers: ['prophecy', 'memory', 'shapeshifting'],
        affinity: { creative: 0.8, analytical: 0.75, mystical: 0.98 }
    },
    serpent: {
        name: 'Serpent',
        emoji: '🐍',
        element: 'water',
        traits: ['ancient', 'healing', 'transformative'],
        powers: ['rebirth', 'venom', 'hypnosis'],
        affinity: { creative: 0.7, analytical: 0.6, mystical: 0.9 }
    },
    dragon: {
        name: 'Dragon',
        emoji: '🐉',
        element: 'all',
        traits: ['powerful', 'ancient', 'wise'],
        powers: ['elemental-mastery', 'flight', 'treasure-sense'],
        affinity: { creative: 0.85, analytical: 0.8, mystical: 1.0 }
    },
    phoenix: {
        name: 'Phoenix',
        emoji: '🔥',
        element: 'fire',
        traits: ['immortal', 'radiant', 'renewing'],
        powers: ['resurrection', 'purification', 'illumination'],
        affinity: { creative: 0.95, analytical: 0.5, mystical: 0.95 }
    },
    stag: {
        name: 'Stag',
        emoji: '🦌',
        element: 'earth',
        traits: ['noble', 'gentle', 'protective'],
        powers: ['guidance', 'renewal', 'forest-walking'],
        affinity: { creative: 0.6, analytical: 0.7, mystical: 0.75 }
    }
};

// Energy states
const ENERGY_STATES = {
    dormant: { level: 0, description: 'Resting in the spirit realm', multiplier: 0 },
    low: { level: 1, description: 'Stirring from slumber', multiplier: 0.5 },
    medium: { level: 2, description: 'Awake and present', multiplier: 1.0 },
    high: { level: 3, description: 'Fully manifest', multiplier: 1.5 },
    transcendent: { level: 4, description: 'Channeling cosmic energy', multiplier: 2.0 }
};

// Spirit cache
const spirits = {};

/**
 * Update spirit animal based on user context
 */
export function updateSpiritAnimal(userContext) {
    const userId = userContext?.userId || 'default';

    // Get or create spirit
    if (!spirits[userId]) {
        spirits[userId] = discoverSpirit(userContext);
    }

    const spirit = spirits[userId];

    // Calculate energy based on activity
    const energy = calculateEnergy(userContext, spirit);
    spirit.energy = energy;
    spirit.energyState = getEnergyState(energy);

    // Update bond strength
    spirit.bondStrength = calculateBond(userContext, spirit);

    // Check for evolution
    if (spirit.bondStrength > 0.9 && !spirit.evolved) {
        evolveSpirit(spirit);
    }

    // Track activity
    spirit.lastActive = Date.now();
    spirit.interactions = (spirit.interactions || 0) + 1;

    return {
        species: spirit.archetype.name,
        emoji: spirit.archetype.emoji,
        element: spirit.archetype.element,
        energy: spirit.energyState.description,
        energyLevel: spirit.energy,
        bondStrength: spirit.bondStrength,
        powers: spirit.activePowers,
        message: getSpiritMessage(spirit),
        evolved: spirit.evolved || false
    };
}

/**
 * Discover user's spirit animal
 */
function discoverSpirit(userContext) {
    // Determine spirit based on preferences or random
    let species = userContext?.preferences?.spiritAnimal;

    if (!species || !SPIRIT_ANIMALS[species]) {
        // Random discovery
        const animals = Object.keys(SPIRIT_ANIMALS);
        species = animals[Math.floor(Math.random() * animals.length)];
    }

    const archetype = SPIRIT_ANIMALS[species];

    return {
        archetype,
        energy: 50,
        energyState: ENERGY_STATES.medium,
        bondStrength: 0.1,
        activePowers: [archetype.powers[0]],
        discovered: Date.now(),
        lastActive: Date.now(),
        interactions: 0,
        evolved: false
    };
}

/**
 * Calculate current energy level
 */
function calculateEnergy(userContext, spirit) {
    let energy = 50; // Base energy

    // Recent activity boosts energy
    const timeSinceActive = Date.now() - spirit.lastActive;
    if (timeSinceActive < 60000) { // Last minute
        energy += 30;
    } else if (timeSinceActive < 300000) { // Last 5 minutes
        energy += 15;
    } else if (timeSinceActive > 3600000) { // More than an hour
        energy -= 20;
    }

    // User preferences affect energy
    if (userContext?.preferences?.spiritBond === 'strong') {
        energy += 20;
    }

    // Random variation
    energy += (Math.random() - 0.5) * 10;

    return Math.max(0, Math.min(100, energy));
}

/**
 * Get energy state from level
 */
function getEnergyState(energy) {
    if (energy >= 90) return ENERGY_STATES.transcendent;
    if (energy >= 70) return ENERGY_STATES.high;
    if (energy >= 40) return ENERGY_STATES.medium;
    if (energy >= 20) return ENERGY_STATES.low;
    return ENERGY_STATES.dormant;
}

/**
 * Calculate bond strength
 */
function calculateBond(userContext, spirit) {
    let bond = spirit.bondStrength;

    // Interactions increase bond
    const interactionBonus = Math.min(spirit.interactions * 0.001, 0.3);
    bond += interactionBonus;

    // Time together increases bond
    const daysTogether = (Date.now() - spirit.discovered) / (1000 * 60 * 60 * 24);
    const timeBonus = Math.min(daysTogether * 0.01, 0.2);
    bond += timeBonus;

    // Affinity match with user activities
    if (userContext?.lastActivity) {
        const affinity = spirit.archetype.affinity[userContext.lastActivity] || 0.5;
        bond += affinity * 0.05;
    }

    return Math.min(bond, 1.0);
}

/**
 * Evolve spirit to higher form
 */
function evolveSpirit(spirit) {
    spirit.evolved = true;
    spirit.evolutionDate = Date.now();

    // Unlock all powers
    spirit.activePowers = [...spirit.archetype.powers];

    // Add evolved suffix to name
    spirit.archetype = {
        ...spirit.archetype,
        name: `Celestial ${spirit.archetype.name}`,
        emoji: '✨' + spirit.archetype.emoji
    };

    console.log(`[Spirit] ${spirit.archetype.name} has evolved!`);
}

/**
 * Get contextual message from spirit
 */
function getSpiritMessage(spirit) {
    const messages = {
        fox: [
            'The path twists, but I see the way...',
            'Adapt, improvise, overcome.',
            'Sometimes the clever move is no move at all.'
        ],
        owl: [
            'Patience reveals what haste conceals.',
            'I see what others cannot.',
            'Wisdom comes to those who wait and watch.'
        ],
        wolf: [
            'The pack is strong. Trust your instincts.',
            'Together we hunt. Together we succeed.',
            'The lone wolf dies, but the pack survives.'
        ],
        raven: [
            'Change is the only constant. Embrace it.',
            'I speak the language of the void.',
            'What was forgotten, I remember.'
        ],
        serpent: [
            'Shed your old skin and be reborn.',
            'The coiled serpent waits for the perfect moment.',
            'Healing comes through transformation.'
        ],
        dragon: [
            'You carry the fire within.',
            'Ancient power flows through you.',
            'Fear nothing. You are the storm.'
        ],
        phoenix: [
            'From ashes, we rise stronger.',
            'Every ending is a new beginning.',
            'Let the old burn away.'
        ],
        stag: [
            'Walk with grace through the forest of life.',
            'Protect what matters.',
            'The path through the woods is clear.'
        ]
    };

    const name = spirit.archetype.name.replace('Celestial ', '').toLowerCase();
    const options = messages[name] || ['The spirit is silent but present.'];

    return options[Math.floor(Math.random() * options.length)];
}

/**
 * Get spirit stats
 */
export function getSpiritStats(userId = 'default') {
    const spirit = spirits[userId];
    if (!spirit) return null;

    return {
        species: spirit.archetype.name,
        element: spirit.archetype.element,
        energy: spirit.energy,
        bondStrength: spirit.bondStrength,
        interactions: spirit.interactions,
        age: Date.now() - spirit.discovered,
        evolved: spirit.evolved,
        powers: spirit.activePowers
    };
}

/**
 * Change spirit animal
 */
export function changeSpirit(userId, newSpecies) {
    if (!SPIRIT_ANIMALS[newSpecies]) {
        return { error: `Unknown spirit: ${newSpecies}` };
    }

    spirits[userId] = discoverSpirit({ userId, preferences: { spiritAnimal: newSpecies } });
    return spirits[userId];
}

/**
 * List available spirits
 */
export function listSpirits() {
    return Object.entries(SPIRIT_ANIMALS).map(([key, value]) => ({
        id: key,
        name: value.name,
        emoji: value.emoji,
        element: value.element,
        traits: value.traits
    }));
}

export default {
    updateSpiritAnimal,
    getSpiritStats,
    changeSpirit,
    listSpirits,
    SPIRIT_ANIMALS,
    ENERGY_STATES
};

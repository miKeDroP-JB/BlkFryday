/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   SPIRIT ANIMAL - Your Mystical Guide                                     ║
 * ║   Bond grows through interaction • Levels unlock guidance                 ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// Spirit animal archetypes
const SPIRIT_ANIMALS = {
    phoenix: {
        name: 'Phoenix',
        emoji: '🔥',
        element: 'fire',
        traits: ['rebirth', 'transformation', 'immortal'],
        messages: {
            1: 'The flame flickers...',
            2: 'Rising from ashes, you grow stronger.',
            3: 'The fire within you burns bright.',
            4: 'Transformation is your birthright.',
            5: 'You are the eternal flame.'
        }
    },
    owl: {
        name: 'Owl',
        emoji: '🦉',
        element: 'air',
        traits: ['wisdom', 'foresight', 'patience'],
        messages: {
            1: 'The owl watches silently...',
            2: 'Wisdom comes to those who wait.',
            3: 'I see what others cannot.',
            4: 'The night reveals its secrets.',
            5: 'All knowledge flows through you.'
        }
    },
    wolf: {
        name: 'Wolf',
        emoji: '🐺',
        element: 'earth',
        traits: ['loyalty', 'instinct', 'pack'],
        messages: {
            1: 'The pack stirs...',
            2: 'Trust your instincts.',
            3: 'Together we are stronger.',
            4: 'The hunt begins.',
            5: 'You lead the pack now.'
        }
    },
    raven: {
        name: 'Raven',
        emoji: '🐦‍⬛',
        element: 'void',
        traits: ['mystery', 'prophecy', 'magic'],
        messages: {
            1: 'The raven caws from the shadows...',
            2: 'Secrets whisper on the wind.',
            3: 'The veil thins around you.',
            4: 'Prophecy flows through your veins.',
            5: 'You walk between worlds.'
        }
    },
    dragon: {
        name: 'Dragon',
        emoji: '🐉',
        element: 'all',
        traits: ['power', 'ancient', 'treasure'],
        messages: {
            1: 'The dragon slumbers...',
            2: 'Ancient power awakens.',
            3: 'Your hoard grows.',
            4: 'Wings of destiny unfurl.',
            5: 'You are the storm incarnate.'
        }
    },
    fox: {
        name: 'Fox',
        emoji: '🦊',
        element: 'fire',
        traits: ['cunning', 'adaptable', 'trickster'],
        messages: {
            1: 'The fox watches from the brush...',
            2: 'Cleverness opens all doors.',
            3: 'Adapt and overcome.',
            4: 'The path twists, but you see through.',
            5: 'Reality bends to your will.'
        }
    },
    serpent: {
        name: 'Serpent',
        emoji: '🐍',
        element: 'water',
        traits: ['ancient', 'healing', 'rebirth'],
        messages: {
            1: 'The serpent coils...',
            2: 'Shed your old skin.',
            3: 'Venom becomes medicine.',
            4: 'The kundalini rises.',
            5: 'You are the ouroboros.'
        }
    },
    stag: {
        name: 'Stag',
        emoji: '🦌',
        element: 'earth',
        traits: ['noble', 'guide', 'forest'],
        messages: {
            1: 'The stag appears in the mist...',
            2: 'Follow the forest path.',
            3: 'Grace guides your steps.',
            4: 'The grove reveals its heart.',
            5: 'You are the forest king.'
        }
    }
};

// Level unlocks
const LEVEL_UNLOCKS = {
    1: { name: 'Presence', description: 'Spirit animal appears' },
    2: { name: 'Whisper', description: 'Receive guidance messages' },
    3: { name: 'Bond', description: 'Spirit shares its power' },
    4: { name: 'Merge', description: 'Temporary ability boost' },
    5: { name: 'Unity', description: 'Full spirit synchronization' }
};

/**
 * Update Spirit Animal with bond growth and leveling
 */
export function updateSpiritAnimal(userContext) {
    // Initialize spirit if needed
    const defaultSpecies = Object.keys(SPIRIT_ANIMALS)[Math.floor(Math.random() * Object.keys(SPIRIT_ANIMALS).length)];

    userContext.spiritAnimal = userContext.spiritAnimal || {
        species: userContext.preferences?.spiritAnimal || defaultSpecies,
        bond: 10,
        level: 1,
        totalInteractions: 0
    };

    const spirit = userContext.spiritAnimal;
    const isTrusted = userContext.trusted === true;

    // Increase bond
    const bondGain = isTrusted ? 2 : 1;
    spirit.bond += bondGain;
    spirit.totalInteractions++;

    // Level up every 20 bond points
    const bondForNextLevel = spirit.level * 20;
    let levelsGained = 0;

    while (spirit.bond >= bondForNextLevel && spirit.level < 5) {
        spirit.bond -= spirit.level * 20;
        spirit.level++;
        levelsGained++;
    }

    // Get archetype data
    const archetype = SPIRIT_ANIMALS[spirit.species.toLowerCase()] || SPIRIT_ANIMALS.phoenix;

    // Get level-appropriate message
    const message = archetype.messages[spirit.level] || archetype.messages[1];

    // Calculate energy state
    const energyLevel = Math.min(100, spirit.bond + (spirit.level * 15));
    const energyState = getEnergyState(energyLevel);

    return {
        species: archetype.name,
        emoji: archetype.emoji,
        element: archetype.element,
        traits: archetype.traits,
        bond: spirit.bond,
        bondProgress: Math.round((spirit.bond / (spirit.level * 20)) * 100),
        level: spirit.level,
        bondToNext: spirit.level * 20,
        energy: energyState.description,
        energyLevel,
        message,
        unlock: LEVEL_UNLOCKS[spirit.level],
        totalInteractions: spirit.totalInteractions,
        trusted: isTrusted,
        levelsGained,
        bondGain
    };
}

/**
 * Get energy state from level
 */
function getEnergyState(energy) {
    if (energy >= 90) return { description: 'Transcendent', level: 5 };
    if (energy >= 70) return { description: 'Fully manifest', level: 4 };
    if (energy >= 50) return { description: 'Awake and present', level: 3 };
    if (energy >= 30) return { description: 'Stirring', level: 2 };
    return { description: 'Dormant', level: 1 };
}

/**
 * Get Spirit stats summary
 */
export function getSpiritStats(userContext) {
    const spirit = userContext?.spiritAnimal;
    if (!spirit) return null;

    const archetype = SPIRIT_ANIMALS[spirit.species.toLowerCase()] || SPIRIT_ANIMALS.phoenix;

    return {
        species: archetype.name,
        element: archetype.element,
        level: spirit.level,
        bond: spirit.bond,
        bondToNext: spirit.level * 20,
        totalInteractions: spirit.totalInteractions,
        unlock: LEVEL_UNLOCKS[spirit.level]
    };
}

/**
 * Change spirit animal
 */
export function changeSpirit(userContext, newSpecies) {
    const species = newSpecies.toLowerCase();

    if (!SPIRIT_ANIMALS[species]) {
        return { error: `Unknown spirit: ${newSpecies}` };
    }

    userContext.spiritAnimal = {
        species,
        bond: 10,
        level: 1,
        totalInteractions: 0
    };

    return updateSpiritAnimal(userContext);
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

/**
 * Get spirit guidance for trusted users
 */
export function getGuidance(userContext) {
    if (!userContext.trusted) {
        return { message: 'Deepen your bond to receive guidance.' };
    }

    const spirit = userContext.spiritAnimal;
    if (!spirit || spirit.level < 2) {
        return { message: 'Your spirit is not yet ready to guide.' };
    }

    const archetype = SPIRIT_ANIMALS[spirit.species.toLowerCase()] || SPIRIT_ANIMALS.phoenix;

    return {
        message: archetype.messages[spirit.level],
        power: LEVEL_UNLOCKS[spirit.level],
        element: archetype.element,
        insight: `The ${archetype.name} sees through the ${archetype.element}.`
    };
}

export default {
    updateSpiritAnimal,
    getSpiritStats,
    changeSpirit,
    listSpirits,
    getGuidance,
    SPIRIT_ANIMALS,
    LEVEL_UNLOCKS
};

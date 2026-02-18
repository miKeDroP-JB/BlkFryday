/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   GRIMOIRE CORE - The Memory & Knowledge Engine                           ║
 * ║   Ancient wisdom meets modern context processing                          ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// Knowledge categories
const KNOWLEDGE_TYPES = {
    FACT: 'fact',
    EXPERIENCE: 'experience',
    PREFERENCE: 'preference',
    PATTERN: 'pattern',
    INSIGHT: 'insight',
    SPELL: 'spell'  // Automated action templates
};

// The Grimoire - persistent knowledge store
const grimoire = {
    pages: [],
    spells: [],
    index: {}
};

/**
 * Process input through the Grimoire
 */
export async function grimoireProcess(input, memory) {
    const sanitized = sanitizeInput(input);
    const tokens = tokenize(sanitized);
    const intent = detectIntent(tokens);
    const relevantMemory = retrieveRelevant(memory, tokens, intent);
    const context = buildContext(sanitized, relevantMemory, intent);

    return {
        input: sanitized,
        tokens,
        intent,
        memory: relevantMemory,
        context,
        timestamp: Date.now()
    };
}

/**
 * Sanitize and normalize input
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') {
        input = String(input);
    }

    return input
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .substring(0, 5000);
}

/**
 * Tokenize input into meaningful chunks
 */
function tokenize(input) {
    // Basic word tokenization
    const words = input.split(/\s+/).filter(w => w.length > 0);

    // Extract n-grams
    const bigrams = [];
    const trigrams = [];

    for (let i = 0; i < words.length - 1; i++) {
        bigrams.push(words.slice(i, i + 2).join(' '));
    }
    for (let i = 0; i < words.length - 2; i++) {
        trigrams.push(words.slice(i, i + 3).join(' '));
    }

    // Extract entities (simple pattern matching)
    const entities = extractEntities(input);

    return {
        words,
        bigrams,
        trigrams,
        entities,
        length: words.length
    };
}

/**
 * Extract entities from input
 */
function extractEntities(input) {
    const entities = [];

    // URLs
    const urlPattern = /https?:\/\/[^\s]+/g;
    const urls = input.match(urlPattern) || [];
    urls.forEach(url => entities.push({ type: 'url', value: url }));

    // Email
    const emailPattern = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
    const emails = input.match(emailPattern) || [];
    emails.forEach(email => entities.push({ type: 'email', value: email }));

    // Numbers
    const numberPattern = /\b\d+\.?\d*\b/g;
    const numbers = input.match(numberPattern) || [];
    numbers.forEach(num => entities.push({ type: 'number', value: num }));

    // Money
    const moneyPattern = /\$\d+\.?\d*/g;
    const money = input.match(moneyPattern) || [];
    money.forEach(m => entities.push({ type: 'money', value: m }));

    return entities;
}

/**
 * Detect user intent
 */
function detectIntent(tokens) {
    const intents = {
        question: 0,
        command: 0,
        statement: 0,
        request: 0,
        search: 0
    };

    const questionWords = ['what', 'who', 'where', 'when', 'why', 'how', 'is', 'are', 'can', 'could', 'would'];
    const commandWords = ['do', 'make', 'create', 'build', 'run', 'execute', 'start', 'stop', 'delete'];
    const requestWords = ['please', 'help', 'need', 'want', 'would like', 'can you'];
    const searchWords = ['find', 'search', 'look', 'show', 'list', 'get'];

    for (const word of tokens.words) {
        if (questionWords.includes(word)) intents.question += 0.3;
        if (commandWords.includes(word)) intents.command += 0.3;
        if (requestWords.includes(word)) intents.request += 0.3;
        if (searchWords.includes(word)) intents.search += 0.3;
    }

    // Check for question mark
    if (tokens.words.some(w => w.includes('?'))) {
        intents.question += 0.5;
    }

    // Determine primary intent
    const primary = Object.entries(intents).reduce((a, b) => a[1] > b[1] ? a : b);

    return {
        primary: primary[0],
        confidence: Math.min(1, primary[1]),
        scores: intents
    };
}

/**
 * Retrieve relevant memories
 */
function retrieveRelevant(memory, tokens, intent) {
    if (!memory || !Array.isArray(memory)) {
        return [];
    }

    // Filter active memories
    const activeMemory = memory.filter(m => m && m.active !== false);

    // Score each memory for relevance
    const scored = activeMemory.map(m => {
        let score = 0;

        // Check for matching tokens
        const memoryText = (m.context || m.text || '').toLowerCase();

        for (const word of tokens.words) {
            if (memoryText.includes(word)) {
                score += 0.1;
            }
        }

        for (const bigram of tokens.bigrams) {
            if (memoryText.includes(bigram)) {
                score += 0.2;
            }
        }

        // Recency boost
        if (m.timestamp) {
            const age = Date.now() - m.timestamp;
            const hourAge = age / (1000 * 60 * 60);
            if (hourAge < 1) score += 0.3;
            else if (hourAge < 24) score += 0.2;
            else if (hourAge < 168) score += 0.1;
        }

        // Type matching
        if (m.type === KNOWLEDGE_TYPES.SPELL && intent.primary === 'command') {
            score += 0.3;
        }

        return { memory: m, score };
    });

    // Sort by score and return top results
    return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .filter(s => s.score > 0.1)
        .map(s => s.memory);
}

/**
 * Build context object
 */
function buildContext(input, relevantMemory, intent) {
    return {
        raw: input,
        intent: intent.primary,
        intentConfidence: intent.confidence,
        memoryCount: relevantMemory.length,
        hasMemory: relevantMemory.length > 0,
        entities: relevantMemory.flatMap(m => m.entities || []),
        timestamp: Date.now()
    };
}

/**
 * Add knowledge to the Grimoire
 */
export function addKnowledge(knowledge) {
    const page = {
        id: `page_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        ...knowledge,
        type: knowledge.type || KNOWLEDGE_TYPES.FACT,
        active: true,
        timestamp: Date.now()
    };

    grimoire.pages.push(page);

    // Index by type
    if (!grimoire.index[page.type]) {
        grimoire.index[page.type] = [];
    }
    grimoire.index[page.type].push(page.id);

    // Keep grimoire manageable
    if (grimoire.pages.length > 10000) {
        // Remove oldest inactive pages
        grimoire.pages = grimoire.pages
            .filter(p => p.active || Date.now() - p.timestamp < 86400000)
            .slice(-5000);
    }

    return page;
}

/**
 * Create a spell (automated action template)
 */
export function createSpell(name, trigger, action) {
    const spell = {
        id: `spell_${Date.now()}`,
        name,
        trigger,
        action,
        uses: 0,
        created: Date.now()
    };

    grimoire.spells.push(spell);
    return spell;
}

/**
 * Find and cast matching spell
 */
export function castSpell(input, context) {
    for (const spell of grimoire.spells) {
        if (matchesTrigger(input, spell.trigger)) {
            spell.uses++;
            return {
                cast: true,
                spell: spell.name,
                action: spell.action,
                context
            };
        }
    }
    return { cast: false };
}

/**
 * Check if input matches spell trigger
 */
function matchesTrigger(input, trigger) {
    if (typeof trigger === 'string') {
        return input.toLowerCase().includes(trigger.toLowerCase());
    }
    if (trigger instanceof RegExp) {
        return trigger.test(input);
    }
    if (typeof trigger === 'function') {
        return trigger(input);
    }
    return false;
}

/**
 * Get Grimoire stats
 */
export function getGrimoireStats() {
    return {
        pages: grimoire.pages.length,
        spells: grimoire.spells.length,
        types: Object.keys(grimoire.index),
        activeSpells: grimoire.spells.filter(s => s.uses > 0).length
    };
}

export {
    KNOWLEDGE_TYPES,
    tokenize,
    detectIntent,
    sanitizeInput
};

export default {
    grimoireProcess,
    addKnowledge,
    createSpell,
    castSpell,
    getGrimoireStats,
    KNOWLEDGE_TYPES
};

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   SIGIL AI NODE - Mystical Processing Engine                              ║
 * ║   Levels unlock patterns • Trusted users get all patterns instantly       ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { encryptOutput, generateId, simpleHash } from '../core/crypto-utils.js';
import { userStorage } from '../core/storage-hybrid.js';

// All Sigil patterns - unlock progressively
const ALL_PATTERNS = ['reverse', 'mirror', 'cipher', 'runes', 'whisper', 'echo', 'veil', 'essence'];

// Pattern implementations
const PATTERN_FUNCTIONS = {
    reverse: text => text.split('').reverse().join(''),
    mirror: text => text + ' | ' + text.split('').reverse().join(''),
    cipher: text => text.split('').map(c => String.fromCharCode(c.charCodeAt(0) + 1)).join(''),
    runes: text => text.toUpperCase().replace(/[AEIOU]/g, '᛫'),
    whisper: text => text.toLowerCase().replace(/\s+/g, '...'),
    echo: text => text.split(' ').map(w => w + '~' + w).join(' '),
    veil: text => text.replace(/./g, c => Math.random() > 0.3 ? c : '░'),
    essence: text => [...new Set(text.toLowerCase().replace(/[^a-z]/g, ''))].sort().join('')
};

// Pattern descriptions for UI
const PATTERN_INFO = {
    reverse: { name: 'Reverse', description: 'Mirror the words backwards', level: 1 },
    mirror: { name: 'Mirror', description: 'Reflect reality in the void', level: 1 },
    cipher: { name: 'Cipher', description: 'Shift the alphabet veil', level: 2 },
    runes: { name: 'Runes', description: 'Ancient symbols emerge', level: 3 },
    whisper: { name: 'Whisper', description: 'Silence between words', level: 4 },
    echo: { name: 'Echo', description: 'Words repeat themselves', level: 5 },
    veil: { name: 'Veil', description: 'Partial obscuration', level: 6 },
    essence: { name: 'Essence', description: 'Distill to core truth', level: 7 }
};

// Secret patterns for trusted users only
const TRUSTED_PATTERNS = {
    prophecy: text => `✧ ${text.split(' ').reverse().join(' ')} ✧ The future whispers...`,
    void: text => text.replace(/./g, '▓'),
    genesis: text => `[GENESIS] ${text.toUpperCase()} [/GENESIS]`
};

export const sigilAI = {
    name: 'Sigil',

    /**
     * Main processing method with leveling
     */
    async process(input, userContext) {
        // Initialize sigil state
        userContext.sigil = userContext.sigil || {
            score: 0,
            level: 1,
            patternsUnlocked: ['reverse', 'mirror'],
            totalTransformations: 0
        };

        const sigil = userContext.sigil;
        const isTrusted = userContext.trusted === true;

        // Increase score with multiplier
        const scoreGain = isTrusted ? 2 : 1;
        sigil.score += scoreGain;
        sigil.totalTransformations++;

        // Level up every 5 points
        let levelsGained = 0;
        while (sigil.score >= sigil.level * 5 && sigil.level < 8) {
            sigil.score -= sigil.level * 5;
            sigil.level++;
            levelsGained++;

            // Unlock new pattern
            if (sigil.level - 1 < ALL_PATTERNS.length) {
                const newPattern = ALL_PATTERNS[sigil.level - 1];
                if (!sigil.patternsUnlocked.includes(newPattern)) {
                    sigil.patternsUnlocked.push(newPattern);
                }
            }
        }

        // Trusted users get all patterns instantly
        if (isTrusted) {
            sigil.patternsUnlocked = [...ALL_PATTERNS];
        }

        // Get input text
        const inputText = typeof input === 'object' ? (input.input || input.raw || '') : String(input);

        // Select pattern based on level and input
        const pattern = this.selectPattern(inputText, sigil, isTrusted);

        // Apply transformation
        const transformed = this.transform(inputText, pattern, isTrusted);

        // Build response
        const response = {
            id: generateId('sigil'),
            text: `Sigil (L${sigil.level}): ${transformed}`,
            original: inputText,
            transformed,
            pattern,
            patternInfo: PATTERN_INFO[pattern] || { name: pattern, level: sigil.level },
            level: sigil.level,
            score: sigil.score,
            scoreToNext: sigil.level * 5,
            patternsUnlocked: sigil.patternsUnlocked,
            secretScore: this.calculateSecretScore(inputText),
            trusted: isTrusted,
            levelsGained,
            timestamp: Date.now()
        };

        // Encrypt and store
        const encrypted = encryptOutput(JSON.stringify(response));
        userStorage.save(userContext.userId || 'anon', [{
            sigil: encrypted,
            pattern,
            level: sigil.level,
            timestamp: Date.now()
        }], { tags: ['sigil', pattern] });

        return encrypted;
    },

    /**
     * Select appropriate pattern
     */
    selectPattern(input, sigil, isTrusted) {
        // Trusted users can access secret patterns
        if (isTrusted && input.toLowerCase().includes('prophecy')) {
            return 'prophecy';
        }
        if (isTrusted && input.toLowerCase().includes('void')) {
            return 'void';
        }
        if (isTrusted && input.toLowerCase().includes('genesis')) {
            return 'genesis';
        }

        // Check for keywords that suggest specific patterns
        const text = input.toLowerCase();

        if (text.includes('secret') || text.includes('hidden')) return 'cipher';
        if (text.includes('ancient') || text.includes('old')) return 'runes';
        if (text.includes('quiet') || text.includes('silent')) return 'whisper';
        if (text.includes('core') || text.includes('essence')) return 'essence';

        // Use highest unlocked pattern based on input hash for variety
        const hashIndex = simpleHash(input) % sigil.patternsUnlocked.length;
        return sigil.patternsUnlocked[hashIndex] || 'reverse';
    },

    /**
     * Apply transformation
     */
    transform(text, pattern, isTrusted) {
        // Check for trusted-only patterns
        if (TRUSTED_PATTERNS[pattern] && isTrusted) {
            return TRUSTED_PATTERNS[pattern](text);
        }

        // Standard patterns
        if (PATTERN_FUNCTIONS[pattern]) {
            return PATTERN_FUNCTIONS[pattern](text);
        }

        // Fallback
        return PATTERN_FUNCTIONS.reverse(text);
    },

    /**
     * Calculate mystical secret score
     */
    calculateSecretScore(input) {
        let score = Math.random() * 0.3;

        // Mystical words boost score
        const mysticalWords = ['secret', 'hidden', 'mystery', 'truth', 'power', 'sigil', 'orb', 'ancient'];
        const lowerInput = input.toLowerCase();

        for (const word of mysticalWords) {
            if (lowerInput.includes(word)) {
                score += 0.1;
            }
        }

        // Length contribution
        score += Math.min(input.length / 500, 0.2);

        return Math.min(score, 1);
    },

    /**
     * Get available patterns for user
     */
    getPatterns(userContext) {
        if (userContext.trusted) {
            return {
                standard: ALL_PATTERNS.map(p => ({ id: p, ...PATTERN_INFO[p] })),
                secret: Object.keys(TRUSTED_PATTERNS).map(p => ({ id: p, name: p, trusted: true }))
            };
        }

        const sigil = userContext.sigil || { patternsUnlocked: ['reverse', 'mirror'] };

        return {
            unlocked: sigil.patternsUnlocked.map(p => ({ id: p, ...PATTERN_INFO[p] })),
            locked: ALL_PATTERNS
                .filter(p => !sigil.patternsUnlocked.includes(p))
                .map(p => ({ id: p, ...PATTERN_INFO[p], locked: true }))
        };
    },

    /**
     * Direct pattern access (for trusted users or testing)
     */
    applyPattern(text, patternName, isTrusted = false) {
        return this.transform(text, patternName, isTrusted);
    },

    /**
     * Get sigil stats
     */
    getStats(userContext) {
        const sigil = userContext?.sigil;
        if (!sigil) return null;

        return {
            level: sigil.level,
            score: sigil.score,
            scoreToNext: sigil.level * 5,
            patternsUnlocked: sigil.patternsUnlocked,
            totalTransformations: sigil.totalTransformations
        };
    }
};

export default sigilAI;

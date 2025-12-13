/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   SIGIL AI NODE - Mystical Processing Engine                              ║
 * ║   The whisper in the machine • Secrets & transformations                  ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { encryptOutput, generateId, simpleHash } from '../core/crypto-utils.js';
import { userStorage } from '../core/storage-hybrid.js';

// Sigil patterns - mystical transformations
const SIGIL_PATTERNS = {
    reverse: text => text.split('').reverse().join(''),
    mirror: text => text + ' | ' + text.split('').reverse().join(''),
    cipher: text => text.split('').map(c => String.fromCharCode(c.charCodeAt(0) + 1)).join(''),
    runes: text => text.toUpperCase().replace(/[AEIOU]/g, '*'),
    whisper: text => text.toLowerCase().replace(/\s+/g, '...'),
    echo: text => text.split(' ').map(w => w + '-' + w).join(' '),
    veil: text => text.replace(/./g, c => Math.random() > 0.5 ? c : '*'),
    essence: text => [...new Set(text.toLowerCase().replace(/[^a-z]/g, ''))].join('')
};

// Sigil moods - affect response style
const SIGIL_MOODS = ['mystical', 'cryptic', 'enlightened', 'shadowed', 'radiant', 'dormant'];

// Processing metrics
const sigilMetrics = {
    processed: 0,
    secrets: 0,
    transformations: {},
    avgScore: 0
};

export const sigilAI = {
    name: 'Sigil',

    /**
     * Main processing method
     */
    async process(input, userContext) {
        sigilMetrics.processed++;

        // Determine input type
        const inputData = typeof input === 'object' ? input.input || input.raw || '' : String(input);

        // Select transformation based on input characteristics
        const pattern = this.selectPattern(inputData, userContext);

        // Apply transformation
        const transformed = SIGIL_PATTERNS[pattern](inputData);

        // Generate mystical response
        const response = this.generateResponse(inputData, transformed, pattern);

        // Calculate secret score
        const secretScore = this.calculateSecretScore(inputData, response);

        // Build result
        const result = {
            id: generateId('sigil'),
            text: response.text,
            transformed,
            pattern,
            secretScore,
            mood: this.determineMood(secretScore),
            whisper: this.generateWhisper(inputData),
            timestamp: Date.now()
        };

        // Encrypt sensitive output
        const encrypted = encryptOutput(JSON.stringify(result));

        // Store in user's grimoire
        if (userContext?.userId) {
            userStorage.save(userContext.userId, [{
                sigil: encrypted,
                pattern,
                timestamp: Date.now()
            }], { tags: ['sigil', pattern] });
            sigilMetrics.secrets++;
        }

        // Update metrics
        sigilMetrics.transformations[pattern] = (sigilMetrics.transformations[pattern] || 0) + 1;
        sigilMetrics.avgScore = (sigilMetrics.avgScore * (sigilMetrics.processed - 1) + secretScore) / sigilMetrics.processed;

        return encrypted;
    },

    /**
     * Select appropriate transformation pattern
     */
    selectPattern(input, userContext) {
        // Check user preferences
        if (userContext?.preferences?.sigilPattern) {
            return userContext.preferences.sigilPattern;
        }

        // Analyze input to select pattern
        const length = input.length;
        const hasQuestion = input.includes('?');
        const isShort = length < 20;
        const hasNumbers = /\d/.test(input);

        if (hasQuestion) return 'whisper';
        if (isShort) return 'mirror';
        if (hasNumbers) return 'cipher';
        if (length > 100) return 'essence';

        // Random selection for variety
        const patterns = Object.keys(SIGIL_PATTERNS);
        return patterns[Math.floor(Math.random() * patterns.length)];
    },

    /**
     * Generate mystical response
     */
    generateResponse(original, transformed, pattern) {
        const responses = {
            reverse: `The sigil whispers backwards: "${transformed}"`,
            mirror: `Reflected in the void: "${transformed}"`,
            cipher: `Encoded in ancient runes: "${transformed}"`,
            runes: `The vowels fade to mystery: "${transformed}"`,
            whisper: `A quiet truth emerges: "${transformed}"`,
            echo: `The words resound: "${transformed}"`,
            veil: `Partially obscured by shadow: "${transformed}"`,
            essence: `Distilled to its core: "${transformed}"`
        };

        return {
            text: responses[pattern] || `Transformed: "${transformed}"`,
            pattern,
            original
        };
    },

    /**
     * Calculate mystical secret score
     */
    calculateSecretScore(input, response) {
        let score = Math.random() * 0.3; // Base randomness

        // Longer inputs have more secrets
        score += Math.min(input.length / 500, 0.2);

        // Certain words boost the score
        const mysticalWords = ['secret', 'hidden', 'mystery', 'truth', 'power', 'sigil', 'orb'];
        const lowerInput = input.toLowerCase();
        for (const word of mysticalWords) {
            if (lowerInput.includes(word)) {
                score += 0.1;
            }
        }

        // Hash-based contribution for consistency
        const hashScore = (simpleHash(input) % 100) / 500;
        score += hashScore;

        return Math.min(score, 1);
    },

    /**
     * Determine mood based on score
     */
    determineMood(score) {
        if (score > 0.8) return 'radiant';
        if (score > 0.6) return 'enlightened';
        if (score > 0.4) return 'mystical';
        if (score > 0.2) return 'cryptic';
        if (score > 0.1) return 'shadowed';
        return 'dormant';
    },

    /**
     * Generate a whisper (secondary insight)
     */
    generateWhisper(input) {
        const whispers = [
            'The orb sees all paths...',
            'What is hidden shall be revealed...',
            'The pattern emerges from chaos...',
            'Trust in the sigil\'s guidance...',
            'The void reflects your intent...',
            'Ancient wisdom stirs...',
            'The flow never stops...',
            'Between words lies truth...'
        ];

        // Select based on input hash for consistency
        const index = simpleHash(input) % whispers.length;
        return whispers[index];
    },

    /**
     * Direct invocation of specific pattern
     */
    transform(text, pattern) {
        if (!SIGIL_PATTERNS[pattern]) {
            return { error: `Unknown pattern: ${pattern}` };
        }
        return {
            original: text,
            transformed: SIGIL_PATTERNS[pattern](text),
            pattern
        };
    },

    /**
     * Get available patterns
     */
    getPatterns() {
        return Object.keys(SIGIL_PATTERNS);
    },

    /**
     * Get Sigil metrics
     */
    getMetrics() {
        return { ...sigilMetrics };
    }
};

export default sigilAI;

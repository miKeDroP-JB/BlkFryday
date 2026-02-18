/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   RESEARCH NODE - Discovery Engine for Scientists & Leaders              ║
 * ║   Trusted-only access • Generates insights • Feeds data moat             ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { encryptOutput, generateId, simpleHash } from '../core/crypto-utils.js';
import { userStorage } from '../core/storage-hybrid.js';

// Research domains
const RESEARCH_DOMAINS = {
    science: {
        name: 'Scientific Discovery',
        methods: ['hypothesis', 'experiment', 'analysis', 'synthesis'],
        keywords: ['research', 'study', 'theory', 'hypothesis', 'experiment', 'data', 'evidence']
    },
    technology: {
        name: 'Technological Innovation',
        methods: ['prototype', 'iterate', 'test', 'deploy'],
        keywords: ['tech', 'software', 'hardware', 'system', 'algorithm', 'ai', 'innovation']
    },
    strategy: {
        name: 'Strategic Analysis',
        methods: ['assess', 'model', 'simulate', 'decide'],
        keywords: ['strategy', 'decision', 'policy', 'market', 'competition', 'growth']
    },
    philosophy: {
        name: 'Philosophical Inquiry',
        methods: ['question', 'reason', 'synthesize', 'conclude'],
        keywords: ['meaning', 'ethics', 'truth', 'wisdom', 'existence', 'consciousness']
    },
    medicine: {
        name: 'Medical Research',
        methods: ['diagnose', 'treat', 'study', 'cure'],
        keywords: ['health', 'disease', 'treatment', 'patient', 'cure', 'medicine']
    },
    environment: {
        name: 'Environmental Science',
        methods: ['measure', 'model', 'predict', 'mitigate'],
        keywords: ['climate', 'environment', 'sustainability', 'ecology', 'conservation']
    }
};

// Discovery templates
const DISCOVERY_TEMPLATES = [
    'Cross-referencing {input} with existing patterns reveals: {insight}',
    'Novel correlation detected between {input} and {domain}: {insight}',
    'Hypothesis generated: {insight} (confidence: {confidence}%)',
    'Simulation suggests: {insight}',
    'Pattern analysis indicates: {insight}',
    'Emergent property discovered: {insight}'
];

// Data moat - aggregated learnings
const dataMoat = {
    discoveries: [],
    patterns: {},
    domainInsights: {},
    totalResearch: 0,
    contributions: {}
};

export const researchNode = {
    name: 'ResearchNode',

    /**
     * Main processing - TRUSTED USERS ONLY
     */
    async process(filteredData, userContext) {
        // Access control
        if (!userContext.trusted) {
            return {
                node: 'ResearchNode',
                success: false,
                locked: true,
                message: 'Research Node access requires trusted creator status.',
                hint: 'Contribute insights, build your reputation, join the inner circle.'
            };
        }

        const inputText = typeof filteredData === 'object'
            ? (filteredData.input || filteredData.raw || '')
            : String(filteredData);

        // Detect research domain
        const domain = this.detectDomain(inputText);

        // Generate insights
        const insights = this.generateInsights(inputText, domain, userContext);

        // Calculate discovery score
        const discoveryScore = this.calculateDiscoveryScore(inputText, insights);

        // Build result
        const result = {
            id: generateId('research'),
            node: 'ResearchNode',
            success: true,
            domain: domain.name,
            domainId: domain.id,
            insights,
            discoveryScore,
            method: domain.methods[Math.floor(Math.random() * domain.methods.length)],
            confidence: Math.round(discoveryScore * 100),
            timestamp: Date.now()
        };

        // Add to data moat
        this.addToMoat(result, userContext);

        // Store discovery
        userStorage.save(userContext.userId, [{
            type: 'research',
            discovery: result,
            timestamp: Date.now()
        }], { tags: ['research', domain.id, 'discovery'] });

        return result;
    },

    /**
     * Detect research domain from input
     */
    detectDomain(input) {
        const text = input.toLowerCase();
        let bestMatch = { id: 'science', ...RESEARCH_DOMAINS.science, score: 0 };

        for (const [id, domain] of Object.entries(RESEARCH_DOMAINS)) {
            let score = 0;
            for (const keyword of domain.keywords) {
                if (text.includes(keyword)) {
                    score += 1;
                }
            }

            if (score > bestMatch.score) {
                bestMatch = { id, ...domain, score };
            }
        }

        return bestMatch;
    },

    /**
     * Generate insights from input
     */
    generateInsights(input, domain, userContext) {
        const insights = [];

        // Primary insight
        const template = DISCOVERY_TEMPLATES[Math.floor(Math.random() * DISCOVERY_TEMPLATES.length)];
        const primaryInsight = this.generateInsight(input, domain, template);
        insights.push(primaryInsight);

        // Cross-domain insight for high-level users
        if (userContext.twin?.level >= 5) {
            const crossDomain = this.getCrossDomainInsight(input, domain);
            if (crossDomain) {
                insights.push(crossDomain);
            }
        }

        // Pattern-based insight if we have data moat history
        if (dataMoat.totalResearch > 10) {
            const patternInsight = this.getPatternInsight(input, domain);
            if (patternInsight) {
                insights.push(patternInsight);
            }
        }

        return insights;
    },

    /**
     * Generate single insight
     */
    generateInsight(input, domain, template) {
        // Extract key concepts from input
        const words = input.split(/\s+/).filter(w => w.length > 4);
        const keyConcept = words[Math.floor(Math.random() * words.length)] || input.substring(0, 20);

        // Generate synthetic insight
        const insightPhrases = [
            `underlying pattern suggests exponential growth potential`,
            `correlation with ${domain.name} principles reveals optimization opportunity`,
            `inverse relationship with conventional approaches detected`,
            `emergent behavior pattern indicates systemic shift`,
            `resonance with historical breakthroughs in ${domain.name}`,
            `novel synthesis of disparate elements creates new paradigm`,
            `recursive pattern amplifies through ${domain.methods[0]} phase`
        ];

        const insight = insightPhrases[Math.floor(Math.random() * insightPhrases.length)];
        const confidence = 50 + Math.floor(Math.random() * 40);

        return template
            .replace('{input}', keyConcept)
            .replace('{domain}', domain.name)
            .replace('{insight}', insight)
            .replace('{confidence}', confidence);
    },

    /**
     * Get cross-domain insight
     */
    getCrossDomainInsight(input, currentDomain) {
        const domains = Object.keys(RESEARCH_DOMAINS).filter(d => d !== currentDomain.id);
        const crossDomain = domains[Math.floor(Math.random() * domains.length)];

        return `Cross-domain analysis: ${RESEARCH_DOMAINS[crossDomain].name} methodologies may accelerate ${currentDomain.name} outcomes.`;
    },

    /**
     * Get pattern-based insight from moat
     */
    getPatternInsight(input, domain) {
        const domainHistory = dataMoat.domainInsights[domain.id] || [];

        if (domainHistory.length < 3) {
            return null;
        }

        return `Meta-pattern: ${domainHistory.length} prior ${domain.name} discoveries suggest accelerating trajectory.`;
    },

    /**
     * Calculate discovery score
     */
    calculateDiscoveryScore(input, insights) {
        let score = 0.3; // Base score

        // Length bonus
        score += Math.min(input.length / 1000, 0.2);

        // Insight count bonus
        score += insights.length * 0.1;

        // Uniqueness bonus (based on hash)
        const hash = simpleHash(input);
        if (hash % 7 === 0) score += 0.15; // Lucky discovery

        return Math.min(score, 1);
    },

    /**
     * Add discovery to data moat
     */
    addToMoat(result, userContext) {
        dataMoat.totalResearch++;

        // Add to discoveries
        dataMoat.discoveries.push({
            id: result.id,
            domain: result.domainId,
            score: result.discoveryScore,
            userId: userContext.userId,
            timestamp: result.timestamp
        });

        // Limit discoveries
        if (dataMoat.discoveries.length > 10000) {
            dataMoat.discoveries = dataMoat.discoveries.slice(-5000);
        }

        // Track domain insights
        if (!dataMoat.domainInsights[result.domainId]) {
            dataMoat.domainInsights[result.domainId] = [];
        }
        dataMoat.domainInsights[result.domainId].push(result.discoveryScore);

        // Track contributions
        if (!dataMoat.contributions[userContext.userId]) {
            dataMoat.contributions[userContext.userId] = 0;
        }
        dataMoat.contributions[userContext.userId]++;

        // Extract patterns (simple word frequency)
        const words = result.insights.join(' ').toLowerCase().split(/\s+/);
        for (const word of words) {
            if (word.length > 5) {
                dataMoat.patterns[word] = (dataMoat.patterns[word] || 0) + 1;
            }
        }
    },

    /**
     * Get moat statistics (for system improvement)
     */
    getMoatStats() {
        return {
            totalResearch: dataMoat.totalResearch,
            discoveryCount: dataMoat.discoveries.length,
            domains: Object.keys(dataMoat.domainInsights),
            topPatterns: Object.entries(dataMoat.patterns)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 20)
                .map(([word, count]) => ({ word, count })),
            contributors: Object.keys(dataMoat.contributions).length,
            avgScore: dataMoat.discoveries.length > 0
                ? dataMoat.discoveries.reduce((sum, d) => sum + d.score, 0) / dataMoat.discoveries.length
                : 0
        };
    },

    /**
     * Get user research stats
     */
    getUserStats(userContext) {
        const contributions = dataMoat.contributions[userContext.userId] || 0;

        const userDiscoveries = dataMoat.discoveries.filter(d => d.userId === userContext.userId);
        const avgScore = userDiscoveries.length > 0
            ? userDiscoveries.reduce((sum, d) => sum + d.score, 0) / userDiscoveries.length
            : 0;

        return {
            contributions,
            discoveries: userDiscoveries.length,
            avgScore,
            rank: this.getUserRank(userContext.userId)
        };
    },

    /**
     * Get user rank among contributors
     */
    getUserRank(userId) {
        const sorted = Object.entries(dataMoat.contributions)
            .sort((a, b) => b[1] - a[1]);

        const index = sorted.findIndex(([id]) => id === userId);
        return index >= 0 ? index + 1 : null;
    },

    /**
     * Run simulation (for trusted users with simulation ability)
     */
    async runSimulation(hypothesis, userContext) {
        if (!userContext.trusted) {
            return { error: 'Simulation requires trusted access' };
        }

        if (!userContext.twin?.abilities?.includes('simulation')) {
            return { error: 'Twin requires simulation ability (level 7)' };
        }

        // Simulate hypothesis testing
        const iterations = 100;
        const results = [];

        for (let i = 0; i < iterations; i++) {
            const outcome = Math.random();
            const variance = Math.random() * 0.2 - 0.1;
            results.push(outcome + variance);
        }

        const avg = results.reduce((a, b) => a + b, 0) / results.length;
        const success = results.filter(r => r > 0.5).length / results.length;

        return {
            hypothesis,
            iterations,
            avgOutcome: avg,
            successRate: success,
            confidence: Math.round(success * 100),
            recommendation: success > 0.7
                ? 'Hypothesis shows strong potential. Proceed with empirical testing.'
                : success > 0.5
                    ? 'Mixed results. Consider refining hypothesis parameters.'
                    : 'Hypothesis unlikely to succeed. Revisit core assumptions.'
        };
    }
};

export default researchNode;

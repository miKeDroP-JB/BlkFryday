/**
 * 0r8.term AI Engine
 * "The terminal that thinks before you do"
 *
 * Routes input to appropriate AI modules based on analysis
 */

import { languageDetector } from './language-detector.js';

// Module priority based on user trust level
const MODULE_PRIORITY = {
    trusted: ['ResearchNode', 'MentorNode', 'Sigil', 'CommandExecutor', 'ErrorHandler', 'ToolchainManager'],
    mass: ['Sigil', 'CommandExecutor', 'ErrorHandler']
};

// AI decision patterns
const DECISION_MATRIX = {
    code: {
        intents: {
            execute: { modules: ['CommandExecutor'], action: 'run' },
            fix: { modules: ['ErrorHandler', 'CommandExecutor'], action: 'debug' },
            research: { modules: ['ResearchNode', 'CommandExecutor'], action: 'analyze' },
            mentor: { modules: ['MentorNode'], action: 'explain' },
            default: { modules: ['CommandExecutor'], action: 'process' }
        }
    },
    command: {
        intents: {
            install: { modules: ['ToolchainManager'], action: 'install' },
            research: { modules: ['ResearchNode'], action: 'discover' },
            mentor: { modules: ['MentorNode'], action: 'teach' },
            sigil: { modules: ['Sigil'], action: 'encode' },
            fix: { modules: ['ErrorHandler'], action: 'repair' },
            default: { modules: ['Sigil'], action: 'process' }
        }
    },
    text: {
        intents: {
            research: { modules: ['ResearchNode', 'Sigil'], action: 'discover' },
            mentor: { modules: ['MentorNode', 'Sigil'], action: 'guide' },
            sigil: { modules: ['Sigil'], action: 'encode' },
            default: { modules: ['Sigil'], action: 'mystify' }
        }
    }
};

/**
 * Generate AI reasoning for decision
 */
function generateReasoning(analysis, decision) {
    const reasons = [];

    if (analysis.language.isCode) {
        reasons.push(`Detected ${analysis.language.name} ${analysis.language.emoji} (${analysis.language.confidence}% confidence)`);
    }

    if (analysis.intent.hasIntent) {
        reasons.push(`Intent: ${analysis.intent.primaryIntent.intent} → requires ${analysis.intent.primaryIntent.requires}`);
    }

    reasons.push(`Input type: ${analysis.inputType}`);
    reasons.push(`Routing to: ${decision.modules.join(', ')}`);
    reasons.push(`Action: ${decision.action}`);

    return reasons;
}

/**
 * AI Engine - "thinks before you do"
 */
export const aiEngine = {
    name: 'AIEngine',

    /**
     * Analyze input and decide routing
     */
    async think(input, userContext = {}) {
        const isTrusted = userContext.trusted === true;
        const analysis = languageDetector.detect(input);

        // Get available modules for user
        const availableModules = isTrusted ? MODULE_PRIORITY.trusted : MODULE_PRIORITY.mass;

        // Determine decision path
        const inputType = analysis.inputType;
        const decisionPath = DECISION_MATRIX[inputType] || DECISION_MATRIX.text;

        // Get intent-based decision
        let decision;
        if (analysis.intent.hasIntent) {
            const intentKey = analysis.intent.primaryIntent.intent;
            decision = decisionPath.intents[intentKey] || decisionPath.intents.default;
        } else {
            decision = decisionPath.intents.default;
        }

        // Filter modules by availability
        const filteredModules = decision.modules.filter(mod => {
            // ResearchNode and MentorNode are trusted-only
            if ((mod === 'ResearchNode' || mod === 'MentorNode') && !isTrusted) {
                return false;
            }
            return true;
        });

        // Build execution plan
        const plan = {
            analysis,
            decision: {
                ...decision,
                modules: filteredModules.length > 0 ? filteredModules : ['Sigil']
            },
            reasoning: generateReasoning(analysis, decision),
            userContext: {
                trusted: isTrusted,
                availableModules
            },
            executionOrder: [],
            metadata: {
                timestamp: Date.now(),
                engineVersion: '1.0.0'
            }
        };

        // Build execution order
        for (const module of plan.decision.modules) {
            plan.executionOrder.push({
                module,
                action: plan.decision.action,
                priority: availableModules.indexOf(module),
                input: analysis.hasCodeBlocks ? analysis.codeBlocks[0]?.code : input
            });
        }

        return plan;
    },

    /**
     * Quick intent detection without full analysis
     */
    quickIntent(input) {
        const analysis = languageDetector.detect(input);
        return {
            isCode: analysis.language.isCode,
            language: analysis.language.language,
            intent: analysis.intent.primaryIntent?.intent || 'unknown',
            type: analysis.inputType
        };
    },

    /**
     * Get recommendation for user
     */
    recommend(input, userContext = {}) {
        const quick = this.quickIntent(input);
        const isTrusted = userContext.trusted === true;

        const recommendations = [];

        if (quick.isCode) {
            recommendations.push(`💡 Detected ${quick.language} code`);
            recommendations.push(`   Try: run, fix, or explain`);
        }

        if (isTrusted) {
            recommendations.push(`🔬 Research Node available for discoveries`);
            recommendations.push(`📚 Mentor Node ready to guide`);
        }

        if (quick.intent !== 'unknown') {
            recommendations.push(`🎯 Detected intent: ${quick.intent}`);
        }

        return recommendations;
    },

    /**
     * Self-improvement hook - log decisions for Data Moat
     */
    logDecision(plan, outcome) {
        return {
            input: plan.analysis.input.substring(0, 100),
            decision: plan.decision.action,
            modules: plan.decision.modules,
            outcome,
            timestamp: Date.now()
        };
    }
};

export default aiEngine;

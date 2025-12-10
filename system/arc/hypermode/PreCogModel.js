/**
 * PreCogModel.js
 * Predictive cognition model for HyperMode
 * Anticipates future states, branch outcomes, and user intentions
 */

class PreCogModel {
    constructor(manager, neuro, config = {}) {
        this.manager = manager;
        this.neuro = neuro;
        this.horizon = config.horizon || 10; // prediction steps
        this.confidence = config.confidence || 0.7;

        // Prediction state
        this.predictions = {
            branches: [],
            outcomes: [],
            userIntent: null,
            nextPhase: null,
            convergenceTime: null
        };

        // History for pattern learning
        this.history = {
            branches: [],
            phases: [],
            outcomes: [],
            userActions: []
        };

        // Pattern weights (learned)
        this.weights = {
            branchSuccess: new Map(),
            phaseTransition: new Map(),
            convergencePatterns: []
        };

        console.log(`[PreCogModel] 🔮 initialized (horizon: ${this.horizon} steps)`);
    }

    /**
     * Predict likely branch outcomes
     */
    predictBranchOutcomes() {
        const predictions = [];
        const activeBranches = this._getActiveBranches();

        activeBranches.forEach(branch => {
            const successProb = this._calculateSuccessProbability(branch);
            const convergenceProb = this._calculateConvergenceProbability(branch);
            const timeToComplete = this._estimateTimeToComplete(branch);

            predictions.push({
                branchId: branch.id,
                successProbability: successProb,
                convergenceProbability: convergenceProb,
                estimatedCompletion: timeToComplete,
                recommendation: successProb > 0.6 ? 'boost' : successProb < 0.3 ? 'prune' : 'monitor'
            });
        });

        this.predictions.branches = predictions;
        return predictions;
    }

    /**
     * Predict next optimal phase
     */
    predictNextPhase() {
        const currentPhase = this._getCurrentPhase();
        const neuroState = this.neuro ? this.neuro.getState() : {};
        const branchCount = this._getActiveBranches().length;

        // Phase transition logic based on state
        let nextPhase = currentPhase;
        let confidence = 0.5;

        if (branchCount > 20 && neuroState.attention > 0.6) {
            nextPhase = 'Convergence';
            confidence = 0.8;
        } else if (branchCount < 5 && neuroState.engagement > 0.5) {
            nextPhase = 'InfiniteSearch';
            confidence = 0.7;
        } else if (neuroState.gamma > 0.5) {
            nextPhase = 'GODMODE';
            confidence = 0.75;
        } else if (neuroState.meditation > 0.6) {
            nextPhase = 'MemoryFastPath';
            confidence = 0.65;
        }

        this.predictions.nextPhase = { phase: nextPhase, confidence };
        return this.predictions.nextPhase;
    }

    /**
     * Predict user intent from neural state
     */
    predictUserIntent() {
        if (!this.neuro) {
            return { intent: 'explore', confidence: 0.5 };
        }

        const state = this.neuro.getState();
        let intent = 'explore';
        let confidence = 0.5;

        if (state.attention > 0.7 && state.beta > 0.6) {
            intent = 'focus';
            confidence = 0.8;
        } else if (state.theta > 0.6 && state.meditation > 0.5) {
            intent = 'creative';
            confidence = 0.75;
        } else if (state.gamma > 0.5 && state.engagement > 0.6) {
            intent = 'insight';
            confidence = 0.7;
        } else if (state.alpha > 0.6) {
            intent = 'observe';
            confidence = 0.65;
        }

        this.predictions.userIntent = { intent, confidence };
        return this.predictions.userIntent;
    }

    /**
     * Predict time to convergence
     */
    predictConvergenceTime() {
        const branches = this._getActiveBranches();
        const avgScore = branches.reduce((sum, b) => sum + (b.score || 0), 0) / Math.max(1, branches.length);
        const momentum = this._calculateMomentum();

        // Simple estimation model
        let estimatedSteps = Math.max(1, 100 - avgScore);
        if (momentum > 0) estimatedSteps /= (1 + momentum);

        this.predictions.convergenceTime = {
            steps: Math.round(estimatedSteps),
            confidence: Math.min(0.9, 0.5 + momentum * 0.4)
        };

        return this.predictions.convergenceTime;
    }

    /**
     * Generate pre-adapted universe suggestions
     */
    generateSuggestions() {
        const suggestions = [];

        // Branch suggestions
        const branchPreds = this.predictBranchOutcomes();
        branchPreds.forEach(p => {
            if (p.recommendation === 'boost') {
                suggestions.push({
                    type: 'boost_branch',
                    target: p.branchId,
                    reason: `High success probability: ${(p.successProbability * 100).toFixed(0)}%`
                });
            } else if (p.recommendation === 'prune') {
                suggestions.push({
                    type: 'prune_branch',
                    target: p.branchId,
                    reason: `Low success probability: ${(p.successProbability * 100).toFixed(0)}%`
                });
            }
        });

        // Phase suggestion
        const phasePred = this.predictNextPhase();
        if (phasePred.confidence > 0.7) {
            suggestions.push({
                type: 'transition_phase',
                target: phasePred.phase,
                reason: `Optimal next phase (confidence: ${(phasePred.confidence * 100).toFixed(0)}%)`
            });
        }

        // Intent-based suggestions
        const intentPred = this.predictUserIntent();
        if (intentPred.intent === 'creative') {
            suggestions.push({
                type: 'enable_creative_mode',
                reason: 'User in creative state'
            });
        } else if (intentPred.intent === 'focus') {
            suggestions.push({
                type: 'reduce_distractions',
                reason: 'User in focused state'
            });
        }

        return suggestions;
    }

    /**
     * Record outcome for learning
     */
    recordOutcome(branchId, outcome) {
        this.history.outcomes.push({
            branchId,
            outcome,
            ts: Date.now()
        });

        // Update weights
        const key = this._getBranchSignature(branchId);
        const current = this.weights.branchSuccess.get(key) || { success: 0, total: 0 };
        current.total++;
        if (outcome.success) current.success++;
        this.weights.branchSuccess.set(key, current);
    }

    /**
     * Get all predictions
     */
    getAllPredictions() {
        return {
            branches: this.predictBranchOutcomes(),
            nextPhase: this.predictNextPhase(),
            userIntent: this.predictUserIntent(),
            convergenceTime: this.predictConvergenceTime(),
            suggestions: this.generateSuggestions()
        };
    }

    // Private helpers

    _getActiveBranches() {
        if (this.manager && this.manager.lineage && this.manager.lineage.getActive) {
            return this.manager.lineage.getActive();
        }
        return [];
    }

    _getCurrentPhase() {
        if (this.manager && this.manager.getCurrentPhase) {
            return this.manager.getCurrentPhase();
        }
        return 'Unknown';
    }

    _calculateSuccessProbability(branch) {
        const base = 0.3 + Math.random() * 0.2;
        const scoreBonus = (branch.score || 0) / 100 * 0.4;
        const depthPenalty = (branch.depth || 0) * 0.02;
        return Math.min(0.95, Math.max(0.05, base + scoreBonus - depthPenalty));
    }

    _calculateConvergenceProbability(branch) {
        const base = 0.4;
        const scoreBonus = (branch.score || 0) / 100 * 0.5;
        return Math.min(0.9, base + scoreBonus);
    }

    _estimateTimeToComplete(branch) {
        const base = 50;
        const scoreFactor = 1 - (branch.score || 0) / 100;
        return Math.round(base * scoreFactor);
    }

    _calculateMomentum() {
        if (this.history.outcomes.length < 2) return 0;
        const recent = this.history.outcomes.slice(-10);
        const successes = recent.filter(o => o.outcome && o.outcome.success).length;
        return successes / recent.length;
    }

    _getBranchSignature(branchId) {
        // Simplified - would be more sophisticated in production
        return branchId.split('_')[0] || 'default';
    }
}

module.exports = PreCogModel;

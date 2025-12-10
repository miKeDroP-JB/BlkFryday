/**
 * AdaptiveAI.js
 * Adaptive AI system for HyperMode
 * Self-modifies behavior based on neural feedback and predictions
 */

class AdaptiveAI {
    constructor(manager, neuro, precog, config = {}) {
        this.manager = manager;
        this.neuro = neuro;
        this.precog = precog;

        // Adaptive parameters
        this.params = {
            explorationRate: config.explorationRate || 0.3,
            learningRate: config.learningRate || 0.1,
            adaptationSpeed: config.adaptationSpeed || 0.05,
            creativityBias: 0.5,
            focusBias: 0.5,
            riskTolerance: 0.5
        };

        // State
        this.state = {
            mode: 'balanced',
            adaptationLevel: 0,
            lastAdaptation: Date.now(),
            recentDecisions: []
        };

        // Behavior modules
        this.modules = new Map();
        this._initDefaultModules();

        console.log('[AdaptiveAI] 🤖 initialized');
    }

    _initDefaultModules() {
        // Exploration module
        this.modules.set('exploration', {
            name: 'Exploration',
            active: true,
            weight: 0.3,
            execute: (ctx) => this._exploreDecision(ctx)
        });

        // Exploitation module
        this.modules.set('exploitation', {
            name: 'Exploitation',
            active: true,
            weight: 0.4,
            execute: (ctx) => this._exploitDecision(ctx)
        });

        // Creative module
        this.modules.set('creative', {
            name: 'Creative',
            active: true,
            weight: 0.2,
            execute: (ctx) => this._creativeDecision(ctx)
        });

        // Convergence module
        this.modules.set('convergence', {
            name: 'Convergence',
            active: true,
            weight: 0.1,
            execute: (ctx) => this._convergenceDecision(ctx)
        });
    }

    /**
     * Adapt parameters based on neural state
     */
    adaptToNeural() {
        if (!this.neuro) return;

        const state = this.neuro.getState();
        const speed = this.params.adaptationSpeed;

        // Adjust creativity bias based on theta waves
        this.params.creativityBias += (state.theta - 0.5) * speed;
        this.params.creativityBias = Math.max(0, Math.min(1, this.params.creativityBias));

        // Adjust focus bias based on beta waves
        this.params.focusBias += (state.beta - 0.5) * speed;
        this.params.focusBias = Math.max(0, Math.min(1, this.params.focusBias));

        // Adjust risk tolerance based on engagement
        this.params.riskTolerance += (state.engagement - 0.5) * speed * 0.5;
        this.params.riskTolerance = Math.max(0.1, Math.min(0.9, this.params.riskTolerance));

        // Adjust exploration rate based on gamma (insight)
        this.params.explorationRate += (state.gamma - 0.4) * speed;
        this.params.explorationRate = Math.max(0.1, Math.min(0.6, this.params.explorationRate));

        // Update module weights
        this._updateModuleWeights();

        this.state.lastAdaptation = Date.now();
        this.state.adaptationLevel++;
    }

    /**
     * Adapt based on predictions
     */
    adaptToPredictions() {
        if (!this.precog) return;

        const predictions = this.precog.getAllPredictions();

        // Adjust based on user intent
        if (predictions.userIntent) {
            switch (predictions.userIntent.intent) {
                case 'creative':
                    this.modules.get('creative').weight = 0.4;
                    this.modules.get('exploration').weight = 0.3;
                    break;
                case 'focus':
                    this.modules.get('exploitation').weight = 0.5;
                    this.modules.get('convergence').weight = 0.3;
                    break;
                case 'insight':
                    this.modules.get('creative').weight = 0.35;
                    this.modules.get('exploration').weight = 0.35;
                    break;
            }
        }

        // Adjust based on convergence prediction
        if (predictions.convergenceTime && predictions.convergenceTime.steps < 20) {
            this.modules.get('convergence').weight = 0.4;
            this.state.mode = 'converging';
        }
    }

    /**
     * Make adaptive decision
     */
    makeDecision(context) {
        // Run all active modules
        const decisions = [];
        let totalWeight = 0;

        this.modules.forEach((module, key) => {
            if (module.active) {
                const decision = module.execute(context);
                decisions.push({
                    module: key,
                    decision,
                    weight: module.weight
                });
                totalWeight += module.weight;
            }
        });

        // Weighted combination
        const combined = this._combineDecisions(decisions, totalWeight);

        // Record decision
        this.state.recentDecisions.push({
            context,
            decision: combined,
            ts: Date.now()
        });

        // Keep only recent decisions
        if (this.state.recentDecisions.length > 100) {
            this.state.recentDecisions.shift();
        }

        return combined;
    }

    /**
     * Get adaptive recommendations
     */
    getRecommendations() {
        const recs = [];

        // Neural-based recommendations
        if (this.neuro && this.neuro.isInFlowState()) {
            recs.push({
                type: 'maintain_flow',
                action: 'Keep current intensity',
                priority: 'high'
            });
        }

        // Parameter-based recommendations
        if (this.params.creativityBias > 0.7) {
            recs.push({
                type: 'increase_exploration',
                action: 'Enable more creative branching',
                priority: 'medium'
            });
        }

        if (this.params.focusBias > 0.7) {
            recs.push({
                type: 'reduce_branches',
                action: 'Prune low-performing branches',
                priority: 'medium'
            });
        }

        // Prediction-based recommendations
        if (this.precog) {
            const suggestions = this.precog.generateSuggestions();
            suggestions.forEach(s => {
                recs.push({
                    type: s.type,
                    action: s.reason,
                    priority: 'low'
                });
            });
        }

        return recs;
    }

    /**
     * Register custom module
     */
    registerModule(key, module) {
        this.modules.set(key, {
            name: module.name || key,
            active: module.active !== false,
            weight: module.weight || 0.1,
            execute: module.execute
        });
    }

    /**
     * Get current state
     */
    getState() {
        return {
            ...this.state,
            params: { ...this.params },
            moduleWeights: Array.from(this.modules.entries()).map(([k, v]) => ({
                module: k,
                weight: v.weight,
                active: v.active
            }))
        };
    }

    // Private decision methods

    _exploreDecision(ctx) {
        return {
            action: 'explore',
            direction: Math.random() > 0.5 ? 'left' : 'right',
            intensity: this.params.explorationRate + Math.random() * 0.2
        };
    }

    _exploitDecision(ctx) {
        return {
            action: 'exploit',
            target: ctx.bestBranch || 'highest_score',
            intensity: 1 - this.params.explorationRate
        };
    }

    _creativeDecision(ctx) {
        const mutations = ['split', 'merge', 'mutate', 'transform'];
        return {
            action: 'create',
            mutation: mutations[Math.floor(Math.random() * mutations.length)],
            intensity: this.params.creativityBias
        };
    }

    _convergenceDecision(ctx) {
        return {
            action: 'converge',
            target: ctx.convergenceTarget || 'best',
            intensity: this.params.focusBias
        };
    }

    _updateModuleWeights() {
        // Normalize weights
        let total = 0;
        this.modules.forEach(m => { total += m.weight; });
        if (total > 0) {
            this.modules.forEach(m => { m.weight /= total; });
        }
    }

    _combineDecisions(decisions, totalWeight) {
        if (decisions.length === 0) return { action: 'wait' };

        // Select based on weighted probability
        const rand = Math.random() * totalWeight;
        let cumulative = 0;

        for (const d of decisions) {
            cumulative += d.weight;
            if (rand <= cumulative) {
                return d.decision;
            }
        }

        return decisions[0].decision;
    }
}

module.exports = AdaptiveAI;

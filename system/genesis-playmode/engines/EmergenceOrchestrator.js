/**
 * EmergenceOrchestrator V4.0
 * Unified solver engine for Genesis PlayMode
 */

class EmergenceOrchestrator {
    constructor(config = {}) {
        this.name = 'EmergenceOrchestrator';
        this.version = '4.0';

        // Core parameters
        this.params = {
            branchFactor: config.branchFactor || 5,
            beamWidth: config.beamWidth || 10,
            maxDepth: config.maxDepth || 15,
            explorationRate: config.explorationRate || 0.3
        };

        // State
        this.state = {
            phase: 'idle',
            branches: [],
            solutions: [],
            iterations: 0
        };

        // Human adaptation
        this.humanParams = {
            complexity: 1.0,
            exploration: 1.0,
            speed: 1.0,
            branchFactor: 1.0,
            visualDensity: 1.0
        };

        // Event handlers
        this.handlers = new Map();

        console.log(`[EmergenceOrchestrator] v${this.version} initialized`);
    }

    /**
     * Adapt engine behavior based on human metrics
     */
    adaptToHuman(feedback) {
        if (!feedback || !feedback.metrics) return;

        const metrics = feedback.metrics;
        const state = feedback.state;

        // Store human params
        this.humanParams = {
            complexity: state?.energyLevel === 'low' ? 0.5 : 1.0,
            exploration: state?.inFlow ? 1.5 : 1.0,
            speed: state?.focusLevel === 'hyperfocus' ? 1.5 :
                   state?.focusLevel === 'scattered' ? 0.7 : 1.0,
            branchFactor: Math.max(0.5, metrics.energy / 100),
            visualDensity: metrics.presence || 1.0
        };

        // Adjust core params
        this.params.branchFactor = Math.round(5 * this.humanParams.branchFactor);
        this.params.beamWidth = Math.round(10 * this.humanParams.exploration);
        this.params.explorationRate = state?.inFlow ? 0.4 : 0.3;

        console.log('[EmergenceOrchestrator] Adapted to human:', this.humanParams);
    }

    /**
     * Set engine parameters
     */
    setParameters(params) {
        Object.assign(this.params, params);
    }

    /**
     * Run a search iteration
     */
    async run(task) {
        this.state.phase = 'running';
        this.state.iterations++;

        this._emit('phase_start', { phase: 'search', iteration: this.state.iterations });

        // Simulate search with human-adapted parameters
        const branches = await this._generateBranches(task);

        // Evaluate branches
        const evaluated = await this._evaluateBranches(branches);

        // Select best
        const selected = this._selectBest(evaluated);

        this._emit('phase_complete', {
            phase: 'search',
            branchesGenerated: branches.length,
            branchesSelected: selected.length
        });

        this.state.branches = selected;
        return selected;
    }

    async _generateBranches(task) {
        const count = this.params.branchFactor * this.humanParams.branchFactor;
        const branches = [];

        for (let i = 0; i < count; i++) {
            branches.push({
                id: `branch_${this.state.iterations}_${i}`,
                depth: 0,
                score: Math.random() * 100,
                path: [],
                timestamp: Date.now()
            });

            this._emit('branch_spawn', { branch: branches[i] });

            // Simulate async work with human-adjusted speed
            await new Promise(r => setTimeout(r, 10 / this.humanParams.speed));
        }

        return branches;
    }

    async _evaluateBranches(branches) {
        return branches.map(b => ({
            ...b,
            score: b.score + Math.random() * 20 * this.humanParams.exploration
        }));
    }

    _selectBest(branches) {
        return branches
            .sort((a, b) => b.score - a.score)
            .slice(0, this.params.beamWidth);
    }

    /**
     * Subscribe to events
     */
    on(event, handler) {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, []);
        }
        this.handlers.get(event).push(handler);
    }

    _emit(event, data) {
        const handlers = this.handlers.get(event) || [];
        handlers.forEach(h => h(data));
    }

    getState() {
        return {
            ...this.state,
            params: this.params,
            humanParams: this.humanParams
        };
    }
}

module.exports = EmergenceOrchestrator;

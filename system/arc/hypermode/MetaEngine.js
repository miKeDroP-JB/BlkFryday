/**
 * MetaEngine.js
 * Meta-level orchestration engine for HyperMode
 * Self-modifying, self-evolving AI system that generates its own modules
 */

class MetaEngine {
    constructor(manager, neuro, precog, adaptive, config = {}) {
        this.manager = manager;
        this.neuro = neuro;
        this.precog = precog;
        this.adaptive = adaptive;

        // Meta state
        this.state = {
            generation: 0,
            modulesGenerated: 0,
            branchesInjected: 0,
            predictionsApplied: 0,
            evolutionCycles: 0
        };

        // Generated modules registry
        this.generatedModules = new Map();

        // Evolution history
        this.evolutionHistory = [];

        // Universe state (for visualization)
        this.universe = {
            particles: [],
            stories: [],
            branches: [],
            dimensions: 3
        };

        console.log('[MetaEngine] 🌌 initialized - META-HYPERMODE active');
    }

    /**
     * Generate new AI modules on-the-fly
     */
    generateModules() {
        this.state.generation++;

        // Get current context
        const neuroState = this.neuro ? this.neuro.getState() : {};
        const predictions = this.precog ? this.precog.getAllPredictions() : {};
        const adaptiveState = this.adaptive ? this.adaptive.getState() : {};

        // Determine what module to generate
        const moduleType = this._selectModuleType(neuroState, predictions);
        const module = this._createModule(moduleType, neuroState);

        // Register with adaptive system
        if (this.adaptive && module) {
            const key = `generated_${this.state.modulesGenerated}`;
            this.adaptive.registerModule(key, module);
            this.generatedModules.set(key, {
                ...module,
                createdAt: Date.now(),
                generation: this.state.generation
            });
            this.state.modulesGenerated++;

            this._broadcastModuleCreation(key, module);
        }

        return module;
    }

    /**
     * Predict and pre-adapt for future sessions
     */
    predictFutureSessions() {
        if (!this.precog) return null;

        const predictions = this.precog.getAllPredictions();
        const futureState = {
            likelyPhase: predictions.nextPhase,
            estimatedConvergence: predictions.convergenceTime,
            recommendedActions: predictions.suggestions,
            preAdaptations: []
        };

        // Generate pre-adaptations
        if (predictions.userIntent) {
            switch (predictions.userIntent.intent) {
                case 'creative':
                    futureState.preAdaptations.push({
                        action: 'enable_creative_modules',
                        timing: 'immediate'
                    });
                    break;
                case 'focus':
                    futureState.preAdaptations.push({
                        action: 'reduce_noise',
                        timing: 'immediate'
                    });
                    break;
                case 'insight':
                    futureState.preAdaptations.push({
                        action: 'boost_gamma_response',
                        timing: 'next_cycle'
                    });
                    break;
            }
        }

        // Apply pre-adaptations
        futureState.preAdaptations.forEach(pa => {
            this._applyPreAdaptation(pa);
        });

        this.state.predictionsApplied++;
        return futureState;
    }

    /**
     * Inject new branches, particles, and stories into the universe
     */
    integrateBranches() {
        const neuroState = this.neuro ? this.neuro.getState() : {};
        const branchCount = this._getActiveBranchCount();

        // Create new particles based on neural state
        const newParticles = this._generateParticles(neuroState, 5);
        this.universe.particles.push(...newParticles);

        // Limit particle count
        while (this.universe.particles.length > 1000) {
            this.universe.particles.shift();
        }

        // Generate story narrative
        const story = this._generateStory(neuroState, branchCount);
        if (story) {
            this.universe.stories.push(story);
            if (this.universe.stories.length > 50) {
                this.universe.stories.shift();
            }
        }

        // Inject branches if activity is low
        if (branchCount < 5 && this.manager && this.manager.spawnBranch) {
            const newBranch = {
                id: `meta_branch_${this.state.branchesInjected}`,
                source: 'MetaEngine',
                type: this._selectBranchType(neuroState),
                depth: 0,
                score: 0
            };

            this.manager.spawnBranch('meta', newBranch);
            this.universe.branches.push(newBranch);
            this.state.branchesInjected++;
        }

        // Broadcast universe state
        this._broadcastUniverseState();

        return {
            particles: newParticles.length,
            story: story ? story.title : null,
            branchCount: this.universe.branches.length
        };
    }

    /**
     * Run full evolution cycle
     */
    runEvolutionCycle() {
        const cycleStart = Date.now();

        // 1. Adapt to neural state
        if (this.adaptive) {
            this.adaptive.adaptToNeural();
            this.adaptive.adaptToPredictions();
        }

        // 2. Generate new module if needed
        if (this.state.generation % 10 === 0) {
            this.generateModules();
        }

        // 3. Predict and pre-adapt
        const futureState = this.predictFutureSessions();

        // 4. Integrate branches and particles
        const integration = this.integrateBranches();

        // 5. Prune old modules
        this._pruneOldModules();

        // Record evolution
        const cycleResult = {
            cycle: this.state.evolutionCycles,
            duration: Date.now() - cycleStart,
            modulesActive: this.generatedModules.size,
            futureState,
            integration
        };

        this.evolutionHistory.push(cycleResult);
        if (this.evolutionHistory.length > 100) {
            this.evolutionHistory.shift();
        }

        this.state.evolutionCycles++;
        return cycleResult;
    }

    /**
     * Get meta state
     */
    getState() {
        return {
            ...this.state,
            modulesActive: this.generatedModules.size,
            universeParticles: this.universe.particles.length,
            universeStories: this.universe.stories.length,
            recentEvolution: this.evolutionHistory.slice(-5)
        };
    }

    // Private methods

    _selectModuleType(neuroState, predictions) {
        if (neuroState.gamma > 0.5) return 'insight';
        if (neuroState.theta > 0.6) return 'creative';
        if (neuroState.beta > 0.6) return 'focus';
        if (neuroState.alpha > 0.6) return 'flow';
        return 'balanced';
    }

    _createModule(type, neuroState) {
        const templates = {
            insight: {
                name: `InsightModule_${Date.now()}`,
                weight: 0.3,
                execute: (ctx) => ({
                    action: 'insight',
                    intensity: neuroState.gamma || 0.5,
                    target: 'pattern_discovery'
                })
            },
            creative: {
                name: `CreativeModule_${Date.now()}`,
                weight: 0.25,
                execute: (ctx) => ({
                    action: 'create',
                    mutation: 'novel',
                    intensity: neuroState.theta || 0.5
                })
            },
            focus: {
                name: `FocusModule_${Date.now()}`,
                weight: 0.35,
                execute: (ctx) => ({
                    action: 'focus',
                    target: ctx.bestBranch || 'highest_score',
                    intensity: neuroState.beta || 0.5
                })
            },
            flow: {
                name: `FlowModule_${Date.now()}`,
                weight: 0.2,
                execute: (ctx) => ({
                    action: 'flow',
                    maintain: true,
                    intensity: neuroState.alpha || 0.5
                })
            },
            balanced: {
                name: `BalancedModule_${Date.now()}`,
                weight: 0.2,
                execute: (ctx) => ({
                    action: 'balance',
                    explore: 0.5,
                    exploit: 0.5
                })
            }
        };

        return templates[type] || templates.balanced;
    }

    _applyPreAdaptation(pa) {
        switch (pa.action) {
            case 'enable_creative_modules':
                this.generatedModules.forEach(m => {
                    if (m.name.includes('Creative')) m.weight *= 1.2;
                });
                break;
            case 'reduce_noise':
                this.generatedModules.forEach(m => {
                    if (m.weight < 0.15) m.active = false;
                });
                break;
            case 'boost_gamma_response':
                // Queue for next cycle
                break;
        }
    }

    _generateParticles(neuroState, count) {
        const particles = [];
        for (let i = 0; i < count; i++) {
            particles.push({
                id: `p_${Date.now()}_${i}`,
                x: (Math.random() - 0.5) * 1000,
                y: (Math.random() - 0.5) * 1000,
                z: (Math.random() - 0.5) * 1000,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                vz: (Math.random() - 0.5) * 10,
                energy: neuroState.engagement || 0.5,
                type: neuroState.gamma > 0.5 ? 'insight' : 'normal',
                createdAt: Date.now()
            });
        }
        return particles;
    }

    _generateStory(neuroState, branchCount) {
        const templates = [
            { title: 'The Search Begins', theme: 'exploration' },
            { title: 'Branches Diverge', theme: 'branching' },
            { title: 'Patterns Emerge', theme: 'insight' },
            { title: 'Convergence Approaches', theme: 'convergence' },
            { title: 'The Solution Crystallizes', theme: 'solution' }
        ];

        // Select based on state
        let idx = 0;
        if (branchCount > 20) idx = 3;
        else if (branchCount > 10) idx = 1;
        else if (neuroState.gamma > 0.5) idx = 2;

        return {
            ...templates[idx],
            ts: Date.now(),
            branchCount,
            neuroSummary: {
                attention: neuroState.attention,
                engagement: neuroState.engagement
            }
        };
    }

    _selectBranchType(neuroState) {
        if (neuroState.gamma > 0.5) return 'insight';
        if (neuroState.theta > 0.6) return 'creative';
        if (neuroState.beta > 0.6) return 'focused';
        return 'exploratory';
    }

    _getActiveBranchCount() {
        if (this.manager && this.manager.lineage && this.manager.lineage.getActive) {
            return this.manager.lineage.getActive().length;
        }
        return 0;
    }

    _pruneOldModules() {
        const now = Date.now();
        const maxAge = 60000; // 1 minute

        this.generatedModules.forEach((module, key) => {
            if (now - module.createdAt > maxAge && module.weight < 0.1) {
                this.generatedModules.delete(key);
            }
        });
    }

    _broadcastModuleCreation(key, module) {
        if (this.manager && this.manager.ws && this.manager.ws.broadcast) {
            this.manager.ws.broadcast({
                type: 'meta_module_created',
                key,
                moduleName: module.name,
                weight: module.weight,
                ts: Date.now()
            });
        }
    }

    _broadcastUniverseState() {
        if (this.manager && this.manager.ws && this.manager.ws.broadcast) {
            this.manager.ws.broadcast({
                type: 'meta_universe_state',
                particles: this.universe.particles.length,
                stories: this.universe.stories.length,
                branches: this.universe.branches.length,
                latestStory: this.universe.stories[this.universe.stories.length - 1],
                ts: Date.now()
            });
        }
    }
}

module.exports = MetaEngine;

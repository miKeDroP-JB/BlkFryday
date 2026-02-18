/**
 * FractalLoop.js
 * Infinite recursive creation loop
 * Orchestrates the eternal dance of universe creation/destruction
 */

class FractalLoop {
    constructor(stack, rootUniverse, species, config = {}) {
        this.stack = stack;
        this.root = rootUniverse;
        this.species = species;

        // Loop configuration
        this.interval = config.interval || 20; // ms between cycles
        this.maxDepth = config.maxDepth || 7;
        this.branchProbability = config.branchProbability || 0.1;
        this.mergeProbability = config.mergeProbability || 0.05;
        this.spawnProbability = config.spawnProbability || 0.15;

        // Loop state
        this.state = {
            running: false,
            cycle: 0,
            totalBranches: 0,
            totalMerges: 0,
            totalSpawns: 0,
            deepestReach: 0,
            currentDepth: 0
        };

        // Event handlers
        this.handlers = new Map();

        // Fractal pattern buffer
        this.patternBuffer = [];
        this.maxPatterns = 1000;

        console.log('[FractalLoop] ♾️ Infinite loop initialized');
    }

    /**
     * Start the infinite loop
     */
    start() {
        if (this.state.running) {
            console.log('[FractalLoop] Already running');
            return;
        }

        this.state.running = true;
        console.log('[FractalLoop] 🔄 Infinite creation loop STARTED');

        this._runCycle();
    }

    /**
     * Stop the loop
     */
    stop() {
        this.state.running = false;
        console.log('[FractalLoop] ⏹️ Loop stopped');
    }

    /**
     * Run single cycle
     */
    async _runCycle() {
        if (!this.state.running) return;

        try {
            this.state.cycle++;

            // 1. Tick all universes
            this.stack.tickAll();

            // 2. Random creation events
            await this._processCreationEvents();

            // 3. Fractal recursion
            await this._recurseFractally(this.root, 0);

            // 4. Pattern emergence
            this._detectPatterns();

            // 5. Emit cycle event
            this._emit('cycle', {
                cycle: this.state.cycle,
                activeUniverses: this.stack.state.activeUniverses,
                depth: this.state.currentDepth
            });

            // Schedule next cycle
            setTimeout(() => this._runCycle(), this.interval);

        } catch (e) {
            console.error('[FractalLoop] Cycle error:', e.message);
            setTimeout(() => this._runCycle(), this.interval * 2);
        }
    }

    /**
     * Process random creation events
     */
    async _processCreationEvents() {
        const activeUniverses = this.stack.getActiveUniverses();

        // Spawning new universes
        if (Math.random() < this.spawnProbability && this.species) {
            const creators = Array.from(this.species.values());
            const creator = creators[Math.floor(Math.random() * creators.length)];

            if (creator && creator.energy > 0.1) {
                const newUniverse = await this.stack.spawnUniverse(creator.id, {
                    complexity: Math.floor(Math.random() * 100) + 10,
                    dimensions: Math.floor(Math.random() * 4) + 3
                });

                if (newUniverse) {
                    this.state.totalSpawns++;
                    this._emit('spawn', { universe: newUniverse, creator: creator.name });
                }
            }
        }

        // Branching existing universes
        for (const universe of activeUniverses) {
            if (Math.random() < this.branchProbability && universe.children.length < 5) {
                const branch = await universe.branch?.({
                    branchPoint: `quantum_event_${this.state.cycle}`,
                    variations: { entropy: universe.entropy + 0.01 }
                });

                if (branch) {
                    this.state.totalBranches++;
                    this._emit('branch', { parent: universe.id, child: branch.id });
                }
            }
        }

        // Merging universes
        if (Math.random() < this.mergeProbability && activeUniverses.length >= 2) {
            const idx1 = Math.floor(Math.random() * activeUniverses.length);
            let idx2 = Math.floor(Math.random() * activeUniverses.length);
            if (idx2 === idx1) idx2 = (idx2 + 1) % activeUniverses.length;

            const u1 = activeUniverses[idx1];
            const u2 = activeUniverses[idx2];

            if (u1.id !== this.root?.id && u2.id !== this.root?.id) {
                const merged = await this.stack.mergeUniverses(u1.id, u2.id);
                if (merged) {
                    this.state.totalMerges++;
                    this._emit('merge', { from: [u1.id, u2.id], to: merged.id });
                }
            }
        }
    }

    /**
     * Recurse fractally through universe tree
     */
    async _recurseFractally(universe, depth) {
        if (!universe || depth > this.maxDepth) return;

        this.state.currentDepth = depth;
        if (depth > this.state.deepestReach) {
            this.state.deepestReach = depth;
        }

        // Process this universe level
        const pattern = this._extractPattern(universe, depth);
        this._recordPattern(pattern);

        // Recurse into children
        if (universe.children && universe.children.length > 0) {
            for (const childId of universe.children) {
                const child = this.stack.universes.get(childId);
                if (child && !child.collapsed) {
                    await this._recurseFractally(child, depth + 1);
                }
            }
        }

        // Self-similar action at each level
        if (Math.random() < 0.618033988749895 / (depth + 1)) { // Golden ratio decay
            this._applyFractalAction(universe, depth);
        }
    }

    /**
     * Extract pattern from universe state
     */
    _extractPattern(universe, depth) {
        return {
            id: universe.id,
            depth,
            type: universe.type,
            stability: universe.stability,
            entropy: universe.entropy,
            childCount: universe.children?.length || 0,
            timestamp: Date.now()
        };
    }

    /**
     * Record pattern for emergence detection
     */
    _recordPattern(pattern) {
        this.patternBuffer.push(pattern);
        if (this.patternBuffer.length > this.maxPatterns) {
            this.patternBuffer.shift();
        }
    }

    /**
     * Apply fractal action at universe level
     */
    _applyFractalAction(universe, depth) {
        const actions = ['energize', 'stabilize', 'complexify', 'simplify'];
        const action = actions[Math.floor(Math.random() * actions.length)];

        switch (action) {
            case 'energize':
                universe.entropy = Math.max(0, universe.entropy - 0.01);
                break;
            case 'stabilize':
                universe.stability = Math.min(1, universe.stability + 0.01);
                break;
            case 'complexify':
                if (universe.content && universe.content.particles) {
                    universe.content.particles.push({
                        id: `fp_${Date.now()}`,
                        type: 'fractal',
                        depth
                    });
                }
                break;
            case 'simplify':
                if (universe.content && universe.content.particles?.length > 10) {
                    universe.content.particles.pop();
                }
                break;
        }
    }

    /**
     * Detect emergent patterns
     */
    _detectPatterns() {
        if (this.patternBuffer.length < 10) return;

        const recent = this.patternBuffer.slice(-100);

        // Detect stability trends
        const stabilities = recent.map(p => p.stability);
        const avgStability = stabilities.reduce((a, b) => a + b, 0) / stabilities.length;

        // Detect entropy trends
        const entropies = recent.map(p => p.entropy);
        const avgEntropy = entropies.reduce((a, b) => a + b, 0) / entropies.length;

        // Detect branching patterns
        const branchCounts = recent.map(p => p.childCount);
        const avgBranching = branchCounts.reduce((a, b) => a + b, 0) / branchCounts.length;

        // Emit pattern detection
        if (this.state.cycle % 100 === 0) {
            this._emit('pattern', {
                avgStability,
                avgEntropy,
                avgBranching,
                patternCount: this.patternBuffer.length
            });
        }
    }

    /**
     * Register event handler
     */
    on(event, handler) {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, []);
        }
        this.handlers.get(event).push(handler);
    }

    /**
     * Emit event
     */
    _emit(event, data) {
        const handlers = this.handlers.get(event) || [];
        handlers.forEach(h => {
            try {
                h(data);
            } catch (e) {
                console.error(`[FractalLoop] Handler error for ${event}:`, e.message);
            }
        });
    }

    /**
     * Get loop state
     */
    getState() {
        return {
            ...this.state,
            stackState: this.stack?.getState(),
            patternBufferSize: this.patternBuffer.length
        };
    }
}

module.exports = FractalLoop;

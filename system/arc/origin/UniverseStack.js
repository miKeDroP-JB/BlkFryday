/**
 * UniverseStack.js
 * Manages multiple parallel universes spawned by meta-creators
 * Stack of realities that can interact and branch
 */

class UniverseStack {
    constructor(species, config = {}) {
        this.species = species; // Map of meta-creators
        this.maxUniverses = config.maxUniverses || 100;
        this.interactionRadius = config.interactionRadius || 0.1;

        // Universe registry
        this.universes = new Map();
        this.primeUniverse = null;

        // Stack state
        this.state = {
            totalUniverses: 0,
            activeUniverses: 0,
            collapsedUniverses: 0,
            mergedUniverses: 0,
            branchedUniverses: 0
        };

        // Universe interaction log
        this.interactions = [];

        // Multiverse coherence
        this.coherenceMatrix = [];

        console.log('[UniverseStack] 📚 Universe stack initialized');
        console.log(`[UniverseStack] -> Max capacity: ${this.maxUniverses}`);
        console.log(`[UniverseStack] -> Species count: ${species?.size || 0}`);
    }

    /**
     * Generate the prime universe (root of all creation)
     */
    async generatePrimeUniverse() {
        console.log('[UniverseStack] 🌟 Generating Prime Universe...');

        // Select creator with highest energy
        let primeCreator = null;
        let maxEnergy = 0;

        if (this.species) {
            this.species.forEach((creator) => {
                if (creator.energy > maxEnergy) {
                    maxEnergy = creator.energy;
                    primeCreator = creator;
                }
            });
        }

        // Create prime universe with combined aspects
        const primeUniverse = {
            id: 'prime_universe_0',
            type: 'prime',
            creator: primeCreator?.id || 'origin',
            createdAt: Date.now(),
            age: 0,
            stability: 1.0,
            entropy: 0.0,
            dimensions: 11,

            // Core properties
            properties: {
                hasTime: true,
                hasSpace: true,
                hasMatter: true,
                hasEnergy: true,
                hasConsciousness: true,
                hasInformation: true
            },

            // Physical constants (normalized)
            constants: {
                lightSpeed: 1.0,
                planckConstant: 1.0,
                gravitationalConstant: 1.0,
                fineStructure: 0.007297352569,
                cosmologicalConstant: 1e-52
            },

            // State
            state: {
                particles: [],
                fields: [],
                structures: [],
                observers: []
            },

            // Children (branched universes)
            children: [],

            // Methods
            tick: () => this._tickUniverse('prime_universe_0'),
            branch: (params) => this._branchUniverse('prime_universe_0', params),
            collapse: () => this._collapseUniverse('prime_universe_0')
        };

        // Initialize with seed structures
        primeUniverse.state.particles = this._generateSeedParticles(1000);
        primeUniverse.state.fields = this._generateSeedFields(4);
        primeUniverse.state.structures = this._generateSeedStructures(10);

        // Register
        this.universes.set(primeUniverse.id, primeUniverse);
        this.primeUniverse = primeUniverse;
        this.state.totalUniverses++;
        this.state.activeUniverses++;

        console.log('[UniverseStack] ✅ Prime Universe generated');
        console.log(`[UniverseStack] -> Particles: ${primeUniverse.state.particles.length}`);
        console.log(`[UniverseStack] -> Fields: ${primeUniverse.state.fields.length}`);
        console.log(`[UniverseStack] -> Structures: ${primeUniverse.state.structures.length}`);

        return primeUniverse;
    }

    /**
     * Generate seed particles
     */
    _generateSeedParticles(count) {
        const particles = [];
        const types = ['quark', 'lepton', 'boson', 'photon', 'neutrino'];

        for (let i = 0; i < count; i++) {
            particles.push({
                id: `p_${i}`,
                type: types[Math.floor(Math.random() * types.length)],
                position: [Math.random() * 1000, Math.random() * 1000, Math.random() * 1000],
                momentum: [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5],
                spin: Math.random() > 0.5 ? 0.5 : -0.5,
                charge: (Math.floor(Math.random() * 3) - 1) / 3,
                mass: Math.random() * 10
            });
        }

        return particles;
    }

    /**
     * Generate seed fields
     */
    _generateSeedFields(count) {
        const fieldTypes = ['electromagnetic', 'gravitational', 'strong', 'weak', 'higgs'];
        const fields = [];

        for (let i = 0; i < count; i++) {
            fields.push({
                id: `f_${i}`,
                type: fieldTypes[i % fieldTypes.length],
                strength: Math.random(),
                range: fieldTypes[i % fieldTypes.length] === 'gravitational' ? Infinity : Math.random() * 100,
                coupling: Math.random() * 0.1
            });
        }

        return fields;
    }

    /**
     * Generate seed structures
     */
    _generateSeedStructures(count) {
        const structureTypes = ['atom', 'molecule', 'crystal', 'star', 'galaxy', 'cluster'];
        const structures = [];

        for (let i = 0; i < count; i++) {
            structures.push({
                id: `s_${i}`,
                type: structureTypes[Math.floor(Math.random() * structureTypes.length)],
                complexity: Math.floor(Math.random() * 100),
                stability: Math.random(),
                position: [Math.random() * 10000, Math.random() * 10000, Math.random() * 10000],
                size: Math.pow(10, Math.random() * 20) // Vast range of scales
            });
        }

        return structures;
    }

    /**
     * Spawn new universe from a creator
     */
    async spawnUniverse(creatorId, params = {}) {
        if (this.universes.size >= this.maxUniverses) {
            console.log('[UniverseStack] ⚠️ Max universe capacity reached');
            return null;
        }

        const creator = this.species?.get(creatorId);
        if (!creator) {
            console.log('[UniverseStack] ⚠️ Creator not found:', creatorId);
            return null;
        }

        // Use creator's method to generate universe content
        const content = await creator.createUniverse(params);

        const universe = {
            id: `universe_${this.state.totalUniverses}`,
            type: content.type,
            creator: creatorId,
            createdAt: Date.now(),
            age: 0,
            stability: 0.8 + Math.random() * 0.2,
            entropy: 0.0,
            dimensions: params.dimensions || 3,
            content,
            children: [],
            parent: params.parent || null
        };

        this.universes.set(universe.id, universe);
        this.state.totalUniverses++;
        this.state.activeUniverses++;

        // Update creator stats
        creator.universesCreated++;
        creator.energy -= 0.1;

        console.log(`[UniverseStack] 🌌 Universe spawned: ${universe.id} (${content.type})`);

        return universe;
    }

    /**
     * Branch an existing universe
     */
    async _branchUniverse(universeId, params = {}) {
        const parent = this.universes.get(universeId);
        if (!parent) return null;

        const branch = {
            id: `${universeId}_branch_${parent.children.length}`,
            type: 'branch',
            creator: parent.creator,
            createdAt: Date.now(),
            age: 0,
            stability: parent.stability * 0.9,
            entropy: parent.entropy,
            dimensions: parent.dimensions,
            content: JSON.parse(JSON.stringify(parent.content || {})),
            children: [],
            parent: universeId,
            branchPoint: params.branchPoint || 'quantum_event'
        };

        // Apply variations
        if (branch.content && params.variations) {
            Object.assign(branch.content, params.variations);
        }

        this.universes.set(branch.id, branch);
        parent.children.push(branch.id);
        this.state.totalUniverses++;
        this.state.activeUniverses++;
        this.state.branchedUniverses++;

        console.log(`[UniverseStack] 🌿 Universe branched: ${branch.id}`);

        return branch;
    }

    /**
     * Collapse a universe
     */
    _collapseUniverse(universeId) {
        const universe = this.universes.get(universeId);
        if (!universe) return false;

        universe.collapsed = true;
        universe.collapsedAt = Date.now();
        this.state.activeUniverses--;
        this.state.collapsedUniverses++;

        console.log(`[UniverseStack] 💫 Universe collapsed: ${universeId}`);

        return true;
    }

    /**
     * Merge two universes
     */
    async mergeUniverses(id1, id2) {
        const u1 = this.universes.get(id1);
        const u2 = this.universes.get(id2);

        if (!u1 || !u2) return null;

        const merged = {
            id: `merged_${this.state.totalUniverses}`,
            type: 'merged',
            creator: 'stack',
            createdAt: Date.now(),
            age: 0,
            stability: (u1.stability + u2.stability) / 2,
            entropy: Math.max(u1.entropy, u2.entropy),
            dimensions: Math.max(u1.dimensions, u2.dimensions),
            content: {
                from: [id1, id2],
                combined: true
            },
            children: [],
            parents: [id1, id2]
        };

        this.universes.set(merged.id, merged);
        this._collapseUniverse(id1);
        this._collapseUniverse(id2);
        this.state.totalUniverses++;
        this.state.activeUniverses++;
        this.state.mergedUniverses++;

        console.log(`[UniverseStack] 🔀 Universes merged: ${id1} + ${id2} -> ${merged.id}`);

        return merged;
    }

    /**
     * Tick universe (advance time)
     */
    _tickUniverse(universeId) {
        const universe = this.universes.get(universeId);
        if (!universe || universe.collapsed) return;

        universe.age++;
        universe.entropy += 0.001;
        universe.stability = Math.max(0, universe.stability - 0.0001);

        // Collapse if too unstable
        if (universe.stability < 0.1) {
            this._collapseUniverse(universeId);
        }
    }

    /**
     * Tick all active universes
     */
    tickAll() {
        this.universes.forEach((universe, id) => {
            if (!universe.collapsed) {
                this._tickUniverse(id);
            }
        });
    }

    /**
     * Get all active universes
     */
    getActiveUniverses() {
        const active = [];
        this.universes.forEach((u) => {
            if (!u.collapsed) active.push(u);
        });
        return active;
    }

    /**
     * Get stack state
     */
    getState() {
        return {
            ...this.state,
            primeUniverseId: this.primeUniverse?.id,
            universeList: Array.from(this.universes.keys())
        };
    }
}

module.exports = UniverseStack;

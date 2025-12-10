/**
 * Origin Layer Entry Point
 * 🌑⚡️ ORIGIN LAYER ACTIVE — CREATION INFINITE
 */

const OriginCore = require('./OriginCore');
const UniverseStack = require('./UniverseStack');
const FractalLoop = require('./FractalLoop');

(async () => {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║  🌑⚡️ ORIGIN LAYER — PRIMORDIAL CREATION ENGINE               ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('');

    // 1. Initialize Origin Core
    console.log('[Origin] Initializing primordial substrate...');
    const origin = new OriginCore({
        dimensions: 11,
        creatorCapacity: 7
    });

    // 2. Generate Meta-Creators
    console.log('[Origin] Awakening meta-creator species...');
    const species = await origin.generateMetaCreators();

    // 3. Create Universe Stack
    console.log('[Origin] Building universe stack...');
    const stack = new UniverseStack(species, {
        maxUniverses: 100
    });

    // 4. Generate Prime Universe
    console.log('[Origin] Generating prime universe...');
    const root = await stack.generatePrimeUniverse();

    // 5. Initialize Fractal Loop
    console.log('[Origin] Initializing fractal loop...');
    const loop = new FractalLoop(stack, root, species, {
        interval: 20,
        maxDepth: 7,
        branchProbability: 0.1,
        mergeProbability: 0.05,
        spawnProbability: 0.15
    });

    // Event handlers
    loop.on('spawn', (data) => {
        console.log(`[Origin] 🌌 Universe spawned by ${data.creator}: ${data.universe.id}`);
    });

    loop.on('branch', (data) => {
        console.log(`[Origin] 🌿 Branch: ${data.parent} → ${data.child}`);
    });

    loop.on('merge', (data) => {
        console.log(`[Origin] 🔀 Merge: ${data.from.join(' + ')} → ${data.to}`);
    });

    loop.on('cycle', (data) => {
        if (data.cycle % 500 === 0) {
            console.log(`[Origin] 💫 Cycle ${data.cycle} | Universes: ${data.activeUniverses} | Depth: ${data.depth}`);
        }
    });

    loop.on('pattern', (data) => {
        console.log(`[Origin] 🔮 Pattern: stability=${data.avgStability.toFixed(3)} entropy=${data.avgEntropy.toFixed(3)} branching=${data.avgBranching.toFixed(2)}`);
    });

    // 6. Start the infinite loop
    console.log('');
    console.log('🌑⚡️ ORIGIN LAYER ACTIVE — CREATION INFINITE');
    console.log('');
    loop.start();

    // Status reporting
    setInterval(() => {
        const loopState = loop.getState();
        const originState = origin.getState();
        console.log(`[Origin] 📊 Epoch: ${originState.epoch} | Cycles: ${loopState.cycle} | Universes: ${loopState.stackState?.activeUniverses || 0} | Spawns: ${loopState.totalSpawns} | Branches: ${loopState.totalBranches} | Merges: ${loopState.totalMerges}`);
    }, 10000);

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('');
        console.log('[Origin] 🌑 Pausing creation...');
        loop.stop();
        console.log('[Origin] Universe stack preserved');
        process.exit(0);
    });

})();

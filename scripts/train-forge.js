#!/usr/bin/env node
// ============================================================
//  FRACTAL REALITY FORGE - Training Runner
//  Seeds codebase and starts recursive learning loops
// ============================================================

const path = require('path');
const fs = require('fs');
const { getFractalForge } = require('../system/forge/FractalRealityForge');
const { getAllTrainingData, getDataStats } = require('../data/knowledge/agi-training-data');

// ============================================================
//  CONFIGURATION
// ============================================================

// Parse command line args
const args = process.argv.slice(2);
const cyclesArg = args.find(a => a.startsWith('--cycles='));
const requestedCycles = cyclesArg ? parseInt(cyclesArg.split('=')[1]) : 36;
const resumeFlag = args.includes('--resume');

const CONFIG = {
  dimensions: 369,                    // Tesla's number for holo-memory
  maxIterations: 369,                 // Full training cycles
  convergenceThreshold: 0.0000001,    // Much tighter - prevents false convergence
  quickBurstIterations: requestedCycles,
  minIterationsBeforeConvergence: 36, // Don't even check convergence until 36 iterations
  refinementStrength: 0.05            // 5% improvement per refinement (was 0.0006%)
};

// ============================================================
//  TRAINING RUNNER
// ============================================================

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║              🔮 FRACTAL REALITY FORGE - TRAINING SYSTEM 🔮                   ║
║                                                                              ║
║                  "Every fragment contains the whole"                         ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  Architecture:                                                               ║
║  • Micro-Processing Nodes (${CONFIG.dimensions} fractal units)                           ║
║  • Holo-Memory Layer (distributed overlap storage)                           ║
║  • Recursive Loop Engine (up to ${CONFIG.maxIterations} cycles)                           ║
║  • Reality Forge Output (emergent solutions)                                 ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

  // Initialize forge
  const forge = getFractalForge(CONFIG);

  // ============================================================
  //  PHASE 0: CHECK FOR RESUME
  // ============================================================

  if (resumeFlag) {
    console.log('\n🔄 PHASE 0: Resuming from previous training...\n');
    const loaded = forge.loadState();
    if (loaded.state) {
      console.log(`  ✅ Resumed from iteration ${forge.loopEngine.iteration}`);
      console.log(`  ✅ Loaded ${loaded.patterns} refined patterns`);
    } else {
      console.log('  ⚠️  No previous state found, starting fresh');
    }
  }

  // ============================================================
  //  PHASE 1: SEED FROM CODEBASE
  // ============================================================

  console.log('\n📡 PHASE 1: Seeding from codebase...\n');

  const codebaseDir = path.join(__dirname, '../system');
  const seedResult = await forge.seedFromCodebase(codebaseDir);

  console.log(`
  ✅ Seeding Complete:
     • Files processed: ${seedResult.files}
     • Patterns extracted: ${seedResult.patterns}
     • Atomic units: ${seedResult.atoms}
  `);

  // ============================================================
  //  PHASE 2: ADD SYNTHETIC EDGE CASES
  // ============================================================

  console.log('\n🧬 PHASE 2: Adding synthetic data...\n');

  const syntheticData = generateSyntheticData();
  await forge.seedSynthetic(syntheticData);
  console.log(`  ✅ Added ${syntheticData.length} synthetic patterns`);

  // ============================================================
  //  PHASE 2.5: INJECT HIGH-VALUE AGI TRAINING DATA
  // ============================================================

  console.log('\n📚 PHASE 2.5: Injecting AGI training data...\n');

  const agiData = getAllTrainingData();
  const agiStats = getDataStats();

  // Inject into forge's holo-memory
  for (const pattern of agiData) {
    forge.holoMemory.store(
      pattern.id || pattern.name || `agi_${Math.random().toString(36).slice(2, 8)}`,
      pattern,
      { type: 'agi_knowledge', source: 'curated', priority: 'high' }
    );
  }

  console.log(`  ✅ Injected ${agiData.length} expert-curated patterns:`);
  console.log(`     • Reasoning chains:    ${agiStats.reasoning_chains}`);
  console.log(`     • Knowledge graph:     ${agiStats.knowledge_graph}`);
  console.log(`     • Cross-domain:        ${agiStats.cross_domain}`);
  console.log(`     • Meta-learning:       ${agiStats.meta_learning}`);
  console.log(`     • Abstract concepts:   ${agiStats.abstract_concepts}`);
  console.log(`     • Problem solutions:   ${agiStats.problem_solutions}`);
  console.log(`     • Cognitive primitives: ${agiStats.cognitive_primitives}`);
  console.log(`     • Mathematical:        ${agiStats.mathematical}`);

  // ============================================================
  //  PHASE 3: START TRAINING LOOPS
  // ============================================================

  console.log('\n🔄 PHASE 3: Starting recursive training loops...\n');
  console.log('  [This will run continuous improvement cycles]');
  console.log('  [Press Ctrl+C to stop early]\n');

  // Listen to events
  forge.on('cycle:complete', (data) => {
    if (data.iteration % 9 === 0) {  // Log every 9th iteration
      console.log(`  [Cycle ${data.iteration}] AGI Score: ${data.evaluation.agiScore.toFixed(2)} | Efficiency: ${data.evaluation.efficiency.toFixed(4)} | Δ: ${data.evaluation.delta > 0 ? '+' : ''}${data.evaluation.delta.toFixed(3)}`);
    }
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n  ⚠️  Stopping training gracefully...');
    forge.stopTraining();
  });

  // Run quick burst first
  console.log(`  🚀 Running training burst (${CONFIG.quickBurstIterations} iterations)...\n`);
  const burstResults = await forge.quickBurst(CONFIG.quickBurstIterations);

  console.log(`
  ╔═══════════════════════════════════════════════════════════════════════╗
  ║                      QUICK BURST RESULTS                              ║
  ╠═══════════════════════════════════════════════════════════════════════╣
  ║  Iterations:        ${String(burstResults.iterations).padEnd(45)}║
  ║  Final AGI Score:   ${String(burstResults.finalAGIScore.toFixed(2)).padEnd(45)}║
  ║  Total Improvement: ${String(burstResults.totalImprovement.toFixed(4)).padEnd(45)}║
  ║  Avg Efficiency:    ${String(burstResults.averageEfficiency.toFixed(4)).padEnd(45)}║
  ║  Memory Positions:  ${String(burstResults.memoryStats.positions).padEnd(45)}║
  ║  Entanglements:     ${String(burstResults.memoryStats.entanglements).padEnd(45)}║
  ║  Converged:         ${String(burstResults.converged).padEnd(45)}║
  ╚═══════════════════════════════════════════════════════════════════════╝
  `);

  // Save state
  const savedState = forge.saveState();
  console.log(`\n  💾 State saved to data/forge/forge-state.json`);

  // Show final state
  const state = forge.getState();
  console.log(`
  ════════════════════════════════════════════════════════════════════════
                           FINAL STATE
  ════════════════════════════════════════════════════════════════════════

  📊 Statistics:
     • Files Processed:      ${state.stats.filesProcessed}
     • Patterns Extracted:   ${state.stats.patternsExtracted}
     • Atomic Units:         ${state.stats.atomicUnits}
     • Training Iterations:  ${state.stats.trainingIterations}

  🧠 Memory:
     • Holo Positions:       ${state.memory.positions}
     • Total Items:          ${state.memory.totalItems}
     • Entanglements:        ${state.memory.entanglements}
     • Global Patterns:      ${state.memory.globalPatterns}

  🎯 Loop Results:
     • Final AGI Score:      ${state.loopResults.finalAGIScore.toFixed(2)}
     • Converged:            ${state.loopResults.converged}

  ════════════════════════════════════════════════════════════════════════
  `);

  // Test simulation
  console.log('\n  🔮 Testing prediction simulation...\n');
  const sim = forge.generateSimulation('brain');
  console.log(`  Query: "brain"
  Direct matches: ${sim.directMatches}
  Entangled patterns: ${sim.entangledPatterns}
  Confidence: ${(sim.prediction.confidence * 100).toFixed(1)}%
  Pattern types: ${sim.prediction.patternTypes.join(', ')}`);

  console.log(`

╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                    ✅ FRACTAL FORGE TRAINING COMPLETE                        ║
║                                                                              ║
║               System has learned ${state.stats.patternsExtracted} patterns from your codebase            ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);
}

// ============================================================
//  SYNTHETIC DATA GENERATOR
// ============================================================

function generateSyntheticData() {
  const data = [];

  // Edge cases for recursive reasoning
  const recursivePatterns = [
    { type: 'recursion', name: 'fibonacci', depth: 'infinite', pattern: 'f(n) = f(n-1) + f(n-2)' },
    { type: 'recursion', name: 'factorial', depth: 'bounded', pattern: 'n! = n * (n-1)!' },
    { type: 'recursion', name: 'tree_traversal', depth: 'logarithmic', pattern: 'visit(node) { visit(left); visit(right); }' },
    { type: 'recursion', name: 'backtracking', depth: 'exponential', pattern: 'try -> fail -> undo -> try_next' },
    { type: 'recursion', name: 'memoization', depth: 'optimized', pattern: 'cache[key] || compute(key)' }
  ];

  // Multi-domain patterns
  const domainPatterns = [
    { type: 'domain', name: 'nlp_tokenize', domain: 'language', pattern: 'text -> tokens -> embeddings' },
    { type: 'domain', name: 'vision_cnn', domain: 'vision', pattern: 'image -> conv -> pool -> features' },
    { type: 'domain', name: 'audio_fft', domain: 'audio', pattern: 'waveform -> frequency -> spectrogram' },
    { type: 'domain', name: 'graph_traverse', domain: 'graph', pattern: 'node -> edges -> neighbors -> path' },
    { type: 'domain', name: 'time_series', domain: 'temporal', pattern: 'sequence -> lag -> trend -> forecast' }
  ];

  // Glyph compression patterns
  const glyphPatterns = [
    { type: 'glyph', symbol: 'ƒ', meaning: 'function', compression: 8 },
    { type: 'glyph', symbol: '→', meaning: 'return/transform', compression: 6 },
    { type: 'glyph', symbol: '⊛', meaning: 'apply/map', compression: 5 },
    { type: 'glyph', symbol: '⊕', meaning: 'combine/merge', compression: 7 },
    { type: 'glyph', symbol: '∀', meaning: 'for all', compression: 7 },
    { type: 'glyph', symbol: '∃', meaning: 'exists', compression: 6 },
    { type: 'glyph', symbol: '⊢', meaning: 'yields/produces', compression: 9 },
    { type: 'glyph', symbol: '≡', meaning: 'equivalent', compression: 10 },
    { type: 'glyph', symbol: '⊸', meaning: 'linear implication', compression: 18 }
  ];

  // AGI reasoning patterns
  const agiPatterns = [
    { type: 'agi', name: 'analogical_reasoning', score: 0.8, pattern: 'A:B :: C:?' },
    { type: 'agi', name: 'causal_inference', score: 0.7, pattern: 'cause -> effect -> counterfactual' },
    { type: 'agi', name: 'meta_learning', score: 0.9, pattern: 'learn(how_to_learn(task))' },
    { type: 'agi', name: 'transfer_learning', score: 0.75, pattern: 'domain_A.knowledge -> domain_B' },
    { type: 'agi', name: 'self_reflection', score: 0.85, pattern: 'observe(self) -> analyze -> improve' }
  ];

  data.push(...recursivePatterns, ...domainPatterns, ...glyphPatterns, ...agiPatterns);

  return data;
}

// ============================================================
//  RUN
// ============================================================

main().catch(console.error);

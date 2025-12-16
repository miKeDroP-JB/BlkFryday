#!/usr/bin/env node
/**
 * VFLOW SYSTEM - COMPREHENSIVE TEST SUITE
 * ═══════════════════════════════════════════════════════════════════
 * Tests all components:
 * 1. Voice Cockpit
 * 2. Solve Loop
 * 3. 3iAtlas
 * 4. State Machine
 * 5. Full Integration with ARC
 * ═══════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

// Import components
const { VoiceCockpit, VoiceCommandParser, AtlasPosition, HUDState } = require('./cockpit/VoiceCockpit');
const { SolveLoop, AmoebaExecutor, VerificationGate } = require('./core/SolveLoop');
const { ThreeIAtlas, CognitiveNode, CognitiveEdge } = require('./atlas/ThreeIAtlas');
const { VFlowStateMachine, VFlowConfig, STATES } = require('./core/VFlowStateMachine');
const { VFlowSystem, createVFlowSystem, PRESETS } = require('./VFlowSystem');

// Test results collector
const results = {
  startTime: Date.now(),
  tests: [],
  passed: 0,
  failed: 0,
  benchmarks: {}
};

function test(name, fn) {
  const start = Date.now();
  try {
    fn();
    const elapsed = Date.now() - start;
    results.tests.push({ name, status: 'PASS', elapsed });
    results.passed++;
    console.log(`  ✓ ${name} (${elapsed}ms)`);
  } catch (error) {
    const elapsed = Date.now() - start;
    results.tests.push({ name, status: 'FAIL', elapsed, error: error.message });
    results.failed++;
    console.log(`  ✗ ${name} (${elapsed}ms)`);
    console.log(`    Error: ${error.message}`);
  }
}

async function asyncTest(name, fn) {
  const start = Date.now();
  try {
    await fn();
    const elapsed = Date.now() - start;
    results.tests.push({ name, status: 'PASS', elapsed });
    results.passed++;
    console.log(`  ✓ ${name} (${elapsed}ms)`);
  } catch (error) {
    const elapsed = Date.now() - start;
    results.tests.push({ name, status: 'FAIL', elapsed, error: error.message });
    results.failed++;
    console.log(`  ✗ ${name} (${elapsed}ms)`);
    console.log(`    Error: ${error.message}`);
  }
}

function benchmark(name, fn, iterations = 1000) {
  const times = [];
  for (let i = 0; i < iterations; i++) {
    const start = process.hrtime.bigint();
    fn();
    const end = process.hrtime.bigint();
    times.push(Number(end - start) / 1000000); // Convert to ms
  }

  times.sort((a, b) => a - b);
  const stats = {
    min: times[0],
    max: times[times.length - 1],
    avg: times.reduce((a, b) => a + b, 0) / times.length,
    p50: times[Math.floor(times.length * 0.5)],
    p95: times[Math.floor(times.length * 0.95)],
    p99: times[Math.floor(times.length * 0.99)],
    iterations
  };

  results.benchmarks[name] = stats;
  return stats;
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

// ═══════════════════════════════════════════════════════════════════
// TEST SUITES
// ═══════════════════════════════════════════════════════════════════

console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║              VFLOW SYSTEM TEST SUITE                              ║
║           "Putting it through its paces"                          ║
╚═══════════════════════════════════════════════════════════════════╝
`);

// ───────────────────────────────────────────────────────────────────
// 1. VOICE COCKPIT TESTS
// ───────────────────────────────────────────────────────────────────

console.log('\n═══ 1. VOICE COCKPIT TESTS ═══\n');

test('VoiceCommandParser: parse direct commands', () => {
  const parser = new VoiceCommandParser();

  assertEqual(parser.parse('solve').action, 'SOLVE');
  assertEqual(parser.parse('pause').action, 'PAUSE');
  assertEqual(parser.parse('explain path').action, 'EXPLAIN_PATH');
  assertEqual(parser.parse('slow down').action, 'SLOW_DOWN');
  assertEqual(parser.parse('try different').action, 'SWITCH_STRATEGY');
});

test('VoiceCommandParser: parse natural language', () => {
  const parser = new VoiceCommandParser();

  assertEqual(parser.parse('what is happening').action, 'STATUS');
  assertEqual(parser.parse('why did you do that').action, 'EXPLAIN_PATH');
  assertEqual(parser.parse('try something different').action, 'SWITCH_STRATEGY');
});

test('VoiceCommandParser: get help returns all commands', () => {
  const parser = new VoiceCommandParser();
  const help = parser.getHelp();

  assert(help.length >= 20, 'Should have at least 20 commands');
  assert(help.some(h => h.phrase === 'solve'), 'Should include solve');
  assert(help.some(h => h.phrase === 'verify'), 'Should include verify');
});

test('AtlasPosition: initial position is centered', () => {
  const pos = new AtlasPosition();

  assertEqual(pos.insight, 0.5);
  assertEqual(pos.intelligence, 0.5);
  assertEqual(pos.imagination, 0.5);
});

test('AtlasPosition: move clamps values', () => {
  const pos = new AtlasPosition();

  pos.move({ insight: 1.0 }); // Should cap at 1.0
  assertEqual(pos.insight, 1.0);

  pos.move({ insight: -2.0 }); // Should cap at 0.0
  assertEqual(pos.insight, 0.0);
});

test('AtlasPosition: trajectory records history', () => {
  const pos = new AtlasPosition();

  pos.move({ insight: 0.1 });
  pos.move({ intelligence: 0.1 });
  pos.move({ imagination: 0.1 });

  const trajectory = pos.getTrajectory(10);
  assertEqual(trajectory.length, 3);
});

test('HUDState: feed panels work', () => {
  const hud = new HUDState();

  hud.addFeed('left', 'Test message 1');
  hud.addFeed('right', 'Test message 2');
  hud.addFeed('center', 'Test message 3');

  const snapshot = hud.getSnapshot();
  assertEqual(snapshot.feeds.left.length, 1);
  assertEqual(snapshot.feeds.right.length, 1);
  assertEqual(snapshot.feeds.center.length, 1);
});

test('VoiceCockpit: process voice commands', () => {
  const cockpit = new VoiceCockpit();

  const result = cockpit.processVoiceInput('status');
  assert(result.success, 'Status command should succeed');
  assert(result.status, 'Should return status object');
});

test('VoiceCockpit: show position', () => {
  const cockpit = new VoiceCockpit();

  const result = cockpit.processVoiceInput('show position');
  assert(result.success, 'Show position should succeed');
  assert(result.position.insight !== undefined, 'Should have insight');
});

// Benchmark voice parsing
const parser = new VoiceCommandParser();
const voiceBench = benchmark('Voice command parsing', () => {
  parser.parse('explain the reasoning path');
}, 10000);
console.log(`  Benchmark: ${voiceBench.avg.toFixed(3)}ms avg, ${voiceBench.p99.toFixed(3)}ms p99`);

// ───────────────────────────────────────────────────────────────────
// 2. SOLVE LOOP TESTS
// ───────────────────────────────────────────────────────────────────

console.log('\n═══ 2. SOLVE LOOP TESTS ═══\n');

test('AmoebaExecutor: select strategy', () => {
  const amoeba = new AmoebaExecutor();

  const selection = amoeba.selectStrategy(
    { type: 'transformation', complexity: 0.5 },
    { depth: 1 },
    []
  );

  assert(selection.strategy, 'Should select a strategy');
  assert(selection.depth === 1, 'Should maintain depth');
});

test('AmoebaExecutor: avoid failed strategies', () => {
  const amoeba = new AmoebaExecutor();

  const selection = amoeba.selectStrategy(
    { type: 'transformation' },
    { depth: 1 },
    ['direct_solve', 'decomposition', 'pattern_match']
  );

  assert(!['direct_solve', 'decomposition', 'pattern_match'].includes(selection.strategy),
    'Should not select failed strategies');
});

test('AmoebaExecutor: record attempts', () => {
  const amoeba = new AmoebaExecutor();

  amoeba.recordAttempt('pattern_match', true, { depth: 1 });
  amoeba.recordAttempt('pattern_match', true, { depth: 1 });
  amoeba.recordAttempt('pattern_match', false, { depth: 1 });

  const rate = amoeba.getStrategySuccessRate('pattern_match');
  assert(Math.abs(rate - 0.667) < 0.01, 'Success rate should be ~66.7%');
});

test('AmoebaExecutor: adapt depth', () => {
  const amoeba = new AmoebaExecutor();

  const newDepth1 = amoeba.adaptDepth(1, { confidence: 0.95 });
  assertEqual(newDepth1, 1, 'High confidence should not increase depth');

  const newDepth2 = amoeba.adaptDepth(1, { confidence: 0.2 });
  assertEqual(newDepth2, 3, 'Low confidence should increase depth by 2');
});

test('VerificationGate: run check', async () => {
  const gate = new VerificationGate('test', (problem, solution) => {
    return { passed: solution === 'correct', confidence: solution === 'correct' ? 1.0 : 0.0 };
  });

  const result1 = await gate.run({}, 'correct', {});
  assert(result1.passed, 'Should pass with correct solution');

  const result2 = await gate.run({}, 'wrong', {});
  assert(!result2.passed, 'Should fail with wrong solution');
});

test('SolveLoop: creates with default gates', () => {
  const loop = new SolveLoop();

  assert(loop.gates.length >= 5, 'Should have at least 5 verification gates');
  assert(loop.gates.some(g => g.name === 'format'), 'Should have format gate');
  assert(loop.gates.some(g => g.name === 'consistency'), 'Should have consistency gate');
});

test('SolveLoop: add custom gate', () => {
  const loop = new SolveLoop();
  const initialCount = loop.gates.length;

  loop.addGate('custom', () => ({ passed: true, confidence: 1.0 }));

  assertEqual(loop.gates.length, initialCount + 1);
});

// ───────────────────────────────────────────────────────────────────
// 3. THREE-I ATLAS TESTS
// ───────────────────────────────────────────────────────────────────

console.log('\n═══ 3. THREE-I ATLAS TESTS ═══\n');

test('CognitiveNode: creation and properties', () => {
  const node = new CognitiveNode('test1', {
    type: 'problem',
    insight: 0.7,
    intelligence: 0.5,
    imagination: 0.3
  });

  assertEqual(node.id, 'test1');
  assertEqual(node.type, 'problem');
  assertEqual(node.position.insight, 0.7);
});

test('CognitiveNode: visit tracking', () => {
  const node = new CognitiveNode('test1');

  node.visit(true);
  node.visit(true);
  node.visit(false);

  assertEqual(node.visits, 3);
  assertEqual(node.successes, 2);
  assertEqual(node.failures, 1);
  assert(Math.abs(node.getSuccessRate() - 0.667) < 0.01);
});

test('CognitiveNode: distance calculation', () => {
  const node1 = new CognitiveNode('n1', { insight: 0, intelligence: 0, imagination: 0 });
  const node2 = new CognitiveNode('n2', { insight: 1, intelligence: 0, imagination: 0 });

  assertEqual(node1.distanceTo(node2), 1.0);
});

test('CognitiveEdge: traverse tracking', () => {
  const edge = new CognitiveEdge('a', 'b', { strategy: 'pattern_match' });

  edge.traverse(true, 100);
  edge.traverse(true, 150);
  edge.traverse(false, 200);

  assertEqual(edge.traversals, 3);
  assertEqual(edge.successes, 2);
  assertEqual(edge.getAverageTime(), 150);
});

test('CognitiveEdge: identify shortcuts and dead-ends', () => {
  const shortcut = new CognitiveEdge('a', 'b');
  shortcut.weight = 0.9;
  shortcut.confidence = 0.8;
  assert(shortcut.isShortcut(), 'High weight should be shortcut');

  const deadEnd = new CognitiveEdge('c', 'd');
  deadEnd.weight = 0.1;
  deadEnd.confidence = 0.8;
  assert(deadEnd.isDeadEnd(), 'Low weight + high confidence should be dead end');
});

test('ThreeIAtlas: add nodes and edges', () => {
  const atlas = new ThreeIAtlas();

  atlas.addNode('problem1', { type: 'problem' });
  atlas.addNode('solution1', { type: 'solution' });
  atlas.addEdge('problem1', 'solution1', { strategy: 'direct_solve' });

  assertEqual(atlas.nodes.size, 2);
  assertEqual(atlas.edges.size, 1);
});

test('ThreeIAtlas: find nearest nodes', () => {
  const atlas = new ThreeIAtlas();

  atlas.addNode('n1', { insight: 0.1, intelligence: 0.1, imagination: 0.1 });
  atlas.addNode('n2', { insight: 0.5, intelligence: 0.5, imagination: 0.5 });
  atlas.addNode('n3', { insight: 0.9, intelligence: 0.9, imagination: 0.9 });

  const nearest = atlas.findNearestNodes({ insight: 0.5, intelligence: 0.5, imagination: 0.5 }, 2);

  assertEqual(nearest.length, 2);
  assertEqual(nearest[0].node.id, 'n2'); // Exact match should be first
});

test('ThreeIAtlas: move and trajectory', () => {
  const atlas = new ThreeIAtlas();

  atlas.moveTo({ insight: 0.3, intelligence: 0.4, imagination: 0.5 });
  atlas.moveTo({ insight: 0.6, intelligence: 0.7, imagination: 0.8 });

  assertEqual(atlas.trajectory.length, 2);
  assertEqual(atlas.currentPosition.insight, 0.6);
});

test('ThreeIAtlas: record solution path', () => {
  const atlas = new ThreeIAtlas();

  atlas.recordSolution({
    problemId: 'test_problem',
    success: true,
    strategy: 'pattern_match',
    steps: [
      { nodeId: 'step1', action: 'analyze', result: 'success' },
      { nodeId: 'step2', action: 'transform', result: 'success' }
    ],
    totalTime: 1000,
    position: { insight: 0.7, intelligence: 0.5, imagination: 0.3 }
  });

  assert(atlas.nodes.has('test_problem'), 'Should create problem node');
  assert(atlas.nodes.has('test_problem_solution'), 'Should create solution node');
  assert(atlas.edges.size >= 3, 'Should create edges for path');
});

test('ThreeIAtlas: recommend strategy', () => {
  const atlas = new ThreeIAtlas();

  // Add some history
  atlas.recordSolution({
    problemId: 'p1',
    success: true,
    strategy: 'pattern_match',
    steps: [],
    totalTime: 100,
    position: { insight: 0.5, intelligence: 0.5, imagination: 0.5 }
  });

  const recommendations = atlas.recommendStrategy({ inputSize: [3, 3] });
  assert(recommendations.length > 0, 'Should return recommendations');
});

test('ThreeIAtlas: get statistics', () => {
  const atlas = new ThreeIAtlas();

  atlas.addNode('n1', { type: 'problem' });
  atlas.addNode('n2', { type: 'solution' });
  atlas.addEdge('n1', 'n2');

  const stats = atlas.getStats();
  assertEqual(stats.nodes, 2);
  assertEqual(stats.edges, 1);
});

// Benchmark atlas operations
const atlas = new ThreeIAtlas();
for (let i = 0; i < 100; i++) {
  atlas.addNode(`n${i}`, {
    insight: Math.random(),
    intelligence: Math.random(),
    imagination: Math.random()
  });
}
const atlasBench = benchmark('Atlas: find nearest nodes', () => {
  atlas.findNearestNodes({ insight: 0.5, intelligence: 0.5, imagination: 0.5 }, 5);
}, 1000);
console.log(`  Benchmark: ${atlasBench.avg.toFixed(3)}ms avg, ${atlasBench.p99.toFixed(3)}ms p99`);

// ───────────────────────────────────────────────────────────────────
// 4. STATE MACHINE TESTS
// ───────────────────────────────────────────────────────────────────

console.log('\n═══ 4. STATE MACHINE TESTS ═══\n');

test('VFlowConfig: default values', () => {
  const config = new VFlowConfig();

  assertEqual(config.maxRetries, 10);
  assertEqual(config.verificationStrictness, 0.9);
  assert(config.strategyWeights.direct_solve > 0);
});

test('VFlowConfig: custom values', () => {
  const config = new VFlowConfig({
    maxRetries: 50,
    verificationStrictness: 0.99
  });

  assertEqual(config.maxRetries, 50);
  assertEqual(config.verificationStrictness, 0.99);
});

test('VFlowStateMachine: initial state is IDLE', () => {
  const sm = new VFlowStateMachine();
  assertEqual(sm.currentState, STATES.IDLE);
});

test('VFlowStateMachine: valid transitions', () => {
  const sm = new VFlowStateMachine();

  assert(sm.canTransition('START'), 'Should allow START from IDLE');
  assert(!sm.canTransition('VERIFIED'), 'Should not allow VERIFIED from IDLE');
});

test('VFlowStateMachine: transition changes state', () => {
  const sm = new VFlowStateMachine();

  sm.transition('START', {});
  assertEqual(sm.currentState, STATES.UNDERSTAND);
});

test('VFlowStateMachine: pause and resume', () => {
  const sm = new VFlowStateMachine();

  sm.transition('START', {});
  sm.pause();
  assertEqual(sm.currentState, STATES.PAUSED);

  sm.resume();
  assertEqual(sm.currentState, STATES.UNDERSTAND);
});

test('VFlowStateMachine: reset clears state', () => {
  const sm = new VFlowStateMachine();

  sm.transition('START', {});
  sm.reset();

  assertEqual(sm.currentState, STATES.IDLE);
  assertEqual(sm.retryCount, 0);
});

test('VFlowStateMachine: telemetry records events', () => {
  const sm = new VFlowStateMachine();

  sm.transition('START', {});
  sm.transition('UNDERSTOOD', { understanding: {} });

  const metrics = sm.telemetry.getMetrics();
  assert(metrics.stateTransitions >= 2, 'Should record state transitions');
});

test('VFlowStateMachine: position updates', () => {
  const sm = new VFlowStateMachine();

  sm.updatePosition({ insight: 0.1, intelligence: 0.2 });

  assertEqual(sm.position.insight, 0.6); // 0.5 + 0.1
  assertEqual(sm.position.intelligence, 0.7); // 0.5 + 0.2
});

// ───────────────────────────────────────────────────────────────────
// 5. INTEGRATION TESTS
// ───────────────────────────────────────────────────────────────────

console.log('\n═══ 5. INTEGRATION TESTS ═══\n');

test('VFlowSystem: creates with all components', () => {
  const system = createVFlowSystem(PRESETS.fast);

  assert(system.cockpit, 'Should have cockpit');
  assert(system.solveLoop, 'Should have solve loop');
  assert(system.atlas, 'Should have atlas');
  assert(system.stateMachine, 'Should have state machine');
});

test('VFlowSystem: voice command integration', () => {
  const system = createVFlowSystem();

  const result = system.voice('status');
  assert(result.success, 'Voice command should work');
});

test('VFlowSystem: get HUD state', () => {
  const system = createVFlowSystem();

  const hud = system.getHUD();
  assert(hud.problem, 'HUD should have problem state');
  assert(hud.position, 'HUD should have position');
  assert(hud.feeds, 'HUD should have feeds');
});

test('VFlowSystem: get atlas visualization', () => {
  const system = createVFlowSystem();

  const viz = system.getAtlasVisualization();
  assert(Array.isArray(viz.nodes), 'Should have nodes array');
  assert(Array.isArray(viz.edges), 'Should have edges array');
  assert(viz.currentPosition, 'Should have current position');
});

test('VFlowSystem: configure updates settings', () => {
  const system = createVFlowSystem();

  const config = system.configure({
    verificationStrictness: 0.99,
    maxRetries: 50
  });

  assertEqual(config.verificationStrictness, 0.99);
  assertEqual(config.maxRetries, 50);
});

test('VFlowSystem: presets apply correctly', () => {
  const strict = createVFlowSystem(PRESETS.strict);
  assertEqual(strict.stateMachine.config.verificationStrictness, 0.99);

  const fast = createVFlowSystem(PRESETS.fast);
  assertEqual(fast.stateMachine.config.verificationStrictness, 0.8);
});

// ───────────────────────────────────────────────────────────────────
// 6. ARC INTEGRATION TEST
// ───────────────────────────────────────────────────────────────────

console.log('\n═══ 6. ARC INTEGRATION TEST ═══\n');

asyncTest('Solve simple ARC-like problem', async () => {
  // Create a simple transformation problem
  const problem = {
    id: 'test_transform',
    input: [[1, 0], [0, 1]],
    output: [[0, 1], [1, 0]], // Flip colors
    train: [
      { input: [[1, 0], [0, 1]], output: [[0, 1], [1, 0]] }
    ]
  };

  // Create system with custom solver that knows the transformation
  const system = createVFlowSystem({
    ...PRESETS.fast,
    solver: async (p) => {
      // Flip 0s and 1s
      return p.input.map(row => row.map(cell => cell === 0 ? 1 : 0));
    }
  });

  const result = await system.solve(problem);

  assert(result.verified, 'Solution should be verified');
  assertEqual(result.solution[0][0], 0);
  assertEqual(result.solution[0][1], 1);
});

asyncTest('Handle verification failure and retry', async () => {
  let attempts = 0;

  const problem = {
    id: 'test_retry',
    input: [[1, 2], [3, 4]],
    output: [[4, 3], [2, 1]], // Reverse
    train: []
  };

  const system = createVFlowSystem({
    ...PRESETS.fast,
    config: { maxRetries: 5 },
    solver: async (p) => {
      attempts++;
      // Fail first 2 attempts, succeed on 3rd
      if (attempts < 3) {
        return p.input; // Wrong answer
      }
      // Correct answer
      return [[4, 3], [2, 1]];
    }
  });

  const result = await system.solve(problem);

  assert(result.verified, 'Should eventually verify');
  assert(result.retries >= 2, 'Should have retried');
});

// ───────────────────────────────────────────────────────────────────
// FINAL RESULTS
// ───────────────────────────────────────────────────────────────────

const totalTime = Date.now() - results.startTime;

console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                    TEST RESULTS SUMMARY                           ║
╠═══════════════════════════════════════════════════════════════════╣
║  Total Tests:  ${String(results.passed + results.failed).padEnd(4)} │ Passed: ${String(results.passed).padEnd(4)} │ Failed: ${String(results.failed).padEnd(4)}    ║
║  Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%                                           ║
║  Total Time:   ${totalTime}ms                                           ║
╠═══════════════════════════════════════════════════════════════════╣
║                    BENCHMARK RESULTS                              ║
╠═══════════════════════════════════════════════════════════════════╣`);

for (const [name, stats] of Object.entries(results.benchmarks)) {
  console.log(`║  ${name.padEnd(30)} │ ${stats.avg.toFixed(3)}ms avg │ ${stats.p99.toFixed(3)}ms p99 ║`);
}

console.log(`╚═══════════════════════════════════════════════════════════════════╝
`);

// Save results to file
const outputPath = './results/vflow_test_results.json';
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
console.log(`Results saved to ${outputPath}`);

// Exit with appropriate code
process.exit(results.failed > 0 ? 1 : 0);

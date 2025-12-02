#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RELATIONSHIP INTELLIGENCE SYSTEM - BENCHMARK
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const { RelationshipIntelligenceSystem, TrustEvent, FeedbackType } = require('./index');

async function benchmark() {
  console.log(`
  ╔══════════════════════════════════════════════════════════════════════╗
  ║           RELATIONSHIP INTELLIGENCE SYSTEM                           ║
  ║                       BENCHMARK                                      ║
  ╚══════════════════════════════════════════════════════════════════════╝
  `);

  const ris = new RelationshipIntelligenceSystem({ storage: 'memory' });
  const iterations = 100;
  const results = {};

  function bench(name, fn) {
    const start = process.hrtime.bigint();
    for (let i = 0; i < iterations; i++) {
      fn(i);
    }
    const end = process.hrtime.bigint();
    const totalMs = Number(end - start) / 1_000_000;
    const avgMs = totalMs / iterations;
    results[name] = { total: totalMs.toFixed(2), avg: avgMs.toFixed(3), ops: Math.floor(1000 / avgMs) };
    console.log(`  ${name.padEnd(35)} ${avgMs.toFixed(3).padStart(8)} ms/op  (${Math.floor(1000/avgMs).toString().padStart(6)} ops/sec)`);
  }

  async function benchAsync(name, fn) {
    const start = process.hrtime.bigint();
    for (let i = 0; i < iterations; i++) {
      await fn(i);
    }
    const end = process.hrtime.bigint();
    const totalMs = Number(end - start) / 1_000_000;
    const avgMs = totalMs / iterations;
    results[name] = { total: totalMs.toFixed(2), avg: avgMs.toFixed(3), ops: Math.floor(1000 / avgMs) };
    console.log(`  ${name.padEnd(35)} ${avgMs.toFixed(3).padStart(8)} ms/op  (${Math.floor(1000/avgMs).toString().padStart(6)} ops/sec)`);
  }

  // Warm up
  await ris.startSession('warmup', 'SOLO');

  console.log('  ── SCHEMA OPERATIONS ──────────────────────────────────────────────\n');

  await benchAsync('getSchema (new user)', async (i) => {
    await ris.getSchema(`bench_user_${i}`);
  });

  await benchAsync('getSchema (existing)', async () => {
    await ris.getSchema('bench_user_0');
  });

  await benchAsync('updatePreference', async (i) => {
    await ris.updatePreference('bench_user_0', 'identity.preferred_name', `User${i}`);
  });

  await benchAsync('addTerm', async (i) => {
    await ris.addTerm('bench_user_0', `term_${i}`, `Definition ${i}`);
  });

  await benchAsync('setGoal', async (i) => {
    await ris.setGoal('bench_user_0', 'session_level', `Goal ${i}`);
  });

  console.log('\n  ── SESSION OPERATIONS ─────────────────────────────────────────────\n');

  await benchAsync('startSession', async (i) => {
    await ris.startSession(`session_user_${i}`, 'SOLO');
  });

  const testSession = await ris.startSession('msg_test_user', 'SOLO');

  await benchAsync('processMessage (short)', async () => {
    await ris.processMessage(testSession.session_id, 'Hello, how are you?');
  });

  await benchAsync('processMessage (with signals)', async () => {
    await ris.processMessage(testSession.session_id, 'I prefer concise responses. This is frustrating! Thanks for the help.');
  });

  await benchAsync('processMessage (long)', async () => {
    await ris.processMessage(testSession.session_id,
      'I am working on a complex project that involves building an AI system. ' +
      'The goal is to create something that can learn and adapt over time. ' +
      'I need help with the architecture and implementation details. ' +
      'Can you explain how transformers work and why they are effective?'
    );
  });

  console.log('\n  ── CONTEXT OPERATIONS ─────────────────────────────────────────────\n');

  await benchAsync('getContext', async () => {
    await ris.getContext('bench_user_0', { avatar: 'SOLO' });
  });

  await benchAsync('getApproach', async () => {
    await ris.getApproach('bench_user_0', { avatar: 'SOLO' });
  });

  await benchAsync('recall (topic)', async () => {
    await ris.recall('bench_user_0', 'AI');
  });

  console.log('\n  ── SIGNAL CAPTURE ─────────────────────────────────────────────────\n');

  bench('capture.capture (simple)', () => {
    ris.capture.capture('Hello world');
  });

  bench('capture.capture (with signals)', () => {
    ris.capture.capture('I prefer this. Thanks! That is frustrating.');
  });

  bench('capture.capture (complex)', () => {
    ris.capture.capture(
      "I'm trying to understand how this works. I prefer detailed explanations. " +
      "This is exactly what I needed! But wait, why doesn't this other part work??"
    );
  });

  console.log('\n  ── PATTERN PROCESSING ─────────────────────────────────────────────\n');

  // Generate signals for processing
  const testSignals = [];
  for (let i = 0; i < 50; i++) {
    testSignals.push(...ris.capture.capture(`Test message ${i} with preference and thanks!`));
  }

  const testSchema = await ris.getSchema('pattern_test');

  bench('process.process (50 signals)', () => {
    ris.process.process(testSignals, testSchema);
  });

  console.log('\n  ── HANDOFF OPERATIONS ─────────────────────────────────────────────\n');

  await benchAsync('handoff', async () => {
    await ris.handoff('bench_user_0', 'SOLO', 'SAGE');
  });

  await benchAsync('routeToAvatar', async () => {
    await ris.routeToAvatar('bench_user_0', 'debugging code');
  });

  console.log('\n  ── TRUST OPERATIONS ───────────────────────────────────────────────\n');

  await benchAsync('getTrustLevel', async () => {
    await ris.getTrustLevel('bench_user_0', 'SOLO');
  });

  await benchAsync('recordTrustEvent', async () => {
    await ris.recordTrustEvent('bench_user_0', 'SOLO', TrustEvent.HELPFUL_RESPONSE);
  });

  console.log('\n  ── DATA OPERATIONS ────────────────────────────────────────────────\n');

  await benchAsync('exportUserData', async () => {
    await ris.exportUserData('bench_user_0');
  });

  await benchAsync('getStats', async () => {
    await ris.getStats();
  });

  // Calculate summary
  const allOps = Object.values(results).map(r => r.ops);
  const avgOps = Math.floor(allOps.reduce((a, b) => a + b, 0) / allOps.length);
  const minOps = Math.min(...allOps);
  const maxOps = Math.max(...allOps);

  console.log(`
  ╔══════════════════════════════════════════════════════════════════════╗
  ║                       BENCHMARK SUMMARY                               ║
  ╠══════════════════════════════════════════════════════════════════════╣
  ║                                                                       ║
  ║   Operations tested:    ${Object.keys(results).length.toString().padStart(4)}                                          ║
  ║   Iterations per test:  ${iterations.toString().padStart(4)}                                          ║
  ║                                                                       ║
  ║   Avg ops/sec:          ${avgOps.toString().padStart(6)}                                        ║
  ║   Min ops/sec:          ${minOps.toString().padStart(6)}                                        ║
  ║   Max ops/sec:          ${maxOps.toString().padStart(6)}                                        ║
  ║                                                                       ║
  ╠══════════════════════════════════════════════════════════════════════╣
  ║                                                                       ║
  ║   ${avgOps > 1000 ? '🚀 BLAZING FAST' : avgOps > 100 ? '⚡ PERFORMANT' : '🐢 NEEDS OPTIMIZATION'}                                                ║
  ║                                                                       ║
  ╚══════════════════════════════════════════════════════════════════════╝
  `);
}

benchmark().catch(console.error);

/**
 * Agent Army Benchmark Suite
 * Performance testing and optimization analysis
 */

const { performance } = require('perf_hooks');

// Agents
const ORBBrain = require('../agents/0rb_brain');
const Sentinel = require('../agents/sentinel');
const Apollo = require('../agents/apollo');
const Mercury = require('../agents/mercury');
const Athena = require('../agents/athena');
const Ares = require('../agents/ares');
const Hermes = require('../agents/hermes');
const Hephaestus = require('../agents/hephaestus');
const Artemis = require('../agents/artemis');
const RevenueTracker = require('../agents/dashboard/revenue_tracker');
const AgentMetrics = require('../agents/dashboard/agent_metrics');

class Benchmark {
    constructor() {
        this.results = [];
        this.iterations = 1000;
        this.warmupIterations = 100;
    }

    async run(name, fn, iterations = this.iterations) {
        // Warmup
        for (let i = 0; i < this.warmupIterations; i++) {
            await fn();
        }

        // Force GC if available
        if (global.gc) global.gc();

        const times = [];
        const memStart = process.memoryUsage();

        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            await fn();
            times.push(performance.now() - start);
        }

        const memEnd = process.memoryUsage();

        const sorted = times.sort((a, b) => a - b);
        const result = {
            name,
            iterations,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            mean: times.reduce((a, b) => a + b, 0) / times.length,
            median: sorted[Math.floor(sorted.length / 2)],
            p95: sorted[Math.floor(sorted.length * 0.95)],
            p99: sorted[Math.floor(sorted.length * 0.99)],
            stdDev: this.stdDev(times),
            opsPerSec: Math.round(1000 / (times.reduce((a, b) => a + b, 0) / times.length)),
            memDelta: {
                heapUsed: (memEnd.heapUsed - memStart.heapUsed) / 1024 / 1024,
                external: (memEnd.external - memStart.external) / 1024 / 1024
            }
        };

        this.results.push(result);
        return result;
    }

    stdDev(arr) {
        const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
        return Math.sqrt(arr.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / arr.length);
    }

    formatResult(r) {
        return `${r.name.padEnd(35)} | ${r.mean.toFixed(3).padStart(8)}ms | ${r.p95.toFixed(3).padStart(8)}ms | ${r.opsPerSec.toString().padStart(8)}/s | ±${r.stdDev.toFixed(3)}ms`;
    }

    printResults() {
        console.log('\n' + '═'.repeat(85));
        console.log(' BENCHMARK RESULTS');
        console.log('═'.repeat(85));
        console.log('Test'.padEnd(35) + ' |     Mean |      P95 |    Ops/s | StdDev');
        console.log('─'.repeat(85));

        for (const r of this.results) {
            console.log(this.formatResult(r));
        }

        console.log('═'.repeat(85));
    }

    getSummary() {
        const totalOps = this.results.reduce((sum, r) => sum + r.opsPerSec, 0);
        const avgLatency = this.results.reduce((sum, r) => sum + r.mean, 0) / this.results.length;

        return {
            totalBenchmarks: this.results.length,
            totalOpsPerSec: totalOps,
            avgLatencyMs: avgLatency,
            results: this.results
        };
    }
}

async function runBenchmarks() {
    const bench = new Benchmark();

    console.log('\n🚀 AGENT ARMY BENCHMARK SUITE');
    console.log('━'.repeat(50));
    console.log(`Iterations: ${bench.iterations} | Warmup: ${bench.warmupIterations}`);
    console.log('━'.repeat(50));

    // ═══════════════════════════════════════════════════════════════
    // ORBBRAIN BENCHMARKS
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📊 ORBBrain Benchmarks...');

    await bench.run('ORBBrain: instantiation', () => {
        new ORBBrain();
    });

    const brain = new ORBBrain();
    await bench.run('ORBBrain: addTask', () => {
        brain.addTask({ agent: 'sentinel', type: 'scan', data: {} });
    });
    brain.taskQueue = []; // Reset

    await bench.run('ORBBrain: getStatus', () => {
        brain.getStatus();
    });

    // ═══════════════════════════════════════════════════════════════
    // SENTINEL BENCHMARKS
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📊 Sentinel Benchmarks...');

    await bench.run('Sentinel: instantiation', () => {
        new Sentinel();
    });

    const sentinel = new Sentinel();
    await bench.run('Sentinel: getStats', () => {
        sentinel.getStats();
    });

    await bench.run('Sentinel: getFindings', () => {
        sentinel.getFindings();
    });

    // ═══════════════════════════════════════════════════════════════
    // APOLLO BENCHMARKS
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📊 Apollo Benchmarks...');

    await bench.run('Apollo: instantiation', () => {
        new Apollo();
    });

    const apollo = new Apollo();
    await bench.run('Apollo: execute(freelance_search)', async () => {
        await apollo.execute({ type: 'freelance_search', keywords: ['js'] });
    }, 500);

    // ═══════════════════════════════════════════════════════════════
    // ATHENA BENCHMARKS
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📊 Athena Benchmarks...');

    await bench.run('Athena: instantiation', () => {
        new Athena();
    });

    const athena = new Athena();
    await bench.run('Athena: execute(blog_post)', async () => {
        await athena.execute({ type: 'content', contentType: 'blog_post', topic: 'Test' });
    }, 500);

    await bench.run('Athena: execute(social_post)', async () => {
        await athena.execute({ type: 'content', contentType: 'social_post', topic: 'Test' });
    }, 500);

    // ═══════════════════════════════════════════════════════════════
    // HERMES BENCHMARKS
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📊 Hermes Benchmarks...');

    await bench.run('Hermes: instantiation', () => {
        new Hermes();
    });

    const hermes = new Hermes();
    await bench.run('Hermes: getStats', () => {
        hermes.getStats();
    });

    await bench.run('Hermes: getActiveConversations', () => {
        hermes.getActiveConversations();
    });

    // ═══════════════════════════════════════════════════════════════
    // HEPHAESTUS BENCHMARKS
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📊 Hephaestus Benchmarks...');

    await bench.run('Hephaestus: instantiation', () => {
        new Hephaestus();
    });

    const hephaestus = new Hephaestus();
    await bench.run('Hephaestus: scaffold(node-api)', async () => {
        await hephaestus.execute({ type: 'scaffold', templateName: 'node-api', projectName: 'test' });
    }, 500);

    await bench.run('Hephaestus: getTemplates', () => {
        hephaestus.getTemplates();
    });

    // ═══════════════════════════════════════════════════════════════
    // ARTEMIS BENCHMARKS
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📊 Artemis Benchmarks...');

    await bench.run('Artemis: instantiation', () => {
        new Artemis();
    });

    const artemis = new Artemis();
    await bench.run('Artemis: validate(bug_bounty)', async () => {
        await artemis.execute({
            type: 'validate',
            ruleSet: 'bug_bounty',
            context: { authorized: true, targetInScope: true },
            evidence: {}
        });
    }, 500);

    await bench.run('Artemis: generate_contract', async () => {
        await artemis.execute({
            type: 'generate_contract',
            templateName: 'freelance_basic',
            variables: { clientName: 'Test', contractorName: 'Dev', date: '2024-01-01' }
        });
    }, 500);

    // ═══════════════════════════════════════════════════════════════
    // REVENUE TRACKER BENCHMARKS
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📊 RevenueTracker Benchmarks...');

    await bench.run('RevenueTracker: instantiation', () => {
        new RevenueTracker();
    });

    const tracker = new RevenueTracker();
    await bench.run('RevenueTracker: recordTransaction', () => {
        tracker.recordTransaction('bug_bounty', 100, { description: 'test' });
    });

    // Add some data for summary tests
    for (let i = 0; i < 100; i++) {
        tracker.recordTransaction('bug_bounty', Math.random() * 1000);
        tracker.recordTransaction('freelance', Math.random() * 500);
    }

    await bench.run('RevenueTracker: getSummary(month)', () => {
        tracker.getSummary('month');
    });

    await bench.run('RevenueTracker: getGoalProgress', () => {
        tracker.getGoalProgress();
    });

    await bench.run('RevenueTracker: getDailyBreakdown(30)', () => {
        tracker.getDailyBreakdown(30);
    });

    // ═══════════════════════════════════════════════════════════════
    // AGENT METRICS BENCHMARKS
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📊 AgentMetrics Benchmarks...');

    await bench.run('AgentMetrics: instantiation', () => {
        new AgentMetrics();
    });

    const metrics = new AgentMetrics();
    await bench.run('AgentMetrics: recordTaskCompletion', () => {
        metrics.recordTaskCompletion('sentinel', { duration: 1000, revenue: 100 });
    });

    await bench.run('AgentMetrics: getAllAgentsSummary', () => {
        metrics.getAllAgentsSummary();
    });

    await bench.run('AgentMetrics: getROIAnalysis', () => {
        metrics.getROIAnalysis();
    });

    await bench.run('AgentMetrics: getDashboard', () => {
        metrics.getDashboard();
    });

    // ═══════════════════════════════════════════════════════════════
    // PRINT RESULTS
    // ═══════════════════════════════════════════════════════════════
    bench.printResults();

    // Memory usage
    const mem = process.memoryUsage();
    console.log('\n📈 MEMORY USAGE');
    console.log('─'.repeat(40));
    console.log(`Heap Used:  ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Heap Total: ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`External:   ${(mem.external / 1024 / 1024).toFixed(2)} MB`);
    console.log(`RSS:        ${(mem.rss / 1024 / 1024).toFixed(2)} MB`);

    return bench.getSummary();
}

// Run if executed directly
if (require.main === module) {
    runBenchmarks()
        .then(summary => {
            console.log('\n✅ Benchmark complete!');
            console.log(`Total ops/sec capacity: ${summary.totalOpsPerSec.toLocaleString()}`);
            process.exit(0);
        })
        .catch(err => {
            console.error('Benchmark failed:', err);
            process.exit(1);
        });
}

module.exports = { Benchmark, runBenchmarks };

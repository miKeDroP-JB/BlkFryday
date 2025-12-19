// ============================================================
//  FRACTAL REALITY FORGE - Self-Improving Training Loop Engine
// ============================================================
//
//  "Every fragment contains the whole in miniature"
//
//  Architecture:
//  1. Input Stage (Fractal Seeds) - micro-modules, patterns
//  2. Micro-Processing Nodes - fractal self-similar behavior
//  3. Holo-Memory Layer - distributed overlapping storage
//  4. Recursive Loop Engine - exponential compounding
//  5. Reality Forge Output - emergent solutions
//  6. Monitoring Layer - AGI adjacency scoring
//  7. Parallel Streams - micro/macro cross-pollination
//
// ============================================================

const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============================================================
//  FRACTAL CONSTANTS (Tesla 369 + Golden Ratio)
// ============================================================

const PHI = 1.618033988749895;
const FRACTAL_DEPTH = 9;  // Tesla's 9
const MICRO_NODES = 36;   // 3+6 * 6
const MACRO_CYCLES = 369;

// ============================================================
//  MICRO-PATTERN EXTRACTOR
// ============================================================

class MicroPatternExtractor {
  constructor() {
    this.patterns = new Map();
    this.glyphs = new Map();
    this.atomicUnits = [];
  }

  // Extract micro-patterns from code
  extractFromCode(code, filename = 'unknown') {
    const patterns = [];

    // Function patterns
    const funcRegex = /(?:function|async function|const|let|var)\s+(\w+)\s*(?:=\s*)?(?:async\s*)?\([^)]*\)/g;
    let match;
    while ((match = funcRegex.exec(code)) !== null) {
      patterns.push({
        type: 'function',
        name: match[1],
        signature: match[0].slice(0, 100),
        file: filename,
        weight: 1.0
      });
    }

    // Class patterns
    const classRegex = /class\s+(\w+)(?:\s+extends\s+(\w+))?/g;
    while ((match = classRegex.exec(code)) !== null) {
      patterns.push({
        type: 'class',
        name: match[1],
        extends: match[2] || null,
        file: filename,
        weight: 1.5
      });
    }

    // Import/dependency patterns
    const importRegex = /(?:require|import)\s*\(?['"]([^'"]+)['"]\)?/g;
    while ((match = importRegex.exec(code)) !== null) {
      patterns.push({
        type: 'dependency',
        module: match[1],
        file: filename,
        weight: 0.5
      });
    }

    // Logic patterns (if/else/switch structures)
    const logicPatterns = (code.match(/if\s*\([^)]+\)/g) || []).length;
    const loopPatterns = (code.match(/(?:for|while|do)\s*\(/g) || []).length;

    patterns.push({
      type: 'complexity',
      conditionals: logicPatterns,
      loops: loopPatterns,
      file: filename,
      weight: Math.log(logicPatterns + loopPatterns + 1)
    });

    // Compress to glyphs
    const glyph = this.compressToGlyph(patterns);
    this.glyphs.set(filename, glyph);

    return patterns;
  }

  // Compress patterns to minimal glyph representation
  compressToGlyph(patterns) {
    const typeMap = {
      'function': 'ƒ',
      'class': '©',
      'dependency': '↓',
      'complexity': '⊛'
    };

    return patterns.map(p => {
      const symbol = typeMap[p.type] || '•';
      const name = p.name || p.module || '';
      return `${symbol}${name.slice(0, 8)}`;
    }).join('');
  }

  // Extract atomic units (smallest meaningful pieces)
  extractAtomicUnits(code) {
    const atoms = [];

    // Extract variable assignments
    const assignments = code.match(/(?:const|let|var)\s+\w+\s*=/g) || [];
    assignments.forEach(a => atoms.push({ type: 'assignment', pattern: a }));

    // Extract method calls
    const calls = code.match(/\.\w+\([^)]*\)/g) || [];
    calls.forEach(c => atoms.push({ type: 'call', pattern: c.slice(0, 50) }));

    // Extract operators
    const ops = code.match(/[+\-*/%]=|[<>=!]=?=?|&&|\|\|/g) || [];
    const opCounts = {};
    ops.forEach(o => opCounts[o] = (opCounts[o] || 0) + 1);
    atoms.push({ type: 'operators', distribution: opCounts });

    this.atomicUnits.push(...atoms);
    return atoms;
  }
}

// ============================================================
//  HOLO-MEMORY LAYER
// ============================================================

class HoloMemoryLayer {
  constructor(config = {}) {
    this.dimensions = config.dimensions || 369;
    this.memory = new Map();
    this.crossLinks = new Map();
    this.globalPatterns = [];
    this.entanglement = new Map();
  }

  // Store with distributed overlap
  store(key, value, metadata = {}) {
    const hash = this.hashKey(key);
    const positions = this.calculatePositions(hash);

    // Store at multiple positions (holographic distribution)
    for (const pos of positions) {
      if (!this.memory.has(pos)) {
        this.memory.set(pos, []);
      }
      this.memory.get(pos).push({
        key,
        value,
        metadata,
        timestamp: Date.now()
      });
    }

    // Create cross-links for entanglement
    this.createEntanglement(key, positions);

    return positions;
  }

  // Retrieve with holographic reconstruction
  retrieve(key) {
    const hash = this.hashKey(key);
    const positions = this.calculatePositions(hash);

    const fragments = [];
    for (const pos of positions) {
      const stored = this.memory.get(pos) || [];
      const match = stored.find(s => s.key === key);
      if (match) fragments.push(match);
    }

    // Reconstruct from fragments (any one fragment contains the whole)
    return fragments.length > 0 ? fragments[0].value : null;
  }

  // Fuzzy search across holographic memory
  search(query, limit = 10) {
    const results = [];
    const queryLower = (query || '').toLowerCase();

    for (const [pos, items] of this.memory) {
      for (const item of items) {
        if (!item || !item.key) continue;
        const keyMatch = (item.key || '').toLowerCase().includes(queryLower);
        const valueStr = JSON.stringify(item.value || {}).toLowerCase();
        const valueMatch = valueStr.includes(queryLower);
        if (keyMatch || valueMatch) {
          results.push({
            ...item,
            score: keyMatch ? 1.0 : 0.5
          });
        }
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Calculate distributed storage positions
  calculatePositions(hash) {
    const positions = [];
    const base = parseInt(hash.slice(0, 8), 16) % this.dimensions;

    // Fractal positions using golden ratio
    for (let i = 0; i < 3; i++) {
      positions.push(Math.floor((base + i * PHI * 100) % this.dimensions));
    }

    return positions;
  }

  // Create entanglement between stored items
  createEntanglement(key, positions) {
    for (const pos of positions) {
      const items = this.memory.get(pos) || [];
      for (const item of items) {
        if (item.key !== key) {
          if (!this.entanglement.has(key)) {
            this.entanglement.set(key, new Set());
          }
          this.entanglement.get(key).add(item.key);
        }
      }
    }
  }

  // Get entangled items (related patterns)
  getEntangled(key) {
    return Array.from(this.entanglement.get(key) || []);
  }

  // Global pattern propagation
  propagatePattern(pattern) {
    this.globalPatterns.push(pattern);

    // Update all entangled items
    for (const [pos, items] of this.memory) {
      for (const item of items) {
        if (item.metadata.patternMatch?.(pattern)) {
          item.metadata.reinforced = (item.metadata.reinforced || 0) + 1;
        }
      }
    }
  }

  hashKey(key) {
    return crypto.createHash('sha256').update(String(key)).digest('hex');
  }

  // Prune low-value patterns to free memory
  prune(options = {}) {
    const {
      maxItems = 100000,        // Max items to keep
      minReinforced = 0,        // Min reinforcement score to keep
      keepRatio = 0.618         // Golden ratio - keep top 61.8%
    } = options;

    const stats = this.getStats();
    if (stats.totalItems <= maxItems) {
      return { pruned: 0, remaining: stats.totalItems };
    }

    const targetItems = Math.floor(maxItems * keepRatio);
    let pruned = 0;

    // Collect all items with scores
    const allItems = [];
    for (const [pos, items] of this.memory) {
      for (const item of items) {
        const score = (item.metadata?.reinforced || 0) +
                     (item.metadata?.accessCount || 0) * 0.1;
        allItems.push({ pos, item, score });
      }
    }

    // Sort by score (keep highest)
    allItems.sort((a, b) => b.score - a.score);

    // Keep top items
    const keepSet = new Set(allItems.slice(0, targetItems).map(x => x.item.key));

    // Remove low-value items
    for (const [pos, items] of this.memory) {
      const filtered = items.filter(item => keepSet.has(item.key));
      pruned += items.length - filtered.length;
      if (filtered.length > 0) {
        this.memory.set(pos, filtered);
      } else {
        this.memory.delete(pos);
      }
    }

    // Clean up entanglements for pruned items
    for (const key of this.entanglement.keys()) {
      if (!keepSet.has(key)) {
        this.entanglement.delete(key);
      }
    }

    return { pruned, remaining: targetItems };
  }

  // Clear all memory (full reset)
  clear() {
    this.memory.clear();
    this.entanglement.clear();
    this.globalPatterns = [];
    return { cleared: true };
  }

  // Get memory stats
  getStats() {
    let totalItems = 0;
    for (const items of this.memory.values()) {
      totalItems += items.length;
    }

    return {
      positions: this.memory.size,
      totalItems,
      entanglements: this.entanglement.size,
      globalPatterns: this.globalPatterns.length
    };
  }

  // Serialize memory state for persistence
  serialize() {
    const memoryArray = [];
    for (const [pos, items] of this.memory) {
      memoryArray.push({ pos, items });
    }

    const entanglementArray = [];
    for (const [key, set] of this.entanglement) {
      entanglementArray.push({ key, links: Array.from(set) });
    }

    return {
      dimensions: this.dimensions,
      memory: memoryArray,
      entanglement: entanglementArray,
      globalPatterns: this.globalPatterns
    };
  }

  // Deserialize and restore memory state
  deserialize(data) {
    if (!data) return false;

    try {
      this.dimensions = data.dimensions || this.dimensions;

      // Restore memory
      this.memory.clear();
      if (data.memory) {
        for (const { pos, items } of data.memory) {
          this.memory.set(pos, items);
        }
      }

      // Restore entanglement
      this.entanglement.clear();
      if (data.entanglement) {
        for (const { key, links } of data.entanglement) {
          this.entanglement.set(key, new Set(links));
        }
      }

      // Restore global patterns
      this.globalPatterns = data.globalPatterns || [];

      return true;
    } catch (e) {
      console.error('[HoloMemory] Deserialize error:', e.message);
      return false;
    }
  }
}

// ============================================================
//  RECURSIVE LOOP ENGINE
// ============================================================

class RecursiveLoopEngine extends EventEmitter {
  constructor(holoMemory, config = {}) {
    super();
    this.holoMemory = holoMemory;
    this.iteration = 0;
    this.maxIterations = config.maxIterations || MACRO_CYCLES;
    this.convergenceThreshold = config.convergenceThreshold || 0.001;
    this.metrics = {
      improvements: [],
      efficiency: [],
      agiScore: []
    };
    this.running = false;
    this.patterns = [];
  }

  // Start the recursive training loop
  async startLoop(seeds) {
    this.running = true;
    this.emit('loop:start', { seeds: seeds.length });

    // Initial seeding
    for (const seed of seeds) {
      this.holoMemory.store(seed.key || seed.name, seed, {
        iteration: 0,
        type: seed.type
      });
    }

    // Run recursive cycles
    while (this.running && this.iteration < this.maxIterations) {
      await this.runCycle();

      // Check convergence
      if (this.checkConvergence()) {
        this.emit('loop:converged', { iteration: this.iteration });
        break;
      }

      this.iteration++;
    }

    this.running = false;
    this.emit('loop:complete', this.getResults());
    return this.getResults();
  }

  // Single cycle of the recursive loop
  async runCycle() {
    const cycleStart = Date.now();

    // 1. Micro-node processing
    const microResults = this.processMicroNodes();

    // 2. Holo-memory update
    this.updateHoloMemory(microResults);

    // 3. Macro-pattern evaluation
    const macroPatterns = this.evaluateMacroPatterns();

    // 4. Self-check via evaluation
    const evaluation = this.evaluateCycle(microResults, macroPatterns);

    // Record metrics
    this.metrics.improvements.push(evaluation.improvement);
    this.metrics.efficiency.push(evaluation.efficiency);
    this.metrics.agiScore.push(evaluation.agiScore);

    this.emit('cycle:complete', {
      iteration: this.iteration,
      duration: Date.now() - cycleStart,
      evaluation
    });

    return evaluation;
  }

  // Process at micro-node level
  processMicroNodes() {
    const results = [];
    const stats = this.holoMemory.getStats();

    // Process each stored pattern
    for (let i = 0; i < Math.min(MICRO_NODES, stats.totalItems); i++) {
      // Simulate micro-node processing
      const pattern = this.patterns[i % this.patterns.length] || { type: 'seed' };
      const processed = {
        original: pattern,
        refined: this.refinePattern(pattern),
        iteration: this.iteration
      };
      results.push(processed);
    }

    return results;
  }

  // Refine a pattern (the core learning operation)
  refinePattern(pattern) {
    // Apply golden ratio optimization with configurable strength
    const refined = { ...pattern };
    const strength = this.config?.refinementStrength || 0.05; // 5% default (was 0.006%)

    if (refined.weight) {
      // Compound improvement using phi-based scaling
      refined.weight = refined.weight * (1 + strength * PHI);
    } else {
      refined.weight = 1 + strength;
    }

    if (refined.score) {
      // Score improvement with diminishing returns near 1.0
      const headroom = 1 - refined.score;
      refined.score = Math.min(1, refined.score + headroom * strength);
    } else {
      refined.score = 0.5 + strength;
    }

    // Track reinforcement for pruning decisions
    refined.reinforced = (refined.reinforced || 0) + 1;
    refined.refinedAt = this.iteration;
    refined.refinementCount = (refined.refinementCount || 0) + 1;
    refined.cumulativeStrength = (refined.cumulativeStrength || 0) + strength;

    return refined;
  }

  // Update holo-memory with new patterns
  updateHoloMemory(microResults) {
    for (const result of microResults) {
      if (result.refined) {
        this.holoMemory.store(
          `refined_${this.iteration}_${Math.random().toString(36).slice(2, 8)}`,
          result.refined,
          { iteration: this.iteration, sourceIteration: result.original?.refinedAt || 0 }
        );
      }
    }

    // Propagate macro patterns
    if (this.iteration % 9 === 0) {  // Every 9 cycles (Tesla's number)
      this.holoMemory.propagatePattern({
        type: 'macro',
        iteration: this.iteration,
        patternCount: microResults.length
      });
    }
  }

  // Evaluate macro-level patterns
  evaluateMacroPatterns() {
    const patterns = [];
    const stats = this.holoMemory.getStats();

    // Look for emergent structures
    if (stats.entanglements > 10) {
      patterns.push({
        type: 'entanglement_cluster',
        size: stats.entanglements,
        significance: Math.log(stats.entanglements) / Math.log(PHI)
      });
    }

    if (stats.globalPatterns.length > 0) {
      patterns.push({
        type: 'global_reinforcement',
        count: stats.globalPatterns.length
      });
    }

    return patterns;
  }

  // Evaluate cycle performance
  evaluateCycle(microResults, macroPatterns) {
    const prevScore = this.metrics.agiScore[this.metrics.agiScore.length - 1] || 39.6;

    // Calculate improvement from actual refinements
    const refinedCount = microResults.filter(r => r.refined).length;
    const improvement = refinedCount / Math.max(1, microResults.length);

    // Calculate cumulative strength of refinements
    const totalStrength = microResults
      .filter(r => r.refined)
      .reduce((sum, r) => sum + (r.refined.cumulativeStrength || 0), 0);

    // Calculate efficiency (improvements per iteration, weighted by strength)
    const efficiency = macroPatterns.length > 0 ?
      (improvement * macroPatterns.length * (1 + totalStrength)) / Math.max(1, this.iteration) :
      improvement * (1 + totalStrength / 10);

    // Calculate AGI adjacency score with multiple factors
    const baseScore = 39.6; // Our benchmark baseline
    const memoryStats = this.holoMemory.getStats();

    // Factor 1: Iteration progress (logarithmic growth)
    const iterationBonus = Math.log(this.iteration + 1) / Math.log(MACRO_CYCLES) * 5;

    // Factor 2: Pattern count (more patterns = more knowledge)
    const patternBonus = Math.log(memoryStats.totalItems + 1) / Math.log(1000) * 3;

    // Factor 3: Entanglement density (connections = understanding)
    const entanglementBonus = Math.log(memoryStats.entanglements + 1) / Math.log(1000) * 2;

    // Factor 4: Refinement strength accumulation
    const strengthBonus = Math.min(5, totalStrength * 0.1);

    // Factor 5: Macro pattern emergence
    const macroBonus = macroPatterns.length * 0.2;

    // Factor 6: Compounding from previous score
    const compoundBonus = (prevScore - 39.6) * 0.01; // 1% of previous gains

    const agiScore = Math.min(100,
      baseScore +
      iterationBonus +
      patternBonus +
      entanglementBonus +
      strengthBonus +
      macroBonus +
      compoundBonus
    );

    return {
      improvement,
      efficiency,
      agiScore,
      delta: agiScore - prevScore,
      factors: {
        iteration: iterationBonus,
        patterns: patternBonus,
        entanglement: entanglementBonus,
        strength: strengthBonus,
        macro: macroBonus,
        compound: compoundBonus
      }
    };
  }

  // Check if training has converged
  checkConvergence() {
    // Require minimum iterations before checking convergence
    const minIterations = this.config?.minIterationsBeforeConvergence || 36;
    if (this.iteration < minIterations) return false;
    if (this.metrics.improvements.length < 20) return false;

    const recent = this.metrics.improvements.slice(-20);
    const variance = this.calculateVariance(recent);

    // Also check that AGI score isn't still climbing significantly
    const recentScores = this.metrics.agiScore.slice(-10);
    const scoreGrowth = recentScores.length > 1 ?
      (recentScores[recentScores.length - 1] - recentScores[0]) : 1;

    // Only converge if variance is tiny AND score growth has plateaued
    return variance < this.convergenceThreshold && scoreGrowth < 0.1;
  }

  calculateVariance(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  // Stop the loop
  stop() {
    this.running = false;
    this.emit('loop:stopped', { iteration: this.iteration });
  }

  // Get results
  getResults() {
    return {
      iterations: this.iteration,
      finalAGIScore: this.metrics.agiScore[this.metrics.agiScore.length - 1] || 0,
      totalImprovement: this.metrics.improvements.reduce((a, b) => a + b, 0),
      averageEfficiency: this.metrics.efficiency.reduce((a, b) => a + b, 0) /
        Math.max(1, this.metrics.efficiency.length),
      memoryStats: this.holoMemory.getStats(),
      converged: this.checkConvergence()
    };
  }

  // Add patterns for training
  addPatterns(patterns) {
    this.patterns.push(...patterns);
  }
}

// ============================================================
//  FRACTAL REALITY FORGE (Main Class)
// ============================================================

class FractalRealityForge extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = config;
    this.dataDir = config.dataDir || path.join(__dirname, '../../data/forge');
    this.ensureDirectories();

    // Initialize components
    this.extractor = new MicroPatternExtractor();
    this.holoMemory = new HoloMemoryLayer({ dimensions: config.dimensions || 369 });
    this.loopEngine = new RecursiveLoopEngine(this.holoMemory, config);

    // Parallel streams
    this.microStream = null;
    this.macroStream = null;

    // State
    this.seeded = false;
    this.training = false;
    this.stats = {
      filesProcessed: 0,
      patternsExtracted: 0,
      atomicUnits: 0,
      trainingIterations: 0
    };

    // Wire up events
    this.loopEngine.on('cycle:complete', (data) => this.emit('cycle:complete', data));
    this.loopEngine.on('loop:complete', (data) => this.emit('training:complete', data));
  }

  ensureDirectories() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  // ============================================================
  //  SEEDING METHODS
  // ============================================================

  // Seed from codebase directory
  async seedFromCodebase(directory, options = {}) {
    console.log(`[FractalForge] Seeding from: ${directory}`);
    const patterns = [];

    const processDir = (dir) => {
      if (!fs.existsSync(dir)) return;

      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // Skip node_modules and hidden dirs
          if (!item.startsWith('.') && item !== 'node_modules') {
            processDir(fullPath);
          }
        } else if (item.endsWith('.js')) {
          try {
            const code = fs.readFileSync(fullPath, 'utf8');
            const filePatterns = this.extractor.extractFromCode(code, fullPath);
            const atoms = this.extractor.extractAtomicUnits(code);

            patterns.push(...filePatterns);
            this.stats.filesProcessed++;
            this.stats.patternsExtracted += filePatterns.length;
            this.stats.atomicUnits += atoms.length;
          } catch (e) {
            // Skip unreadable files
          }
        }
      }
    };

    processDir(directory);

    // Store patterns in holo-memory
    for (const pattern of patterns) {
      this.holoMemory.store(
        pattern.name || pattern.module || `pattern_${Math.random().toString(36).slice(2, 8)}`,
        pattern,
        { type: pattern.type, source: 'codebase' }
      );
    }

    // Add to loop engine
    this.loopEngine.addPatterns(patterns);

    this.seeded = true;
    console.log(`[FractalForge] Seeded ${patterns.length} patterns from ${this.stats.filesProcessed} files`);

    return {
      patterns: patterns.length,
      files: this.stats.filesProcessed,
      atoms: this.stats.atomicUnits
    };
  }

  // Seed with synthetic data
  async seedSynthetic(data) {
    console.log(`[FractalForge] Seeding synthetic data: ${data.length} items`);

    for (const item of data) {
      this.holoMemory.store(
        item.id || `synthetic_${Math.random().toString(36).slice(2, 8)}`,
        item,
        { type: 'synthetic', source: 'generated' }
      );
      this.loopEngine.addPatterns([item]);
    }

    this.seeded = true;
    return { items: data.length };
  }

  // ============================================================
  //  TRAINING METHODS
  // ============================================================

  // Start training loop
  async startTraining(options = {}) {
    if (!this.seeded) {
      throw new Error('Forge must be seeded before training');
    }

    if (this.training) {
      console.log('[FractalForge] Training already in progress');
      return;
    }

    this.training = true;
    console.log('[FractalForge] Starting recursive training loops...');

    const results = await this.loopEngine.startLoop(
      Array.from(this.holoMemory.memory.values()).flat().map(m => m.value)
    );

    this.training = false;
    this.stats.trainingIterations = results.iterations;

    return results;
  }

  // Run a quick training burst
  async quickBurst(iterations = 36) {
    const originalMax = this.loopEngine.maxIterations;
    this.loopEngine.maxIterations = iterations;

    const results = await this.startTraining();

    this.loopEngine.maxIterations = originalMax;
    return results;
  }

  // Stop training
  stopTraining() {
    this.loopEngine.stop();
    this.training = false;
  }

  // ============================================================
  //  OUTPUT METHODS
  // ============================================================

  // Generate predictive simulation
  generateSimulation(query) {
    const related = this.holoMemory.search(query);
    const entangled = related.flatMap(r => this.holoMemory.getEntangled(r.key));

    return {
      query,
      directMatches: related.length,
      entangledPatterns: entangled.length,
      prediction: this.synthesizePrediction(related, entangled)
    };
  }

  // Synthesize prediction from patterns
  synthesizePrediction(matches, entangled) {
    if (matches.length === 0) {
      return { confidence: 0, suggestion: 'Insufficient data' };
    }

    const avgScore = matches.reduce((a, m) => a + (m.score || 0.5), 0) / matches.length;
    const entanglementBoost = Math.min(0.3, entangled.length * 0.01);

    return {
      confidence: Math.min(1, avgScore + entanglementBoost),
      patternTypes: [...new Set(matches.map(m => m.value?.type))],
      suggestion: `Based on ${matches.length} patterns with ${entangled.length} entanglements`
    };
  }

  // Get current state
  getState() {
    return {
      seeded: this.seeded,
      training: this.training,
      stats: this.stats,
      memory: this.holoMemory.getStats(),
      loopResults: this.loopEngine.getResults()
    };
  }

  // Export learned patterns
  exportPatterns() {
    const patterns = [];
    for (const [pos, items] of this.holoMemory.memory) {
      for (const item of items) {
        patterns.push(item);
      }
    }
    return patterns;
  }

  // Save state to disk
  saveState() {
    const state = {
      timestamp: Date.now(),
      stats: this.stats,
      memoryStats: this.holoMemory.getStats(),
      loopResults: this.loopEngine.getResults(),
      // Save training metrics for resume
      metrics: {
        improvements: this.loopEngine.metrics.improvements,
        efficiency: this.loopEngine.metrics.efficiency,
        agiScore: this.loopEngine.metrics.agiScore
      },
      iteration: this.loopEngine.iteration
    };

    fs.writeFileSync(
      path.join(this.dataDir, 'forge-state.json'),
      JSON.stringify(state, null, 2)
    );

    // Save holoMemory state separately (can be large)
    try {
      const memoryState = this.holoMemory.serialize();
      fs.writeFileSync(
        path.join(this.dataDir, 'holo-memory.json'),
        JSON.stringify(memoryState)
      );
      console.log(`[FractalForge] Saved ${memoryState.memory.length} memory positions`);
    } catch (e) {
      console.log(`[FractalForge] Could not save memory state: ${e.message}`);
    }

    // Also save top patterns for persistence
    this.saveTopPatterns();

    return state;
  }

  // Save top refined patterns for future training
  saveTopPatterns() {
    const patterns = this.loopEngine.patterns || [];

    // Sort by refinement count and score
    const topPatterns = patterns
      .filter(p => p.refinementCount > 0)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 1000);  // Keep top 1000

    if (topPatterns.length > 0) {
      fs.writeFileSync(
        path.join(this.dataDir, 'refined-patterns.json'),
        JSON.stringify({
          timestamp: Date.now(),
          count: topPatterns.length,
          patterns: topPatterns
        }, null, 2)
      );
    }

    return topPatterns.length;
  }

  // Load previous state for incremental training
  loadState() {
    const statePath = path.join(this.dataDir, 'forge-state.json');
    const patternsPath = path.join(this.dataDir, 'refined-patterns.json');
    const memoryPath = path.join(this.dataDir, 'holo-memory.json');

    let loaded = { state: false, patterns: 0, memoryItems: 0 };

    // Load previous state
    if (fs.existsSync(statePath)) {
      try {
        const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));

        // Restore metrics for incremental training
        if (state.metrics) {
          this.loopEngine.metrics = state.metrics;
          this.loopEngine.iteration = state.iteration || 0;
        }

        // Restore stats
        if (state.stats) {
          this.stats = { ...this.stats, ...state.stats };
        }

        loaded.state = true;
        console.log(`[FractalForge] Loaded state from iteration ${state.iteration || 0}`);
      } catch (e) {
        console.log(`[FractalForge] Could not load state: ${e.message}`);
      }
    }

    // Load holoMemory state (priority - has all the learning)
    if (fs.existsSync(memoryPath)) {
      try {
        const memoryData = JSON.parse(fs.readFileSync(memoryPath, 'utf8'));
        if (this.holoMemory.deserialize(memoryData)) {
          const stats = this.holoMemory.getStats();
          loaded.memoryItems = stats.totalItems;
          // Mark as seeded if we have substantial restored memory
          if (stats.totalItems > 100) {
            this.seeded = true;
          }
          console.log(`[FractalForge] Restored ${stats.positions} memory positions, ${stats.totalItems} items, ${stats.entanglements} entanglements`);
        }
      } catch (e) {
        console.log(`[FractalForge] Could not load memory state: ${e.message}`);
      }
    }

    // Load refined patterns (backup if memory didn't load)
    if (fs.existsSync(patternsPath) && loaded.memoryItems === 0) {
      try {
        const data = JSON.parse(fs.readFileSync(patternsPath, 'utf8'));

        if (data.patterns && Array.isArray(data.patterns)) {
          // Re-inject into training
          this.loopEngine.addPatterns(data.patterns);

          // Also store in holo-memory
          for (const pattern of data.patterns) {
            this.holoMemory.store(
              pattern.name || `restored_${Math.random().toString(36).slice(2, 8)}`,
              pattern,
              { type: 'restored', source: 'previous_training' }
            );
          }

          loaded.patterns = data.patterns.length;
          console.log(`[FractalForge] Loaded ${data.patterns.length} refined patterns`);
        }
      } catch (e) {
        console.log(`[FractalForge] Could not load patterns: ${e.message}`);
      }
    }

    return loaded;
  }
}

// ============================================================
//  SINGLETON & EXPORTS
// ============================================================

let forgeInstance = null;

function getFractalForge(config = {}) {
  if (!forgeInstance) {
    forgeInstance = new FractalRealityForge(config);
  }
  return forgeInstance;
}

module.exports = {
  FractalRealityForge,
  getFractalForge,
  MicroPatternExtractor,
  HoloMemoryLayer,
  RecursiveLoopEngine
};

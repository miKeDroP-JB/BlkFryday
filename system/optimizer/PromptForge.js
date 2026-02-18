// ============================================================
//  PROMPT FORGE - Evolutionary Prompt Optimization + Glyph Compression
// ============================================================
//
//  "Optimal prompts, compressed to atoms, evolving forever"
//
//  This system:
//  1. Creates agent-specific optimal prompts
//  2. Compresses prompts to glyphs (maximum density)
//  3. Runs evolutionary optimization on prompts
//  4. Feeds refined outputs back as training data
//
// ============================================================

const { EventEmitter } = require('events');
const crypto = require('crypto');

// ============================================================
//  GLYPH DICTIONARY - Maximum compression symbols
// ============================================================

const GLYPH_DICTIONARY = {
  // Action glyphs
  'think': 'Θ',
  'analyze': 'Δ',
  'create': '⊕',
  'transform': '→',
  'return': '↩',
  'loop': '∞',
  'branch': '⑂',
  'merge': '⊗',
  'filter': '⫾',
  'map': '⊛',
  'reduce': '⊖',
  'compose': '∘',
  'execute': '▶',
  'stop': '■',
  'wait': '⏸',

  // Structure glyphs
  'function': 'ƒ',
  'class': '©',
  'object': '◯',
  'array': '[]',
  'map': '{}',
  'set': '⊂',
  'tree': '🌳',
  'graph': '◈',
  'sequence': '≋',
  'stack': '⊏',
  'queue': '⊐',

  // Logic glyphs
  'if': '?',
  'else': ':',
  'and': '∧',
  'or': '∨',
  'not': '¬',
  'implies': '⊃',
  'equals': '≡',
  'forall': '∀',
  'exists': '∃',
  'true': '⊤',
  'false': '⊥',
  'null': '∅',

  // Quality glyphs
  'best': '★',
  'good': '☆',
  'bad': '✗',
  'improve': '↑',
  'degrade': '↓',
  'optimize': '⚡',
  'validate': '✓',
  'error': '⚠',

  // Meta glyphs
  'self': '⊙',
  'meta': 'μ',
  'recursive': '↺',
  'parallel': '∥',
  'sequential': '≫',
  'atomic': '⚛',
  'quantum': 'ψ',

  // Domain glyphs
  'code': '</>',
  'text': '¶',
  'data': '◆',
  'model': '◇',
  'agent': '⊚',
  'prompt': '⊳',
  'output': '⊲',
  'input': '⊴',

  // Instruction glyphs
  'step_by_step': '①②③',
  'list_items': '•••',
  'be_concise': '∴',
  'be_detailed': '∵',
  'examples': 'eg',
  'no_examples': '¬eg',
  'format_json': '{}',
  'format_code': '<>',
  'format_text': '""'
};

// Reverse dictionary for decompression
const REVERSE_GLYPHS = Object.fromEntries(
  Object.entries(GLYPH_DICTIONARY).map(([k, v]) => [v, k])
);

// ============================================================
//  AGENT PROMPT TEMPLATES
//  Optimal prompts for each agent type
// ============================================================

const AGENT_PROMPTS = {
  reasoning: {
    name: 'ReasoningAgent',
    fullPrompt: `You are a reasoning agent. Think step-by-step. Number each step.
Show your work. Consider edge cases. Validate conclusions.
Format: 1) Understand 2) Analyze 3) Reason 4) Conclude 5) Verify`,
    glyphPrompt: 'Θ①②③ ∀edge ✓conclude',
    atomicInstructions: ['step_by_step', 'validate', 'forall', 'edge_cases'],
    score: 0.95
  },

  coding: {
    name: 'CodeAgent',
    fullPrompt: `You are a code agent. Write minimal, clean, tested code.
No unnecessary comments. Use meaningful names. Handle errors.
Format: function → test → optimize → return`,
    glyphPrompt: 'ƒ∴ ¬comment ⚠handle →✓',
    atomicInstructions: ['minimal', 'test', 'error_handle', 'optimize'],
    score: 0.92
  },

  analysis: {
    name: 'AnalysisAgent',
    fullPrompt: `You are an analysis agent. Break down problems systematically.
List pros and cons. Quantify when possible. Rank by importance.
Format: observe → decompose → measure → rank → synthesize`,
    glyphPrompt: 'Δ•pros•cons ↑rank ≡measure',
    atomicInstructions: ['decompose', 'quantify', 'rank', 'synthesize'],
    score: 0.90
  },

  creative: {
    name: 'CreativeAgent',
    fullPrompt: `You are a creative agent. Generate multiple variations.
Think divergently. Combine unexpected elements. Rank by novelty.
Format: diverge → generate × 5 → combine → rank novelty`,
    glyphPrompt: '⊕×5 ⊗unexpected ↑novelty',
    atomicInstructions: ['diverge', 'multiply', 'combine', 'rank_novelty'],
    score: 0.88
  },

  optimization: {
    name: 'OptimizationAgent',
    fullPrompt: `You are an optimization agent. Find the best solution.
Explore trade-offs. Measure performance. Iterate until optimal.
Format: measure → explore → iterate → converge → verify`,
    glyphPrompt: '⚡measure →iterate ∞→★ ✓',
    atomicInstructions: ['measure', 'tradeoff', 'iterate', 'converge'],
    score: 0.93
  },

  validation: {
    name: 'ValidationAgent',
    fullPrompt: `You are a validation agent. Check correctness thoroughly.
Test edge cases. Verify assumptions. Report all failures.
Format: test → edge_cases → assumptions → report`,
    glyphPrompt: '✓∀edge ∀assume ⚠report',
    atomicInstructions: ['test_all', 'edge_cases', 'verify', 'report'],
    score: 0.94
  },

  meta: {
    name: 'MetaAgent',
    fullPrompt: `You are a meta-cognitive agent. Think about thinking.
Optimize the optimization process. Self-improve recursively.
Format: observe_self → analyze_process → improve → repeat`,
    glyphPrompt: 'μ⊙Θ →↺⚡ ∞improve',
    atomicInstructions: ['self_observe', 'meta_analyze', 'recursive_improve'],
    score: 0.96
  },

  compression: {
    name: 'CompressionAgent',
    fullPrompt: `You are a compression agent. Minimize tokens, maximize meaning.
Extract essence. Remove redundancy. Preserve semantics.
Format: extract_essence → remove_redundant → compress → verify_meaning`,
    glyphPrompt: '∴essence ¬redundant →⚛ ✓≡',
    atomicInstructions: ['extract', 'deduplicate', 'compress', 'verify'],
    score: 0.91
  }
};

// ============================================================
//  PROMPT COMPRESSOR
// ============================================================

class PromptCompressor {
  constructor() {
    this.glyphs = GLYPH_DICTIONARY;
    this.reverseGlyphs = REVERSE_GLYPHS;
    this.customMappings = new Map();
    this.compressionStats = { totalCompressed: 0, totalSaved: 0 };
  }

  // Compress text to glyphs
  compress(text) {
    let compressed = text.toLowerCase();
    const originalLength = compressed.length;

    // Apply glyph substitutions
    for (const [word, glyph] of Object.entries(this.glyphs)) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      compressed = compressed.replace(regex, glyph);
    }

    // Apply custom learned mappings
    for (const [pattern, glyph] of this.customMappings) {
      compressed = compressed.replace(new RegExp(pattern, 'gi'), glyph);
    }

    // Remove common filler words
    const fillers = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall'];
    for (const filler of fillers) {
      compressed = compressed.replace(new RegExp(`\\b${filler}\\b`, 'gi'), '');
    }

    // Clean up whitespace
    compressed = compressed.replace(/\s+/g, ' ').trim();

    const compressedLength = compressed.length;
    const ratio = compressedLength / originalLength;

    this.compressionStats.totalCompressed++;
    this.compressionStats.totalSaved += originalLength - compressedLength;

    return {
      original: text,
      compressed,
      originalLength,
      compressedLength,
      ratio,
      savings: `${((1 - ratio) * 100).toFixed(1)}%`
    };
  }

  // Decompress glyphs back to text
  decompress(glyphText) {
    let expanded = glyphText;

    for (const [glyph, word] of Object.entries(this.reverseGlyphs)) {
      expanded = expanded.replace(new RegExp(this.escapeRegex(glyph), 'g'), word);
    }

    return expanded;
  }

  // Learn new compression pattern
  learnPattern(pattern, glyph) {
    this.customMappings.set(pattern, glyph);
  }

  // Create atomic representation
  toAtoms(text) {
    const words = text.split(/\s+/);
    const atoms = [];

    for (const word of words) {
      const glyph = this.glyphs[word.toLowerCase()];
      if (glyph) {
        atoms.push({ type: 'glyph', value: glyph, meaning: word });
      } else if (word.length <= 3) {
        atoms.push({ type: 'short', value: word });
      } else {
        // Hash longer words
        const hash = crypto.createHash('md5').update(word).digest('hex').slice(0, 4);
        atoms.push({ type: 'hash', value: `#${hash}`, original: word });
      }
    }

    return atoms;
  }

  // Reconstruct from atoms
  fromAtoms(atoms) {
    return atoms.map(a => {
      if (a.type === 'glyph') return a.meaning;
      if (a.type === 'short') return a.value;
      if (a.type === 'hash') return a.original;
      return a.value;
    }).join(' ');
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  getStats() {
    return this.compressionStats;
  }
}

// ============================================================
//  EVOLUTIONARY PROMPT OPTIMIZER
// ============================================================

class PromptEvolver extends EventEmitter {
  constructor(config = {}) {
    super();
    this.populationSize = config.populationSize || 20;
    this.mutationRate = config.mutationRate || 0.1;
    this.generations = config.generations || 50;
    this.compressor = new PromptCompressor();
    this.population = [];
    this.bestPrompts = new Map();
    this.generation = 0;
  }

  // Initialize population with variants
  initializePopulation(basePrompt, agentType) {
    this.population = [];

    // Add base prompt
    this.population.push({
      prompt: basePrompt,
      compressed: this.compressor.compress(basePrompt).compressed,
      score: 0.5,
      agentType,
      mutations: 0
    });

    // Generate variants
    for (let i = 1; i < this.populationSize; i++) {
      const mutated = this.mutate(basePrompt);
      this.population.push({
        prompt: mutated,
        compressed: this.compressor.compress(mutated).compressed,
        score: 0.5,
        agentType,
        mutations: 1
      });
    }

    return this.population;
  }

  // Mutate a prompt
  mutate(prompt) {
    const mutations = [
      // Add instruction
      (p) => p + ' Be precise.',
      (p) => p + ' Show your work.',
      (p) => p + ' Consider alternatives.',
      (p) => p + ' Verify your answer.',
      (p) => p + ' Think step by step.',

      // Remove words
      (p) => p.replace(/\bvery\b/gi, ''),
      (p) => p.replace(/\bplease\b/gi, ''),
      (p) => p.replace(/\bjust\b/gi, ''),

      // Restructure
      (p) => p.split('. ').reverse().join('. '),
      (p) => p.replace(/You are/gi, 'Act as'),
      (p) => p.replace(/should/gi, 'must'),

      // Add constraints
      (p) => p + ' Maximum 100 words.',
      (p) => p + ' Use bullet points.',
      (p) => p + ' No unnecessary text.',

      // Add format
      (p) => p + ' Format: JSON',
      (p) => p + ' Format: Markdown',
      (p) => p + ' Format: Code only'
    ];

    // Apply random mutation
    const mutation = mutations[Math.floor(Math.random() * mutations.length)];
    return mutation(prompt);
  }

  // Crossover two prompts
  crossover(prompt1, prompt2) {
    const words1 = prompt1.split(' ');
    const words2 = prompt2.split(' ');
    const crossPoint = Math.floor(Math.random() * Math.min(words1.length, words2.length));

    return words1.slice(0, crossPoint).concat(words2.slice(crossPoint)).join(' ');
  }

  // Evaluate prompt (simulated - would use actual AI in production)
  evaluatePrompt(promptObj) {
    let score = 0.5;

    // Score based on compression efficiency
    const compressionBonus = 1 - (promptObj.compressed.length / promptObj.prompt.length);
    score += compressionBonus * 0.2;

    // Score based on key instruction presence
    const keyInstructions = ['step', 'verify', 'format', 'precise', 'think'];
    for (const instruction of keyInstructions) {
      if (promptObj.prompt.toLowerCase().includes(instruction)) {
        score += 0.05;
      }
    }

    // Penalize overly long prompts
    if (promptObj.prompt.length > 500) {
      score -= 0.1;
    }

    // Bonus for structural elements
    if (promptObj.prompt.includes('→') || promptObj.prompt.includes(':')) {
      score += 0.05;
    }

    return Math.min(1, Math.max(0, score));
  }

  // Run one generation
  evolveGeneration() {
    // Evaluate all
    for (const p of this.population) {
      p.score = this.evaluatePrompt(p);
    }

    // Sort by score
    this.population.sort((a, b) => b.score - a.score);

    // Keep top half
    const survivors = this.population.slice(0, Math.floor(this.populationSize / 2));

    // Generate offspring
    const offspring = [];
    while (survivors.length + offspring.length < this.populationSize) {
      const parent1 = survivors[Math.floor(Math.random() * survivors.length)];
      const parent2 = survivors[Math.floor(Math.random() * survivors.length)];

      let childPrompt;
      if (Math.random() < 0.5) {
        childPrompt = this.crossover(parent1.prompt, parent2.prompt);
      } else {
        childPrompt = this.mutate(parent1.prompt);
      }

      offspring.push({
        prompt: childPrompt,
        compressed: this.compressor.compress(childPrompt).compressed,
        score: 0.5,
        agentType: parent1.agentType,
        mutations: parent1.mutations + 1
      });
    }

    this.population = [...survivors, ...offspring];
    this.generation++;

    this.emit('generation', {
      generation: this.generation,
      bestScore: this.population[0].score,
      avgScore: this.population.reduce((a, p) => a + p.score, 0) / this.population.length
    });

    return this.population[0];
  }

  // Run full evolution
  evolve(basePrompt, agentType) {
    this.initializePopulation(basePrompt, agentType);

    for (let g = 0; g < this.generations; g++) {
      const best = this.evolveGeneration();

      // Store best for this agent type
      if (!this.bestPrompts.has(agentType) ||
          best.score > this.bestPrompts.get(agentType).score) {
        this.bestPrompts.set(agentType, { ...best });
      }
    }

    return this.bestPrompts.get(agentType);
  }

  getBestPrompts() {
    return Object.fromEntries(this.bestPrompts);
  }
}

// ============================================================
//  PROMPT FORGE (Main Class)
// ============================================================

class PromptForge extends EventEmitter {
  constructor(config = {}) {
    super();
    this.compressor = new PromptCompressor();
    this.evolver = new PromptEvolver(config);
    this.agentPrompts = { ...AGENT_PROMPTS };
    this.optimizedPrompts = new Map();
    this.feedbackLoop = [];
    this.atomicLibrary = new Map();
  }

  // Get optimal prompt for agent type
  getPrompt(agentType, format = 'full') {
    const prompt = this.agentPrompts[agentType];
    if (!prompt) return null;

    switch (format) {
      case 'full':
        return prompt.fullPrompt;
      case 'glyph':
        return prompt.glyphPrompt;
      case 'atoms':
        return this.compressor.toAtoms(prompt.fullPrompt);
      case 'compressed':
        return this.compressor.compress(prompt.fullPrompt);
      default:
        return prompt;
    }
  }

  // Optimize prompts for all agents
  async optimizeAll() {
    const results = {};

    for (const [type, config] of Object.entries(this.agentPrompts)) {
      console.log(`  Optimizing ${type}...`);
      const optimized = this.evolver.evolve(config.fullPrompt, type);
      this.optimizedPrompts.set(type, optimized);

      // Convert to atoms
      const atoms = this.compressor.toAtoms(optimized.prompt);
      this.atomicLibrary.set(type, atoms);

      results[type] = {
        original: config.fullPrompt,
        optimized: optimized.prompt,
        compressed: optimized.compressed,
        atoms: atoms.length,
        score: optimized.score,
        improvement: `${((optimized.score - config.score) * 100).toFixed(1)}%`
      };
    }

    return results;
  }

  // Feed output back for learning
  feedBack(agentType, input, output, quality) {
    this.feedbackLoop.push({
      agentType,
      input,
      output,
      quality,
      timestamp: Date.now()
    });

    // If quality is high, learn patterns
    if (quality > 0.8) {
      const compressed = this.compressor.compress(output);
      if (compressed.ratio < 0.5) {
        // Very compressible - learn this pattern
        this.compressor.learnPattern(
          output.slice(0, 20),
          `⊚${agentType.slice(0, 3)}✓`
        );
      }
    }

    this.emit('feedback', { agentType, quality });
  }

  // Get all prompts as training data
  getTrainingData() {
    const data = [];

    // Add base prompts
    for (const [type, config] of Object.entries(this.agentPrompts)) {
      data.push({
        type: 'prompt',
        agentType: type,
        full: config.fullPrompt,
        glyph: config.glyphPrompt,
        atoms: config.atomicInstructions,
        score: config.score
      });
    }

    // Add optimized prompts
    for (const [type, optimized] of this.optimizedPrompts) {
      data.push({
        type: 'optimized_prompt',
        agentType: type,
        prompt: optimized.prompt,
        compressed: optimized.compressed,
        score: optimized.score
      });
    }

    // Add feedback data
    for (const fb of this.feedbackLoop) {
      if (fb.quality > 0.7) {
        data.push({
          type: 'feedback',
          agentType: fb.agentType,
          pattern: this.compressor.compress(fb.output).compressed,
          quality: fb.quality
        });
      }
    }

    return data;
  }

  // Export atomic library
  exportAtoms() {
    const atoms = {
      glyphs: GLYPH_DICTIONARY,
      agentAtoms: Object.fromEntries(this.atomicLibrary),
      compressionStats: this.compressor.getStats()
    };
    return atoms;
  }

  // Get stats
  getStats() {
    return {
      agentTypes: Object.keys(this.agentPrompts).length,
      optimizedPrompts: this.optimizedPrompts.size,
      feedbackEntries: this.feedbackLoop.length,
      atomicPatterns: this.atomicLibrary.size,
      compression: this.compressor.getStats()
    };
  }
}

// ============================================================
//  EXPORTS
// ============================================================

module.exports = {
  PromptForge,
  PromptCompressor,
  PromptEvolver,
  GLYPH_DICTIONARY,
  AGENT_PROMPTS
};

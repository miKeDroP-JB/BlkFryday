/**
 * CHAIN-OF-THOUGHT CACHING
 * Cache reasoning patterns, not just answers
 *
 * "Wisdom is knowing HOW to think, not just WHAT to think" - CoT Philosophy
 *
 * Features:
 * - Cache reasoning steps, not just final answers
 * - Pattern matching for similar problem structures
 * - Reuse proven thought chains for new problems
 * - Learn from successful reasoning patterns
 */

// Reasoning step types
const STEP_TYPES = {
  UNDERSTAND: 'understand',     // Parse and understand the problem
  DECOMPOSE: 'decompose',       // Break into sub-problems
  ANALYZE: 'analyze',           // Analyze components
  HYPOTHESIZE: 'hypothesize',   // Form hypotheses
  EVALUATE: 'evaluate',         // Evaluate options
  SYNTHESIZE: 'synthesize',     // Combine insights
  CONCLUDE: 'conclude',         // Draw conclusions
  VERIFY: 'verify'              // Verify the result
};

// Problem structure patterns
const PROBLEM_PATTERNS = {
  COMPARISON: {
    indicators: ['compare', 'vs', 'versus', 'difference', 'better', 'which'],
    template: ['understand', 'decompose', 'analyze', 'evaluate', 'conclude']
  },
  EXPLANATION: {
    indicators: ['explain', 'why', 'how', 'what causes', 'reason'],
    template: ['understand', 'analyze', 'hypothesize', 'verify', 'conclude']
  },
  GENERATION: {
    indicators: ['create', 'write', 'generate', 'build', 'design'],
    template: ['understand', 'decompose', 'synthesize', 'evaluate', 'conclude']
  },
  DEBUGGING: {
    indicators: ['fix', 'debug', 'error', 'wrong', 'broken', 'not working'],
    template: ['understand', 'analyze', 'hypothesize', 'verify', 'synthesize', 'conclude']
  },
  OPTIMIZATION: {
    indicators: ['optimize', 'improve', 'faster', 'better', 'efficient'],
    template: ['understand', 'analyze', 'evaluate', 'hypothesize', 'synthesize', 'verify', 'conclude']
  },
  DECISION: {
    indicators: ['should', 'decide', 'choose', 'pick', 'recommend'],
    template: ['understand', 'decompose', 'analyze', 'evaluate', 'conclude']
  }
};

/**
 * Reasoning Step
 * A single step in a chain of thought
 */
class ReasoningStep {
  constructor(data) {
    this.id = Math.random().toString(36).substr(2, 9);
    this.type = data.type || STEP_TYPES.ANALYZE;
    this.content = data.content;
    this.insights = data.insights || [];
    this.confidence = data.confidence || 0.8;
    this.dependencies = data.dependencies || []; // IDs of steps this depends on
    this.timestamp = Date.now();
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      content: this.content,
      insights: this.insights,
      confidence: this.confidence
    };
  }
}

/**
 * Thought Chain
 * A complete chain of reasoning
 */
class ThoughtChain {
  constructor(data) {
    this.id = data.id || Math.random().toString(36).substr(2, 12);
    this.problemPattern = data.problemPattern;
    this.problemSignature = data.problemSignature;
    this.steps = data.steps || [];
    this.finalAnswer = data.finalAnswer;
    this.quality = data.quality || 0;
    this.useCount = 0;
    this.successCount = 0;
    this.createdAt = Date.now();
    this.lastUsedAt = Date.now();
  }

  addStep(step) {
    this.steps.push(new ReasoningStep(step));
  }

  getStepsByType(type) {
    return this.steps.filter(s => s.type === type);
  }

  getSuccessRate() {
    return this.useCount > 0 ? this.successCount / this.useCount : 0;
  }

  markUsed(successful = true) {
    this.useCount++;
    if (successful) this.successCount++;
    this.lastUsedAt = Date.now();
  }

  toJSON() {
    return {
      id: this.id,
      problemPattern: this.problemPattern,
      steps: this.steps.map(s => s.toJSON()),
      quality: this.quality,
      successRate: this.getSuccessRate(),
      useCount: this.useCount
    };
  }
}

/**
 * Problem Signature Generator
 * Creates signatures for matching similar problems
 */
class ProblemSignatureGenerator {
  constructor() {
    this.patterns = PROBLEM_PATTERNS;
  }

  /**
   * Generate signature for a problem
   */
  generate(problem) {
    const lower = problem.toLowerCase();

    // Detect pattern type
    let patternType = 'GENERAL';
    for (const [type, pattern] of Object.entries(this.patterns)) {
      for (const indicator of pattern.indicators) {
        if (lower.includes(indicator)) {
          patternType = type;
          break;
        }
      }
      if (patternType !== 'GENERAL') break;
    }

    // Extract key concepts (simplified - production would use NLP)
    const concepts = this.extractConcepts(problem);

    // Extract structure markers
    const structure = this.extractStructure(problem);

    return {
      patternType,
      concepts,
      structure,
      hash: this.computeHash(patternType, concepts, structure)
    };
  }

  /**
   * Extract key concepts from problem
   */
  extractConcepts(problem) {
    // Simple keyword extraction
    const words = problem.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3);

    // Remove common words
    const stopWords = new Set([
      'the', 'and', 'that', 'this', 'with', 'from', 'have', 'what',
      'how', 'why', 'when', 'where', 'which', 'who', 'will', 'would',
      'could', 'should', 'does', 'about', 'into', 'through', 'during'
    ]);

    return [...new Set(words.filter(w => !stopWords.has(w)))].slice(0, 10);
  }

  /**
   * Extract structural patterns
   */
  extractStructure(problem) {
    const structure = {
      hasQuestion: problem.includes('?'),
      hasCode: /```|function|class|const|let|var/.test(problem),
      hasNumbers: /\d+/.test(problem),
      hasComparison: /\bvs\b|versus|compare|between/.test(problem.toLowerCase()),
      hasList: /\d\.\s|•|[-*]\s/.test(problem),
      length: problem.length < 100 ? 'short' : problem.length < 500 ? 'medium' : 'long'
    };

    return structure;
  }

  /**
   * Compute hash for quick matching
   */
  computeHash(patternType, concepts, structure) {
    const components = [
      patternType,
      concepts.sort().join('|'),
      structure.length,
      structure.hasCode ? 'code' : 'text'
    ];
    return components.join(':');
  }

  /**
   * Calculate similarity between two signatures
   */
  calculateSimilarity(sig1, sig2) {
    let score = 0;
    let weights = 0;

    // Pattern type match (40% weight)
    if (sig1.patternType === sig2.patternType) {
      score += 0.4;
    }
    weights += 0.4;

    // Concept overlap (40% weight)
    const concepts1 = new Set(sig1.concepts);
    const concepts2 = new Set(sig2.concepts);
    const intersection = [...concepts1].filter(c => concepts2.has(c));
    const union = new Set([...concepts1, ...concepts2]);
    if (union.size > 0) {
      score += 0.4 * (intersection.length / union.size);
    }
    weights += 0.4;

    // Structure match (20% weight)
    const structMatch =
      (sig1.structure.hasCode === sig2.structure.hasCode ? 0.1 : 0) +
      (sig1.structure.length === sig2.structure.length ? 0.1 : 0);
    score += structMatch;
    weights += 0.2;

    return score / weights;
  }
}

/**
 * Chain-of-Thought Cache
 * Stores and retrieves reasoning chains
 */
class ChainOfThoughtCache {
  constructor(config = {}) {
    this.chains = new Map();
    this.signatureGenerator = new ProblemSignatureGenerator();
    this.maxChains = config.maxChains || 500;
    this.minSimilarity = config.minSimilarity || 0.6;
    this.minQuality = config.minQuality || 0.7;
    this.stats = {
      stored: 0,
      hits: 0,
      misses: 0,
      reuses: 0
    };
  }

  /**
   * Store a reasoning chain
   */
  store(problem, chain, quality) {
    const signature = this.signatureGenerator.generate(problem);

    const thoughtChain = new ThoughtChain({
      problemPattern: signature.patternType,
      problemSignature: signature,
      steps: chain.steps || chain,
      finalAnswer: chain.answer,
      quality
    });

    // Check capacity
    if (this.chains.size >= this.maxChains) {
      this.evictLowestValue();
    }

    this.chains.set(thoughtChain.id, thoughtChain);
    this.stats.stored++;

    return thoughtChain.id;
  }

  /**
   * Find matching chain for a problem
   */
  find(problem) {
    const signature = this.signatureGenerator.generate(problem);
    const candidates = [];

    for (const [id, chain] of this.chains) {
      if (chain.quality < this.minQuality) continue;

      const similarity = this.signatureGenerator.calculateSimilarity(
        signature,
        chain.problemSignature
      );

      if (similarity >= this.minSimilarity) {
        candidates.push({
          chain,
          similarity,
          score: similarity * chain.quality * (0.5 + chain.getSuccessRate() * 0.5)
        });
      }
    }

    if (candidates.length === 0) {
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;

    // Return best match
    candidates.sort((a, b) => b.score - a.score);
    return {
      chain: candidates[0].chain,
      similarity: candidates[0].similarity,
      adaptationNeeded: candidates[0].similarity < 0.9
    };
  }

  /**
   * Get reasoning template for problem type
   */
  getTemplate(problemType) {
    const pattern = PROBLEM_PATTERNS[problemType] || PROBLEM_PATTERNS.GENERATION;
    return pattern.template;
  }

  /**
   * Adapt a chain for a new problem
   */
  adaptChain(originalChain, newProblem) {
    const newSignature = this.signatureGenerator.generate(newProblem);

    // Create adapted steps
    const adaptedSteps = originalChain.steps.map(step => ({
      type: step.type,
      content: this.adaptStepContent(step.content, originalChain.problemSignature, newSignature),
      confidence: step.confidence * 0.9 // Slightly lower confidence for adapted
    }));

    return {
      originalChainId: originalChain.id,
      adaptedSteps,
      newSignature,
      adaptationNotes: this.generateAdaptationNotes(originalChain.problemSignature, newSignature)
    };
  }

  /**
   * Adapt step content for new problem
   */
  adaptStepContent(content, oldSig, newSig) {
    // Replace old concepts with new ones (simplified)
    let adapted = content;

    // This is a simplified adaptation - production would use LLM
    const conceptMap = new Map();
    for (let i = 0; i < Math.min(oldSig.concepts.length, newSig.concepts.length); i++) {
      conceptMap.set(oldSig.concepts[i], newSig.concepts[i]);
    }

    for (const [oldConcept, newConcept] of conceptMap) {
      adapted = adapted.replace(new RegExp(oldConcept, 'gi'), newConcept);
    }

    return adapted;
  }

  /**
   * Generate notes about what was adapted
   */
  generateAdaptationNotes(oldSig, newSig) {
    const notes = [];

    if (oldSig.patternType !== newSig.patternType) {
      notes.push(`Pattern changed: ${oldSig.patternType} → ${newSig.patternType}`);
    }

    const oldConcepts = new Set(oldSig.concepts);
    const newConcepts = new Set(newSig.concepts);
    const added = [...newConcepts].filter(c => !oldConcepts.has(c));
    const removed = [...oldConcepts].filter(c => !newConcepts.has(c));

    if (added.length > 0) {
      notes.push(`New concepts: ${added.join(', ')}`);
    }
    if (removed.length > 0) {
      notes.push(`Removed concepts: ${removed.join(', ')}`);
    }

    return notes;
  }

  /**
   * Mark chain as reused
   */
  markReused(chainId, successful = true) {
    const chain = this.chains.get(chainId);
    if (chain) {
      chain.markUsed(successful);
      this.stats.reuses++;
    }
  }

  /**
   * Evict lowest value chain
   */
  evictLowestValue() {
    let lowestId = null;
    let lowestValue = Infinity;

    for (const [id, chain] of this.chains) {
      // Value = quality * success rate * recency factor
      const recencyFactor = 1 / (1 + (Date.now() - chain.lastUsedAt) / (1000 * 60 * 60 * 24)); // decay over days
      const value = chain.quality * chain.getSuccessRate() * recencyFactor;

      if (value < lowestValue) {
        lowestValue = value;
        lowestId = id;
      }
    }

    if (lowestId) {
      this.chains.delete(lowestId);
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    const patternCounts = {};
    for (const chain of this.chains.values()) {
      patternCounts[chain.problemPattern] = (patternCounts[chain.problemPattern] || 0) + 1;
    }

    return {
      ...this.stats,
      totalChains: this.chains.size,
      hitRate: this.stats.hits + this.stats.misses > 0
        ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(1) + '%'
        : '0%',
      avgReuseCount: this.chains.size > 0
        ? ([...this.chains.values()].reduce((sum, c) => sum + c.useCount, 0) / this.chains.size).toFixed(1)
        : 0,
      byPattern: patternCounts
    };
  }
}

/**
 * Chain-of-Thought Executor
 * Executes reasoning chains with caching
 */
class ChainOfThoughtExecutor {
  constructor(config = {}) {
    this.cache = new ChainOfThoughtCache(config);
    this.signatureGenerator = new ProblemSignatureGenerator();
    this.executor = config.executor; // LLM executor
  }

  /**
   * Execute with chain-of-thought reasoning
   */
  async execute(problem, options = {}) {
    // Check cache first
    const cached = this.cache.find(problem);

    if (cached && !options.forceNew) {
      // Adapt and use cached chain
      if (cached.adaptationNeeded) {
        const adapted = this.cache.adaptChain(cached.chain, problem);
        return await this.executeWithGuidance(problem, adapted.adaptedSteps, cached.chain.id);
      } else {
        // High similarity - can reuse more directly
        return await this.executeWithGuidance(problem, cached.chain.steps, cached.chain.id);
      }
    }

    // No cache hit - execute fresh
    return await this.executeFresh(problem, options);
  }

  /**
   * Execute with guidance from cached chain
   */
  async executeWithGuidance(problem, guidanceSteps, originalChainId) {
    if (!this.executor) {
      return { success: false, error: 'No executor configured' };
    }

    // Build prompt with reasoning guidance
    const guidancePrompt = this.buildGuidedPrompt(problem, guidanceSteps);

    const startTime = Date.now();
    const result = await this.executor(guidancePrompt, { guided: true });
    const latency = Date.now() - startTime;

    if (result.success) {
      this.cache.markReused(originalChainId, true);
    }

    return {
      ...result,
      guided: true,
      originalChainId,
      latency
    };
  }

  /**
   * Execute fresh (no cached guidance)
   */
  async executeFresh(problem, options) {
    const signature = this.signatureGenerator.generate(problem);
    const template = this.cache.getTemplate(signature.patternType);

    // Build structured prompt
    const structuredPrompt = this.buildStructuredPrompt(problem, template);

    if (!this.executor) {
      return { success: false, error: 'No executor configured' };
    }

    const startTime = Date.now();
    const result = await this.executor(structuredPrompt, { structured: true });
    const latency = Date.now() - startTime;

    // Cache if successful and high quality
    if (result.success && result.quality >= 0.7) {
      const steps = this.extractStepsFromResult(result, template);
      this.cache.store(problem, { steps, answer: result.content }, result.quality);
    }

    return {
      ...result,
      guided: false,
      patternType: signature.patternType,
      latency
    };
  }

  /**
   * Build prompt with reasoning guidance
   */
  buildGuidedPrompt(problem, guidanceSteps) {
    let prompt = `Problem: ${problem}\n\n`;
    prompt += `Follow this proven reasoning approach:\n\n`;

    for (let i = 0; i < guidanceSteps.length; i++) {
      const step = guidanceSteps[i];
      prompt += `Step ${i + 1} (${step.type}): ${step.content}\n`;
    }

    prompt += `\nApply this reasoning pattern to solve the current problem.`;
    return prompt;
  }

  /**
   * Build structured prompt from template
   */
  buildStructuredPrompt(problem, template) {
    let prompt = `Problem: ${problem}\n\n`;
    prompt += `Solve this step by step:\n\n`;

    for (let i = 0; i < template.length; i++) {
      const stepType = template[i];
      const stepName = STEP_TYPES[stepType.toUpperCase()] || stepType;
      prompt += `${i + 1}. [${stepName.toUpperCase()}]: `;

      switch (stepType) {
        case 'understand':
          prompt += 'First, understand what is being asked...\n';
          break;
        case 'decompose':
          prompt += 'Break this into smaller parts...\n';
          break;
        case 'analyze':
          prompt += 'Analyze the key components...\n';
          break;
        case 'hypothesize':
          prompt += 'Form a hypothesis about the solution...\n';
          break;
        case 'evaluate':
          prompt += 'Evaluate the options...\n';
          break;
        case 'synthesize':
          prompt += 'Combine insights into a solution...\n';
          break;
        case 'verify':
          prompt += 'Verify the solution is correct...\n';
          break;
        case 'conclude':
          prompt += 'State the final conclusion...\n';
          break;
        default:
          prompt += 'Continue the reasoning...\n';
      }
    }

    return prompt;
  }

  /**
   * Extract reasoning steps from result
   */
  extractStepsFromResult(result, template) {
    // Simplified extraction - production would parse more carefully
    const content = result.content || '';
    const steps = [];

    for (const stepType of template) {
      // Look for step markers in content
      const stepRegex = new RegExp(`\\[${stepType.toUpperCase()}\\][:.]?\\s*([^\\[]+)`, 'i');
      const match = content.match(stepRegex);

      steps.push({
        type: stepType,
        content: match ? match[1].trim() : `${stepType} reasoning applied`,
        confidence: match ? 0.9 : 0.7
      });
    }

    return steps;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return this.cache.getStats();
  }
}

module.exports = {
  STEP_TYPES,
  PROBLEM_PATTERNS,
  ReasoningStep,
  ThoughtChain,
  ProblemSignatureGenerator,
  ChainOfThoughtCache,
  ChainOfThoughtExecutor
};

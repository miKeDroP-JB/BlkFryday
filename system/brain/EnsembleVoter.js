/**
 * ENSEMBLE VOTING SYSTEM
 * Wisdom of crowds - multiple AI opinions aggregated into best answer
 *
 * "Many minds are better than one" - Ensemble Philosophy
 *
 * Voting Methods:
 * - Majority voting (for classification/decisions)
 * - Weighted voting (based on model strength)
 * - Synthesis (combine best parts of all responses)
 * - Ranked choice (for preference decisions)
 */

const { MultiModelClient, AI_PROVIDERS } = require('./MultiModelSwarm');
const { QualityEvaluator } = require('./CascadeEngine');

// Default ensemble configuration
const DEFAULT_ENSEMBLE = [
  { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022', weight: 1.2, name: 'Claude' },
  { provider: 'openai', model: 'gpt-4o', weight: 1.0, name: 'GPT-4' },
  { provider: 'groq', model: 'llama-3.1-70b-versatile', weight: 0.9, name: 'Llama' },
  { provider: 'google', model: 'gemini-1.5-pro', weight: 1.0, name: 'Gemini' },
  { provider: 'mistral', model: 'mistral-medium-latest', weight: 0.85, name: 'Mistral' }
];

// Voting strategies
const VOTING_STRATEGIES = {
  MAJORITY: 'majority',        // Most common answer wins
  WEIGHTED: 'weighted',        // Weighted by model quality
  QUALITY: 'quality',          // Highest quality score wins
  SYNTHESIS: 'synthesis',      // AI combines all responses
  RANKED: 'ranked',            // Ranked choice voting
  CONSENSUS: 'consensus'       // Find common ground
};

/**
 * Response Similarity Calculator
 * Measures how similar two responses are
 */
class SimilarityCalculator {
  /**
   * Calculate semantic similarity between two responses
   */
  static calculate(response1, response2) {
    // Tokenize
    const tokens1 = this.tokenize(response1);
    const tokens2 = this.tokenize(response2);

    // Jaccard similarity
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    const jaccard = intersection.size / union.size;

    // N-gram similarity (bigrams)
    const bigrams1 = this.getNgrams(tokens1, 2);
    const bigrams2 = this.getNgrams(tokens2, 2);
    const bigramSet1 = new Set(bigrams1);
    const bigramSet2 = new Set(bigrams2);
    const bigramIntersection = new Set([...bigramSet1].filter(x => bigramSet2.has(x)));
    const bigramUnion = new Set([...bigramSet1, ...bigramSet2]);

    const bigramSimilarity = bigramUnion.size > 0 ? bigramIntersection.size / bigramUnion.size : 0;

    // Combined score
    return jaccard * 0.4 + bigramSimilarity * 0.6;
  }

  static tokenize(text) {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2);
  }

  static getNgrams(tokens, n) {
    const ngrams = [];
    for (let i = 0; i <= tokens.length - n; i++) {
      ngrams.push(tokens.slice(i, i + n).join(' '));
    }
    return ngrams;
  }

  /**
   * Cluster responses by similarity
   */
  static clusterResponses(responses, threshold = 0.5) {
    const clusters = [];

    for (const response of responses) {
      let added = false;

      for (const cluster of clusters) {
        const similarity = this.calculate(response.content, cluster[0].content);
        if (similarity >= threshold) {
          cluster.push(response);
          added = true;
          break;
        }
      }

      if (!added) {
        clusters.push([response]);
      }
    }

    return clusters;
  }
}

/**
 * Ensemble Voter
 * Orchestrates multiple AI models and aggregates their responses
 */
class EnsembleVoter {
  constructor(config = {}) {
    this.client = new MultiModelClient(config.apiKeys);
    this.evaluator = new QualityEvaluator(config);
    this.ensemble = config.ensemble || DEFAULT_ENSEMBLE;
    this.synthesizer = config.synthesizer || {
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022'
    };
    this.stats = {
      totalVotes: 0,
      strategyUsage: {},
      consensusRate: 0
    };
  }

  /**
   * Get responses from all models in ensemble
   */
  async gatherResponses(task, options = {}) {
    const startTime = Date.now();

    const promises = this.ensemble.map(async (model) => {
      const messages = [
        { role: 'system', content: 'You are a helpful AI assistant. Provide accurate, thorough responses.' },
        { role: 'user', content: task }
      ];

      const result = await this.client.call(model.provider, model.model, messages, options);

      if (result.success) {
        const quality = this.evaluator.evaluate(result, task);
        return {
          ...result,
          modelName: model.name,
          provider: model.provider,
          model: model.model,
          weight: model.weight,
          quality: quality.score
        };
      }

      return {
        success: false,
        modelName: model.name,
        error: result.error
      };
    });

    const responses = await Promise.all(promises);
    const successful = responses.filter(r => r.success);

    return {
      responses: successful,
      failed: responses.filter(r => !r.success),
      totalLatency: Date.now() - startTime
    };
  }

  /**
   * Majority voting - most common answer wins
   */
  async voteMajority(task, options = {}) {
    const { responses } = await this.gatherResponses(task, options);

    if (responses.length === 0) {
      return { success: false, error: 'No successful responses' };
    }

    // Cluster similar responses
    const clusters = SimilarityCalculator.clusterResponses(responses);

    // Find largest cluster
    const largestCluster = clusters.reduce((max, cluster) =>
      cluster.length > max.length ? cluster : max
    , []);

    // Pick best from largest cluster
    const winner = largestCluster.reduce((best, response) =>
      response.quality > best.quality ? response : best
    );

    return {
      success: true,
      strategy: VOTING_STRATEGIES.MAJORITY,
      winner,
      content: winner.content,
      votes: largestCluster.length,
      totalVoters: responses.length,
      consensusLevel: largestCluster.length / responses.length,
      clusters: clusters.map(c => ({
        size: c.length,
        models: c.map(r => r.modelName)
      }))
    };
  }

  /**
   * Weighted voting - higher weight models count more
   */
  async voteWeighted(task, options = {}) {
    const { responses } = await this.gatherResponses(task, options);

    if (responses.length === 0) {
      return { success: false, error: 'No successful responses' };
    }

    // Calculate weighted scores
    const scoredResponses = responses.map(r => ({
      ...r,
      weightedScore: r.quality * r.weight
    }));

    // Winner is highest weighted score
    const winner = scoredResponses.reduce((best, r) =>
      r.weightedScore > best.weightedScore ? r : best
    );

    return {
      success: true,
      strategy: VOTING_STRATEGIES.WEIGHTED,
      winner,
      content: winner.content,
      weightedScore: winner.weightedScore,
      rankings: scoredResponses
        .sort((a, b) => b.weightedScore - a.weightedScore)
        .map(r => ({ model: r.modelName, score: r.weightedScore.toFixed(3) }))
    };
  }

  /**
   * Quality voting - highest quality score wins
   */
  async voteQuality(task, options = {}) {
    const { responses } = await this.gatherResponses(task, options);

    if (responses.length === 0) {
      return { success: false, error: 'No successful responses' };
    }

    // Winner is highest quality
    const winner = responses.reduce((best, r) =>
      r.quality > best.quality ? r : best
    );

    return {
      success: true,
      strategy: VOTING_STRATEGIES.QUALITY,
      winner,
      content: winner.content,
      quality: winner.quality,
      rankings: responses
        .sort((a, b) => b.quality - a.quality)
        .map(r => ({ model: r.modelName, quality: r.quality.toFixed(3) }))
    };
  }

  /**
   * Synthesis voting - AI combines best parts of all responses
   */
  async voteSynthesis(task, options = {}) {
    const { responses } = await this.gatherResponses(task, options);

    if (responses.length === 0) {
      return { success: false, error: 'No successful responses' };
    }

    // Build synthesis prompt
    const responseSummaries = responses
      .map((r, i) => `[${r.modelName}] (quality: ${r.quality.toFixed(2)}):\n${r.content}`)
      .join('\n\n---\n\n');

    const synthesisPrompt = `You are synthesizing multiple AI responses into one optimal answer.

ORIGINAL TASK:
${task}

RESPONSES FROM DIFFERENT AI MODELS:
${responseSummaries}

Your task:
1. Identify the strongest points from each response
2. Resolve any contradictions by favoring higher-quality responses
3. Combine the best elements into a single, cohesive response
4. Ensure the synthesized response is better than any individual one

Provide the synthesized response:`;

    const synthesisResult = await this.client.call(
      this.synthesizer.provider,
      this.synthesizer.model,
      [
        { role: 'system', content: 'You are an expert at synthesizing information from multiple sources.' },
        { role: 'user', content: synthesisPrompt }
      ],
      options
    );

    if (!synthesisResult.success) {
      // Fallback to quality voting
      return this.voteQuality(task, options);
    }

    const synthesisQuality = this.evaluator.evaluate(synthesisResult, task);

    return {
      success: true,
      strategy: VOTING_STRATEGIES.SYNTHESIS,
      content: synthesisResult.content,
      quality: synthesisQuality.score,
      sourcesUsed: responses.map(r => r.modelName),
      sourceQualities: responses.map(r => ({ model: r.modelName, quality: r.quality.toFixed(3) })),
      improvement: synthesisQuality.score - Math.max(...responses.map(r => r.quality))
    };
  }

  /**
   * Consensus voting - find common ground across all responses
   */
  async voteConsensus(task, options = {}) {
    const { responses } = await this.gatherResponses(task, options);

    if (responses.length === 0) {
      return { success: false, error: 'No successful responses' };
    }

    // Build consensus prompt
    const responseSummaries = responses
      .map((r, i) => `[${r.modelName}]:\n${r.content.substring(0, 1000)}`)
      .join('\n\n');

    const consensusPrompt = `Analyze these responses from multiple AI models and identify points of consensus.

TASK:
${task}

RESPONSES:
${responseSummaries}

Identify:
1. Points where ALL models agree
2. Points where MOST models agree
3. Points of disagreement

Then provide a consensus response that focuses on the agreed-upon information.

Format:
CONSENSUS POINTS:
- [list agreed points]

DISAGREEMENTS:
- [list disagreements]

CONSENSUS RESPONSE:
[your response focusing on consensus]`;

    const consensusResult = await this.client.call(
      this.synthesizer.provider,
      this.synthesizer.model,
      [
        { role: 'system', content: 'You identify consensus across multiple viewpoints.' },
        { role: 'user', content: consensusPrompt }
      ],
      options
    );

    if (!consensusResult.success) {
      return this.voteMajority(task, options);
    }

    return {
      success: true,
      strategy: VOTING_STRATEGIES.CONSENSUS,
      content: consensusResult.content,
      participatingModels: responses.map(r => r.modelName),
      modelCount: responses.length
    };
  }

  /**
   * Auto-select best voting strategy based on task
   */
  async vote(task, options = {}) {
    this.stats.totalVotes++;

    const strategy = options.strategy || this.selectStrategy(task);
    this.stats.strategyUsage[strategy] = (this.stats.strategyUsage[strategy] || 0) + 1;

    switch (strategy) {
      case VOTING_STRATEGIES.MAJORITY:
        return this.voteMajority(task, options);
      case VOTING_STRATEGIES.WEIGHTED:
        return this.voteWeighted(task, options);
      case VOTING_STRATEGIES.QUALITY:
        return this.voteQuality(task, options);
      case VOTING_STRATEGIES.SYNTHESIS:
        return this.voteSynthesis(task, options);
      case VOTING_STRATEGIES.CONSENSUS:
        return this.voteConsensus(task, options);
      default:
        return this.voteQuality(task, options);
    }
  }

  /**
   * Select best strategy based on task type
   */
  selectStrategy(task) {
    const taskLower = task.toLowerCase();

    // Factual questions - consensus is best
    if (taskLower.includes('what is') || taskLower.includes('define') ||
        taskLower.includes('explain')) {
      return VOTING_STRATEGIES.CONSENSUS;
    }

    // Complex tasks - synthesis is best
    if (taskLower.includes('create') || taskLower.includes('design') ||
        taskLower.includes('build')) {
      return VOTING_STRATEGIES.SYNTHESIS;
    }

    // Decision making - majority is best
    if (taskLower.includes('should') || taskLower.includes('best') ||
        taskLower.includes('recommend')) {
      return VOTING_STRATEGIES.MAJORITY;
    }

    // Default to quality voting
    return VOTING_STRATEGIES.QUALITY;
  }

  /**
   * Get voting statistics
   */
  getStats() {
    return {
      ...this.stats,
      strategyDistribution: Object.fromEntries(
        Object.entries(this.stats.strategyUsage).map(([k, v]) =>
          [k, `${((v / this.stats.totalVotes) * 100).toFixed(1)}%`]
        )
      )
    };
  }
}

/**
 * Quick ensemble vote helper
 */
async function ensembleVote(task, options = {}) {
  const voter = new EnsembleVoter(options);
  return voter.vote(task, options);
}

module.exports = {
  VOTING_STRATEGIES,
  DEFAULT_ENSEMBLE,
  SimilarityCalculator,
  EnsembleVoter,
  ensembleVote
};

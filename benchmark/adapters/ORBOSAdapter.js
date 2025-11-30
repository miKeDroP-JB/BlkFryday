// ============================================================
//  ORBOS STACK ADAPTER
//  Adapter for testing the full ORBOS system
// ============================================================

const { AdapterBase } = require('./AdapterBase');

class ORBOSAdapter extends AdapterBase {
  constructor(config = {}) {
    super('ORBOS', config);
    this.masterBrain = null;
    this.glyphCompressor = null;
    this.useGlyphs = config.useGlyphs !== false;
    this.useParallel = config.useParallel || false;
    this.useEvolution = config.useEvolution || false;
  }

  async initialize() {
    try {
      // Load MasterBrain
      const { getMasterBrain } = require('../../system/core/MasterBrain');
      this.masterBrain = getMasterBrain();

      // Initialize if not already done
      if (!this.masterBrain.state?.initialized) {
        await this.masterBrain.initialize();
      }

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('ORBOS Adapter init failed:', error.message);
      this.initialized = false;
      return false;
    }
  }

  async warmup() {
    // Run a simple test call to warm up caches
    try {
      await this.call('warmup test', { timeout: 5000 });
      return true;
    } catch (e) {
      return false;
    }
  }

  async call(prompt, options = {}) {
    const startTime = Date.now();

    try {
      // Apply glyph compression if enabled
      let processedPrompt = prompt;
      let compressionStats = null;

      if (this.useGlyphs && this.masterBrain.systems?.VoiceFirst) {
        // Compress prompt using glyph system
        const compressed = await this.compressWithGlyphs(prompt);
        processedPrompt = compressed.compressed;
        compressionStats = {
          originalTokens: compressed.originalTokens,
          compressedTokens: compressed.compressedTokens,
          ratio: compressed.ratio
        };
      }

      // Execute through MasterBrain
      const task = {
        id: `bench_${Date.now()}`,
        type: 'benchmark',
        prompt: processedPrompt,
        parallel: this.useParallel,
        evolve: this.useEvolution,
        timeout: options.timeout || 30000
      };

      const result = await this.masterBrain.execute(task);
      const latency = Date.now() - startTime;

      const response = {
        text: result.result?.text || result.result || JSON.stringify(result),
        tokens: compressionStats?.compressedTokens || this.estimateTokens(processedPrompt),
        cost: this.estimateCost(result),
        latency_ms: latency,
        success: result.success !== false,
        metadata: {
          compression: compressionStats,
          strategy: result.strategy,
          parallel: result.parallel,
          evolved: result.evolved
        }
      };

      this.recordCall(response);
      return response;

    } catch (error) {
      const latency = Date.now() - startTime;
      const response = {
        text: null,
        tokens: 0,
        cost: 0,
        latency_ms: latency,
        success: false,
        error: error.message
      };
      this.recordCall(response);
      return response;
    }
  }

  async compressWithGlyphs(text) {
    // Use VoiceFirst glyph compression
    const originalTokens = this.estimateTokens(text);

    // Apply compression (simplified - would use actual glyph system)
    const compressed = text;  // Placeholder
    const compressedTokens = originalTokens;  // Placeholder

    return {
      original: text,
      compressed,
      originalTokens,
      compressedTokens,
      ratio: compressedTokens / originalTokens
    };
  }

  estimateTokens(text) {
    // Rough token estimation (1 token ≈ 4 chars)
    return Math.ceil(text.length / 4);
  }

  estimateCost(result) {
    // Estimate cost based on tokens
    const tokens = result.tokens || 0;
    const costPer1k = 0.002;  // Example rate
    return (tokens / 1000) * costPer1k;
  }
}

module.exports = { ORBOSAdapter };

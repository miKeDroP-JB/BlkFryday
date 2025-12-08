/**
 * Lightweight Confidence Scoring + Multi-LLM Fusion
 * Fixes: Calibration engine over-triggering, critical insight fusion
 */

export interface LLMResponse {
  model: string;
  output: string;
  confidence: number;
  latencyMs: number;
  tokenCount: number;
  metadata?: Record<string, unknown>;
}

export interface FusedInsight {
  output: string;
  confidence: number;
  agreement: number;
  sources: Array<{ model: string; weight: number; confidence: number }>;
  fusionMethod: 'weighted' | 'majority' | 'highest' | 'ensemble';
}

export interface ConfidenceThresholds {
  trigger: number;      // Min confidence to trigger action
  escalate: number;     // Confidence below this escalates to human
  consensus: number;    // Required agreement for multi-LLM
}

export interface CalibrationData {
  predictions: Array<{ predicted: number; actual: boolean }>;
  lastCalibration: number;
  calibrationCurve: number[]; // Platt scaling parameters
}

export class ConfidenceEngine {
  private modelWeights: Map<string, number> = new Map();
  private calibrationData: Map<string, CalibrationData> = new Map();
  private thresholds: ConfidenceThresholds;
  private triggerCooldown: Map<string, number> = new Map();
  private cooldownMs: number;

  constructor(config: {
    thresholds?: Partial<ConfidenceThresholds>;
    defaultModelWeight?: number;
    cooldownMs?: number;
  } = {}) {
    this.thresholds = {
      trigger: config.thresholds?.trigger ?? 0.75,
      escalate: config.thresholds?.escalate ?? 0.4,
      consensus: config.thresholds?.consensus ?? 0.6,
    };
    this.cooldownMs = config.cooldownMs ?? 5000;

    // Default model weights (can be calibrated)
    this.modelWeights.set('gpt-4', 1.0);
    this.modelWeights.set('claude-3', 0.95);
    this.modelWeights.set('llama-70b', 0.8);
    this.modelWeights.set('mistral-large', 0.75);
  }

  /**
   * Set model weight for fusion
   */
  setModelWeight(model: string, weight: number): void {
    this.modelWeights.set(model, Math.max(0, Math.min(1, weight)));
  }

  /**
   * Calibrate confidence using Platt scaling
   * Takes historical predictions and actual outcomes
   */
  calibrate(model: string, predictions: Array<{ predicted: number; actual: boolean }>): void {
    if (predictions.length < 10) return; // Need minimum data

    // Simple Platt scaling: P(y=1|f) = 1/(1+exp(Af+B))
    // Using logistic regression to find A and B
    let A = 1, B = 0;

    // Gradient descent for calibration
    const lr = 0.01;
    for (let iter = 0; iter < 100; iter++) {
      let gradA = 0, gradB = 0;

      for (const { predicted, actual } of predictions) {
        const p = 1 / (1 + Math.exp(A * predicted + B));
        const y = actual ? 1 : 0;
        gradA += (p - y) * predicted;
        gradB += (p - y);
      }

      A -= lr * gradA / predictions.length;
      B -= lr * gradB / predictions.length;
    }

    this.calibrationData.set(model, {
      predictions,
      lastCalibration: Date.now(),
      calibrationCurve: [A, B],
    });
  }

  /**
   * Get calibrated confidence score
   */
  getCalibratedConfidence(model: string, rawConfidence: number): number {
    const calibration = this.calibrationData.get(model);
    if (!calibration) return rawConfidence;

    const [A, B] = calibration.calibrationCurve;
    return 1 / (1 + Math.exp(A * rawConfidence + B));
  }

  /**
   * Check if action should trigger (with cooldown)
   */
  shouldTrigger(actionId: string, confidence: number): {
    trigger: boolean;
    reason: 'approved' | 'low_confidence' | 'cooldown' | 'escalate';
  } {
    // Check cooldown
    const lastTrigger = this.triggerCooldown.get(actionId) ?? 0;
    if (Date.now() - lastTrigger < this.cooldownMs) {
      return { trigger: false, reason: 'cooldown' };
    }

    // Check thresholds
    if (confidence < this.thresholds.escalate) {
      return { trigger: false, reason: 'escalate' };
    }

    if (confidence < this.thresholds.trigger) {
      return { trigger: false, reason: 'low_confidence' };
    }

    // Update cooldown
    this.triggerCooldown.set(actionId, Date.now());
    return { trigger: true, reason: 'approved' };
  }

  /**
   * Fuse multiple LLM responses with confidence weighting
   */
  fuseResponses(
    responses: LLMResponse[],
    method: 'weighted' | 'majority' | 'highest' | 'ensemble' = 'weighted'
  ): FusedInsight {
    if (responses.length === 0) {
      return {
        output: '',
        confidence: 0,
        agreement: 0,
        sources: [],
        fusionMethod: method,
      };
    }

    if (responses.length === 1) {
      const r = responses[0];
      return {
        output: r.output,
        confidence: this.getCalibratedConfidence(r.model, r.confidence),
        agreement: 1,
        sources: [{ model: r.model, weight: 1, confidence: r.confidence }],
        fusionMethod: method,
      };
    }

    // Calculate weights
    const weights = responses.map(r => {
      const modelWeight = this.modelWeights.get(r.model) ?? 0.5;
      const calibratedConf = this.getCalibratedConfidence(r.model, r.confidence);
      return modelWeight * calibratedConf;
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const normalizedWeights = weights.map(w => w / totalWeight);

    let fusedOutput: string;
    let fusedConfidence: number;

    switch (method) {
      case 'highest': {
        // Pick highest confidence response
        let maxIdx = 0;
        for (let i = 1; i < responses.length; i++) {
          if (weights[i] > weights[maxIdx]) maxIdx = i;
        }
        fusedOutput = responses[maxIdx].output;
        fusedConfidence = this.getCalibratedConfidence(
          responses[maxIdx].model,
          responses[maxIdx].confidence
        );
        break;
      }

      case 'majority': {
        // Simple voting (for categorical outputs)
        const votes: Map<string, number> = new Map();
        for (let i = 0; i < responses.length; i++) {
          const key = responses[i].output.trim().toLowerCase();
          votes.set(key, (votes.get(key) ?? 0) + normalizedWeights[i]);
        }
        let maxVote = 0;
        let winner = responses[0].output;
        for (const [output, vote] of votes) {
          if (vote > maxVote) {
            maxVote = vote;
            winner = output;
          }
        }
        fusedOutput = winner;
        fusedConfidence = maxVote;
        break;
      }

      case 'ensemble':
      case 'weighted':
      default: {
        // Weighted combination - use highest weighted response
        // (for text, we can't truly average, so pick best weighted)
        let maxWeight = 0;
        let bestIdx = 0;
        for (let i = 0; i < normalizedWeights.length; i++) {
          if (normalizedWeights[i] > maxWeight) {
            maxWeight = normalizedWeights[i];
            bestIdx = i;
          }
        }
        fusedOutput = responses[bestIdx].output;
        // Confidence is weighted average
        fusedConfidence = responses.reduce((sum, r, i) =>
          sum + normalizedWeights[i] * this.getCalibratedConfidence(r.model, r.confidence), 0
        );
        break;
      }
    }

    // Calculate agreement score
    const agreement = this.calculateAgreement(responses);

    return {
      output: fusedOutput,
      confidence: fusedConfidence,
      agreement,
      sources: responses.map((r, i) => ({
        model: r.model,
        weight: normalizedWeights[i],
        confidence: r.confidence,
      })),
      fusionMethod: method,
    };
  }

  /**
   * Calculate agreement between responses (0-1)
   */
  private calculateAgreement(responses: LLMResponse[]): number {
    if (responses.length < 2) return 1;

    // Simple similarity based on output length and content overlap
    let totalSimilarity = 0;
    let comparisons = 0;

    for (let i = 0; i < responses.length; i++) {
      for (let j = i + 1; j < responses.length; j++) {
        const a = responses[i].output.toLowerCase();
        const b = responses[j].output.toLowerCase();

        // Jaccard similarity on words
        const wordsA = new Set(a.split(/\s+/));
        const wordsB = new Set(b.split(/\s+/));
        const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
        const union = new Set([...wordsA, ...wordsB]).size;

        totalSimilarity += union > 0 ? intersection / union : 0;
        comparisons++;
      }
    }

    return comparisons > 0 ? totalSimilarity / comparisons : 0;
  }

  /**
   * Get confidence stats
   */
  getStats(): {
    modelCount: number;
    calibratedModels: string[];
    thresholds: ConfidenceThresholds;
    activeCooldowns: number;
  } {
    return {
      modelCount: this.modelWeights.size,
      calibratedModels: [...this.calibrationData.keys()],
      thresholds: { ...this.thresholds },
      activeCooldowns: this.triggerCooldown.size,
    };
  }
}

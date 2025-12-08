/**
 * Async Batch Processing + GPU Queue
 * Fixes: LLM inference latency
 */

export interface InferenceRequest {
  id: string;
  prompt: string;
  model: string;
  priority: 'critical' | 'high' | 'normal' | 'low';
  maxTokens?: number;
  temperature?: number;
  callback?: (result: InferenceResult) => void;
}

export interface InferenceResult {
  id: string;
  output: string;
  latencyMs: number;
  tokensUsed: number;
  fromCache: boolean;
}

interface QueuedBatch {
  requests: InferenceRequest[];
  scheduledAt: number;
}

export class GPUInferenceQueue {
  private queues: Map<string, InferenceRequest[]> = new Map();
  private processing = false;
  private batchSize: number;
  private batchDelayMs: number;
  private gpuSlots: number;
  private activeSlots = 0;
  private cache: Map<string, { result: InferenceResult; expires: number }> = new Map();
  private cacheTTL: number;

  constructor(config: {
    batchSize?: number;
    batchDelayMs?: number;
    gpuSlots?: number;
    cacheTTL?: number;
  } = {}) {
    this.batchSize = config.batchSize ?? 8;
    this.batchDelayMs = config.batchDelayMs ?? 50;
    this.gpuSlots = config.gpuSlots ?? 4;
    this.cacheTTL = config.cacheTTL ?? 60000;
  }

  private getCacheKey(req: InferenceRequest): string {
    return `${req.model}:${req.prompt}:${req.maxTokens}:${req.temperature}`;
  }

  async enqueue(request: InferenceRequest): Promise<InferenceResult> {
    // Check cache first
    const cacheKey = this.getCacheKey(request);
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return { ...cached.result, fromCache: true };
    }

    return new Promise((resolve) => {
      const req = { ...request, callback: resolve };

      // Priority queue segregation
      const queueKey = req.priority;
      if (!this.queues.has(queueKey)) {
        this.queues.set(queueKey, []);
      }
      this.queues.get(queueKey)!.push(req);

      this.scheduleBatchProcessing();
    });
  }

  private scheduleBatchProcessing(): void {
    if (this.processing) return;
    this.processing = true;

    setTimeout(() => this.processBatches(), this.batchDelayMs);
  }

  private async processBatches(): Promise<void> {
    const priorityOrder: Array<'critical' | 'high' | 'normal' | 'low'> =
      ['critical', 'high', 'normal', 'low'];

    for (const priority of priorityOrder) {
      const queue = this.queues.get(priority);
      if (!queue || queue.length === 0) continue;

      while (queue.length > 0 && this.activeSlots < this.gpuSlots) {
        const batch = queue.splice(0, this.batchSize);
        this.activeSlots++;

        // Process batch async
        this.executeBatch(batch).finally(() => {
          this.activeSlots--;
        });
      }
    }

    // Check if more work pending
    const hasWork = priorityOrder.some(p =>
      (this.queues.get(p)?.length ?? 0) > 0
    );

    if (hasWork) {
      setTimeout(() => this.processBatches(), this.batchDelayMs);
    } else {
      this.processing = false;
    }
  }

  private async executeBatch(batch: InferenceRequest[]): Promise<void> {
    const startTime = Date.now();

    // Simulate batched GPU inference (replace with actual LLM call)
    const results = await this.batchInference(batch);

    for (let i = 0; i < batch.length; i++) {
      const req = batch[i];
      const result: InferenceResult = {
        id: req.id,
        output: results[i],
        latencyMs: Date.now() - startTime,
        tokensUsed: results[i].length / 4, // rough estimate
        fromCache: false,
      };

      // Cache result
      const cacheKey = this.getCacheKey(req);
      this.cache.set(cacheKey, {
        result,
        expires: Date.now() + this.cacheTTL,
      });

      req.callback?.(result);
    }
  }

  private async batchInference(batch: InferenceRequest[]): Promise<string[]> {
    // Placeholder for actual batched LLM inference
    // In production: send batch to GPU, get parallel results
    return batch.map(req => `[inference:${req.id}]`);
  }

  getStats(): { queued: number; active: number; cacheSize: number } {
    let queued = 0;
    this.queues.forEach(q => queued += q.length);
    return {
      queued,
      active: this.activeSlots,
      cacheSize: this.cache.size,
    };
  }

  clearCache(): void {
    this.cache.clear();
  }
}

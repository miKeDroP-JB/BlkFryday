/**
 * Event-Driven Cloud Functions for Insight Promotion/Pruning
 * Fixes: Immediate insight promotion/pruning
 */

export type EventType =
  | 'insight.created'
  | 'insight.accessed'
  | 'insight.decayed'
  | 'insight.promoted'
  | 'insight.pruned'
  | 'pattern.matched'
  | 'pattern.missed'
  | 'confidence.threshold'
  | 'memory.conflict'
  | 'cache.invalidated';

export interface CloudEvent<T = unknown> {
  id: string;
  type: EventType;
  source: string;
  timestamp: number;
  data: T;
  metadata?: Record<string, unknown>;
}

export interface InsightData {
  insightId: string;
  userId: string;
  content: unknown;
  confidence: number;
  weight: number;
  accessCount: number;
  createdAt: number;
  lastAccessed: number;
}

export interface FunctionConfig {
  name: string;
  trigger: EventType | EventType[];
  filter?: (event: CloudEvent) => boolean;
  handler: (event: CloudEvent) => Promise<FunctionResult>;
  timeout?: number;
  retries?: number;
  concurrency?: number;
}

export interface FunctionResult {
  success: boolean;
  action?: 'promote' | 'prune' | 'update' | 'notify' | 'none';
  data?: unknown;
  error?: string;
}

export class EventDrivenFunctions {
  private functions: Map<string, FunctionConfig> = new Map();
  private eventQueue: CloudEvent[] = [];
  private processing = false;
  private metrics = {
    eventsProcessed: 0,
    promotions: 0,
    prunings: 0,
    errors: 0,
  };

  constructor(private config: {
    maxQueueSize?: number;
    processingIntervalMs?: number;
    defaultTimeout?: number;
  } = {}) {
    this.config.maxQueueSize = config.maxQueueSize ?? 10000;
    this.config.processingIntervalMs = config.processingIntervalMs ?? 10;
    this.config.defaultTimeout = config.defaultTimeout ?? 5000;
  }

  /**
   * Register a cloud function
   */
  register(fnConfig: FunctionConfig): void {
    this.functions.set(fnConfig.name, {
      timeout: this.config.defaultTimeout,
      retries: 3,
      concurrency: 10,
      ...fnConfig,
    });
  }

  /**
   * Unregister a function
   */
  unregister(name: string): void {
    this.functions.delete(name);
  }

  /**
   * Emit an event
   */
  emit<T>(type: EventType, data: T, source = 'system'): string {
    const event: CloudEvent<T> = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      type,
      source,
      timestamp: Date.now(),
      data,
    };

    if (this.eventQueue.length >= this.config.maxQueueSize!) {
      // Drop oldest events
      this.eventQueue.shift();
    }

    this.eventQueue.push(event);
    this.scheduleProcessing();
    return event.id;
  }

  /**
   * Process events
   */
  private scheduleProcessing(): void {
    if (this.processing) return;
    this.processing = true;

    setImmediate(() => this.processQueue());
  }

  private async processQueue(): Promise<void> {
    while (this.eventQueue.length > 0) {
      const batch = this.eventQueue.splice(0, 100);

      await Promise.all(batch.map(event => this.processEvent(event)));
    }

    this.processing = false;
  }

  private async processEvent(event: CloudEvent): Promise<void> {
    for (const fn of this.functions.values()) {
      const triggers = Array.isArray(fn.trigger) ? fn.trigger : [fn.trigger];

      if (!triggers.includes(event.type)) continue;
      if (fn.filter && !fn.filter(event)) continue;

      try {
        const result = await this.executeWithRetry(fn, event);
        this.handleResult(result, event);
        this.metrics.eventsProcessed++;
      } catch (error) {
        this.metrics.errors++;
        console.error(`Function ${fn.name} failed:`, error);
      }
    }
  }

  private async executeWithRetry(
    fn: FunctionConfig,
    event: CloudEvent
  ): Promise<FunctionResult> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < (fn.retries ?? 1); attempt++) {
      try {
        return await Promise.race([
          fn.handler(event),
          new Promise<FunctionResult>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), fn.timeout)
          ),
        ]);
      } catch (error) {
        lastError = error as Error;
        // Exponential backoff
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 100));
      }
    }

    throw lastError;
  }

  private handleResult(result: FunctionResult, event: CloudEvent): void {
    if (!result.success) return;

    switch (result.action) {
      case 'promote':
        this.metrics.promotions++;
        this.emit('insight.promoted', {
          originalEvent: event.id,
          ...result.data as object,
        });
        break;
      case 'prune':
        this.metrics.prunings++;
        this.emit('insight.pruned', {
          originalEvent: event.id,
          ...result.data as object,
        });
        break;
    }
  }

  /**
   * Get built-in promotion/pruning functions
   */
  static getDefaultFunctions(): FunctionConfig[] {
    return [
      // Auto-promote high-confidence insights
      {
        name: 'auto-promote-high-confidence',
        trigger: 'insight.created',
        filter: (event) => {
          const data = event.data as InsightData;
          return data.confidence >= 0.9;
        },
        handler: async (event) => {
          const data = event.data as InsightData;
          return {
            success: true,
            action: 'promote',
            data: { insightId: data.insightId, reason: 'high_confidence' },
          };
        },
      },

      // Auto-prune decayed insights
      {
        name: 'auto-prune-decayed',
        trigger: 'insight.decayed',
        filter: (event) => {
          const data = event.data as InsightData;
          return data.weight < 0.01;
        },
        handler: async (event) => {
          const data = event.data as InsightData;
          return {
            success: true,
            action: 'prune',
            data: { insightId: data.insightId, reason: 'decay_threshold' },
          };
        },
      },

      // Promote frequently accessed insights
      {
        name: 'promote-frequent-access',
        trigger: 'insight.accessed',
        filter: (event) => {
          const data = event.data as InsightData;
          return data.accessCount >= 10 && data.confidence >= 0.7;
        },
        handler: async (event) => {
          const data = event.data as InsightData;
          return {
            success: true,
            action: 'promote',
            data: { insightId: data.insightId, reason: 'frequent_access' },
          };
        },
      },

      // Prune stale insights
      {
        name: 'prune-stale',
        trigger: 'insight.accessed',
        filter: (event) => {
          const data = event.data as InsightData;
          const daysSinceAccess = (Date.now() - data.lastAccessed) / 86400000;
          return daysSinceAccess > 30 && data.accessCount < 3;
        },
        handler: async (event) => {
          const data = event.data as InsightData;
          return {
            success: true,
            action: 'prune',
            data: { insightId: data.insightId, reason: 'stale' },
          };
        },
      },

      // Handle confidence threshold events
      {
        name: 'confidence-threshold-handler',
        trigger: 'confidence.threshold',
        handler: async (event) => {
          const data = event.data as { type: 'above' | 'below'; value: number };
          if (data.type === 'below' && data.value < 0.3) {
            return {
              success: true,
              action: 'notify',
              data: { alert: 'low_confidence_detected', value: data.value },
            };
          }
          return { success: true, action: 'none' };
        },
      },
    ];
  }

  /**
   * Get metrics
   */
  getMetrics(): typeof this.metrics & { queueSize: number; functionCount: number } {
    return {
      ...this.metrics,
      queueSize: this.eventQueue.length,
      functionCount: this.functions.size,
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      eventsProcessed: 0,
      promotions: 0,
      prunings: 0,
      errors: 0,
    };
  }
}

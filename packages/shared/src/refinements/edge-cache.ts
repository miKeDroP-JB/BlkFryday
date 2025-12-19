/**
 * Edge KV Cache with Invalidation Triggers
 * Fixes: Edge KV cache invalidation on write
 */

export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  tags: string[];
  expires: number;
  version: number;
  checksum: string;
}

export interface InvalidationTrigger {
  id: string;
  pattern: RegExp | string;
  tags?: string[];
  onInvalidate?: (keys: string[]) => void;
  propagate: boolean; // Propagate to edge nodes
}

export interface WriteEvent {
  key: string;
  value: unknown;
  oldValue?: unknown;
  tags: string[];
  timestamp: number;
}

type InvalidationCallback = (event: WriteEvent, invalidatedKeys: string[]) => void;

export class EdgeKVCache {
  private cache: Map<string, CacheEntry> = new Map();
  private triggers: Map<string, InvalidationTrigger> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map(); // tag -> keys
  private version = 0;
  private subscribers: Map<string, InvalidationCallback[]> = new Map();
  private writeBuffer: WriteEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(private config: {
    defaultTTL?: number;
    maxSize?: number;
    flushIntervalMs?: number;
    onEvict?: (entry: CacheEntry) => void;
  } = {}) {
    this.config.defaultTTL = config.defaultTTL ?? 3600000; // 1 hour
    this.config.maxSize = config.maxSize ?? 10000;
    this.config.flushIntervalMs = config.flushIntervalMs ?? 100;

    this.startFlushLoop();
  }

  private startFlushLoop(): void {
    this.flushInterval = setInterval(() => {
      this.flushWriteBuffer();
    }, this.config.flushIntervalMs);
  }

  private computeChecksum(value: unknown): string {
    const str = JSON.stringify(value);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return hash.toString(16);
  }

  /**
   * Register invalidation trigger
   */
  registerTrigger(trigger: InvalidationTrigger): void {
    this.triggers.set(trigger.id, trigger);
  }

  /**
   * Remove invalidation trigger
   */
  removeTrigger(triggerId: string): void {
    this.triggers.delete(triggerId);
  }

  /**
   * Subscribe to invalidation events
   */
  onInvalidation(pattern: string, callback: InvalidationCallback): () => void {
    if (!this.subscribers.has(pattern)) {
      this.subscribers.set(pattern, []);
    }
    this.subscribers.get(pattern)!.push(callback);

    return () => {
      const subs = this.subscribers.get(pattern);
      if (subs) {
        const idx = subs.indexOf(callback);
        if (idx >= 0) subs.splice(idx, 1);
      }
    };
  }

  /**
   * Set value with automatic invalidation triggering
   */
  set<T>(key: string, value: T, options: {
    tags?: string[];
    ttl?: number;
  } = {}): void {
    const oldEntry = this.cache.get(key);
    const tags = options.tags ?? [];
    const ttl = options.ttl ?? this.config.defaultTTL!;

    this.version++;
    const entry: CacheEntry<T> = {
      key,
      value,
      tags,
      expires: Date.now() + ttl,
      version: this.version,
      checksum: this.computeChecksum(value),
    };

    // Update tag index
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    }

    // Remove old tags
    if (oldEntry) {
      for (const tag of oldEntry.tags) {
        if (!tags.includes(tag)) {
          this.tagIndex.get(tag)?.delete(key);
        }
      }
    }

    this.cache.set(key, entry);

    // Buffer write event for batch processing
    this.writeBuffer.push({
      key,
      value,
      oldValue: oldEntry?.value,
      tags,
      timestamp: Date.now(),
    });

    // Enforce max size
    if (this.cache.size > this.config.maxSize!) {
      this.evictOldest();
    }
  }

  /**
   * Get value (returns undefined if expired)
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (entry.expires < Date.now()) {
      this.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  /**
   * Delete key and trigger invalidations
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Remove from tag index
    for (const tag of entry.tags) {
      this.tagIndex.get(tag)?.delete(key);
    }

    this.cache.delete(key);
    this.config.onEvict?.(entry);
    return true;
  }

  /**
   * Invalidate by tag
   */
  invalidateByTag(tag: string): string[] {
    const keys = this.tagIndex.get(tag);
    if (!keys) return [];

    const invalidated = [...keys];
    for (const key of invalidated) {
      this.delete(key);
    }

    this.tagIndex.delete(tag);
    return invalidated;
  }

  /**
   * Invalidate by pattern
   */
  invalidateByPattern(pattern: RegExp | string): string[] {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    const invalidated: string[] = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.delete(key);
        invalidated.push(key);
      }
    }

    return invalidated;
  }

  /**
   * Process write buffer and trigger invalidations
   */
  private flushWriteBuffer(): void {
    if (this.writeBuffer.length === 0) return;

    const events = this.writeBuffer.splice(0);

    for (const event of events) {
      const invalidated: string[] = [];

      // Check triggers
      for (const trigger of this.triggers.values()) {
        const pattern = typeof trigger.pattern === 'string'
          ? new RegExp(trigger.pattern)
          : trigger.pattern;

        // Check key pattern match
        if (pattern.test(event.key)) {
          // Invalidate related keys
          if (trigger.tags) {
            for (const tag of trigger.tags) {
              invalidated.push(...this.invalidateByTag(tag));
            }
          }
          trigger.onInvalidate?.(invalidated);
        }

        // Check tag match
        if (trigger.tags?.some(t => event.tags.includes(t))) {
          invalidated.push(...this.invalidateByPattern(trigger.pattern));
          trigger.onInvalidate?.(invalidated);
        }
      }

      // Notify subscribers
      for (const [pattern, callbacks] of this.subscribers) {
        if (new RegExp(pattern).test(event.key)) {
          for (const cb of callbacks) {
            cb(event, invalidated);
          }
        }
      }
    }
  }

  private evictOldest(): void {
    let oldest: CacheEntry | null = null;
    let oldestKey: string | null = null;

    for (const [key, entry] of this.cache) {
      if (!oldest || entry.expires < oldest.expires) {
        oldest = entry;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  /**
   * Get cache stats
   */
  getStats(): {
    size: number;
    tagCount: number;
    triggerCount: number;
    version: number;
  } {
    return {
      size: this.cache.size,
      tagCount: this.tagIndex.size,
      triggerCount: this.triggers.size,
      version: this.version,
    };
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.tagIndex.clear();
    this.writeBuffer = [];
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.clear();
  }
}

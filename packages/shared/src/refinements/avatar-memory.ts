/**
 * Versioned Avatar Memory Overlay + Selective Delta Patching
 * Fixes: Cross-avatar memory stale override, avatar memory overlay
 */

export interface MemoryDelta {
  op: 'set' | 'delete' | 'merge' | 'increment';
  path: string[];
  value?: unknown;
  timestamp: number;
  version: number;
}

export interface MemoryVersion {
  version: number;
  timestamp: number;
  checksum: string;
  deltas: MemoryDelta[];
}

export interface AvatarMemoryState {
  avatarId: string;
  baseVersion: number;
  currentVersion: number;
  data: Record<string, unknown>;
  overlays: Map<string, MemoryVersion[]>;
  conflictResolution: 'latest' | 'merge' | 'priority';
}

export class VersionedAvatarMemory {
  private states: Map<string, AvatarMemoryState> = new Map();
  private globalVersion = 0;
  private maxVersionHistory = 100;

  constructor(private config: {
    conflictResolution?: 'latest' | 'merge' | 'priority';
    compactionThreshold?: number;
  } = {}) {
    this.config.conflictResolution = config.conflictResolution ?? 'merge';
    this.config.compactionThreshold = config.compactionThreshold ?? 50;
  }

  private getState(avatarId: string): AvatarMemoryState {
    if (!this.states.has(avatarId)) {
      this.states.set(avatarId, {
        avatarId,
        baseVersion: 0,
        currentVersion: 0,
        data: {},
        overlays: new Map(),
        conflictResolution: this.config.conflictResolution!,
      });
    }
    return this.states.get(avatarId)!;
  }

  private computeChecksum(data: unknown): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return hash.toString(16);
  }

  private applyDelta(data: Record<string, unknown>, delta: MemoryDelta): void {
    let target: Record<string, unknown> = data;
    const path = delta.path;

    // Navigate to parent
    for (let i = 0; i < path.length - 1; i++) {
      if (!(path[i] in target)) {
        target[path[i]] = {};
      }
      target = target[path[i]] as Record<string, unknown>;
    }

    const key = path[path.length - 1];

    switch (delta.op) {
      case 'set':
        target[key] = delta.value;
        break;
      case 'delete':
        delete target[key];
        break;
      case 'merge':
        if (typeof target[key] === 'object' && typeof delta.value === 'object') {
          target[key] = { ...(target[key] as object), ...(delta.value as object) };
        } else {
          target[key] = delta.value;
        }
        break;
      case 'increment':
        target[key] = ((target[key] as number) || 0) + (delta.value as number);
        break;
    }
  }

  /**
   * Create a delta patch for avatar memory
   */
  createDelta(
    avatarId: string,
    op: MemoryDelta['op'],
    path: string[],
    value?: unknown
  ): MemoryDelta {
    this.globalVersion++;
    return {
      op,
      path,
      value,
      timestamp: Date.now(),
      version: this.globalVersion,
    };
  }

  /**
   * Apply delta to avatar with versioning
   */
  applyDeltaPatch(avatarId: string, delta: MemoryDelta, overlayKey = 'default'): void {
    const state = this.getState(avatarId);

    // Apply to main data
    this.applyDelta(state.data, delta);

    // Store in overlay history
    if (!state.overlays.has(overlayKey)) {
      state.overlays.set(overlayKey, []);
    }

    const overlayHistory = state.overlays.get(overlayKey)!;
    const version: MemoryVersion = {
      version: delta.version,
      timestamp: delta.timestamp,
      checksum: this.computeChecksum(state.data),
      deltas: [delta],
    };

    overlayHistory.push(version);
    state.currentVersion = delta.version;

    // Compact if needed
    if (overlayHistory.length > this.config.compactionThreshold!) {
      this.compactOverlay(avatarId, overlayKey);
    }
  }

  /**
   * Batch apply multiple deltas efficiently
   */
  applyDeltaBatch(avatarId: string, deltas: MemoryDelta[], overlayKey = 'default'): void {
    const state = this.getState(avatarId);

    // Sort by version for correct ordering
    deltas.sort((a, b) => a.version - b.version);

    for (const delta of deltas) {
      this.applyDelta(state.data, delta);
    }

    // Store batch as single version
    if (!state.overlays.has(overlayKey)) {
      state.overlays.set(overlayKey, []);
    }

    const lastDelta = deltas[deltas.length - 1];
    state.overlays.get(overlayKey)!.push({
      version: lastDelta.version,
      timestamp: lastDelta.timestamp,
      checksum: this.computeChecksum(state.data),
      deltas,
    });

    state.currentVersion = lastDelta.version;
  }

  /**
   * Get memory state at specific version
   */
  getAtVersion(avatarId: string, targetVersion: number, overlayKey = 'default'): Record<string, unknown> | null {
    const state = this.getState(avatarId);
    const overlayHistory = state.overlays.get(overlayKey);

    if (!overlayHistory) return null;

    // Rebuild state up to target version
    const rebuilt: Record<string, unknown> = {};

    for (const version of overlayHistory) {
      if (version.version > targetVersion) break;
      for (const delta of version.deltas) {
        this.applyDelta(rebuilt, delta);
      }
    }

    return rebuilt;
  }

  /**
   * Compute diff between two versions
   */
  getDiff(avatarId: string, fromVersion: number, toVersion: number, overlayKey = 'default'): MemoryDelta[] {
    const state = this.getState(avatarId);
    const overlayHistory = state.overlays.get(overlayKey);

    if (!overlayHistory) return [];

    const deltas: MemoryDelta[] = [];
    for (const version of overlayHistory) {
      if (version.version <= fromVersion) continue;
      if (version.version > toVersion) break;
      deltas.push(...version.deltas);
    }

    return deltas;
  }

  /**
   * Merge overlays from source avatar to target with conflict resolution
   */
  mergeOverlays(
    targetAvatarId: string,
    sourceAvatarId: string,
    overlayKey = 'default'
  ): { merged: number; conflicts: number } {
    const target = this.getState(targetAvatarId);
    const source = this.getState(sourceAvatarId);

    const sourceOverlay = source.overlays.get(overlayKey);
    if (!sourceOverlay) return { merged: 0, conflicts: 0 };

    let merged = 0;
    let conflicts = 0;

    // Get deltas newer than target's version
    const newDeltas = sourceOverlay
      .filter(v => v.version > target.currentVersion)
      .flatMap(v => v.deltas);

    for (const delta of newDeltas) {
      // Check for conflicts
      const currentValue = this.getValueAtPath(target.data, delta.path);
      const hasConflict = currentValue !== undefined && delta.op === 'set';

      if (hasConflict) {
        conflicts++;
        if (target.conflictResolution === 'latest') {
          // Latest wins
          this.applyDelta(target.data, delta);
          merged++;
        } else if (target.conflictResolution === 'merge' && delta.op === 'set') {
          // Deep merge for objects
          delta.op = 'merge';
          this.applyDelta(target.data, delta);
          merged++;
        }
        // 'priority' keeps target value, skip
      } else {
        this.applyDelta(target.data, delta);
        merged++;
      }
    }

    return { merged, conflicts };
  }

  private getValueAtPath(data: Record<string, unknown>, path: string[]): unknown {
    let current: unknown = data;
    for (const key of path) {
      if (typeof current !== 'object' || current === null) return undefined;
      current = (current as Record<string, unknown>)[key];
    }
    return current;
  }

  /**
   * Compact overlay history to reduce memory
   */
  private compactOverlay(avatarId: string, overlayKey: string): void {
    const state = this.getState(avatarId);
    const history = state.overlays.get(overlayKey);
    if (!history || history.length <= this.maxVersionHistory) return;

    // Keep last N versions, compact older ones into snapshot
    const keepCount = Math.floor(this.maxVersionHistory / 2);
    const toCompact = history.splice(0, history.length - keepCount);

    // Create compacted snapshot
    const compactedData: Record<string, unknown> = {};
    for (const version of toCompact) {
      for (const delta of version.deltas) {
        this.applyDelta(compactedData, delta);
      }
    }

    // Store as single compacted version
    const lastCompacted = toCompact[toCompact.length - 1];
    history.unshift({
      version: lastCompacted.version,
      timestamp: lastCompacted.timestamp,
      checksum: this.computeChecksum(compactedData),
      deltas: [{
        op: 'set',
        path: [],
        value: compactedData,
        timestamp: lastCompacted.timestamp,
        version: lastCompacted.version,
      }],
    });

    state.baseVersion = lastCompacted.version;
  }

  /**
   * Get current state for avatar
   */
  getCurrentState(avatarId: string): Record<string, unknown> {
    return { ...this.getState(avatarId).data };
  }

  /**
   * Get version info
   */
  getVersionInfo(avatarId: string): {
    baseVersion: number;
    currentVersion: number;
    overlayCount: number;
  } {
    const state = this.getState(avatarId);
    let overlayCount = 0;
    state.overlays.forEach(h => overlayCount += h.length);
    return {
      baseVersion: state.baseVersion,
      currentVersion: state.currentVersion,
      overlayCount,
    };
  }
}

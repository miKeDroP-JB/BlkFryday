/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   FRACTAL MEMORY - Shadow Learning System                                 ║
 * ║   "Teach without risk"                                                    ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Creates shadow memory forks for safe learning:
 * - Nothing touches prime memory until patterns prove stable
 * - Auto-review thresholds for pattern validation
 * - Gradual promotion from shadow to prime
 */

import { EventEmitter } from 'events';
import { locks } from '../../core/locks/index.js';

// Memory state
const memoryState = {
    prime: new Map(),        // Production memory
    shadow: new Map(),       // Shadow fork for learning
    pending: [],             // Patterns awaiting review
    promoted: [],            // Successfully promoted patterns
    rejected: [],            // Rejected patterns
    metrics: {
        ingested: 0,
        promoted: 0,
        rejected: 0,
        pendingReview: 0
    }
};

const memoryEvents = new EventEmitter();

// Review thresholds
const reviewThresholds = {
    auto: {
        minOccurrences: 5,       // Pattern must appear 5+ times
        minConfidence: 0.85,     // 85% confidence required
        maxVariance: 0.15,       // Max 15% variance
        stableForMs: 300000      // Stable for 5 minutes
    },
    strict: {
        minOccurrences: 10,
        minConfidence: 0.95,
        maxVariance: 0.05,
        stableForMs: 600000
    },
    relaxed: {
        minOccurrences: 3,
        minConfidence: 0.70,
        maxVariance: 0.25,
        stableForMs: 60000
    }
};

/**
 * Ingest data into shadow memory
 */
function ingest(source, data, options = {}) {
    const {
        mode = 'shadow',
        reviewThreshold = 'auto'
    } = options;

    // Check locks
    const writeCheck = locks.canWriteMemory('append');
    if (!writeCheck.allowed && mode !== 'shadow') {
        return {
            success: false,
            error: 'Memory writes blocked by safety locks',
            mode: writeCheck.mode
        };
    }

    const pattern = {
        id: `pat-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        source,
        data,
        mode,
        reviewThreshold,
        createdAt: Date.now(),
        occurrences: 1,
        confidence: 0.5,
        variance: 0,
        status: 'pending',
        lastSeen: Date.now()
    };

    // Check if similar pattern exists
    const existing = findSimilarPattern(data);

    if (existing) {
        // Update existing pattern
        existing.occurrences++;
        existing.lastSeen = Date.now();
        existing.confidence = calculateConfidence(existing);
        existing.variance = calculateVariance(existing);

        // Check if ready for review
        checkForPromotion(existing, reviewThreshold);

        memoryEvents.emit('pattern-updated', existing);

        return {
            success: true,
            action: 'updated',
            pattern: existing
        };
    }

    // Add new pattern to shadow
    memoryState.shadow.set(pattern.id, pattern);
    memoryState.pending.push(pattern.id);
    memoryState.metrics.ingested++;
    memoryState.metrics.pendingReview++;

    locks.logWrite(source, 'append', { patternId: pattern.id, size: JSON.stringify(data).length });

    memoryEvents.emit('pattern-created', pattern);

    return {
        success: true,
        action: 'created',
        pattern
    };
}

/**
 * Find similar pattern in shadow memory
 */
function findSimilarPattern(data) {
    const dataStr = JSON.stringify(data);
    const dataHash = simpleHash(dataStr);

    for (const [id, pattern] of memoryState.shadow) {
        const patternHash = simpleHash(JSON.stringify(pattern.data));
        if (dataHash === patternHash) {
            return pattern;
        }
        // Fuzzy matching for similar patterns
        if (similarity(dataStr, JSON.stringify(pattern.data)) > 0.85) {
            return pattern;
        }
    }

    return null;
}

/**
 * Simple hash function
 */
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash;
}

/**
 * Calculate string similarity (Jaccard)
 */
function similarity(str1, str2) {
    const set1 = new Set(str1.toLowerCase().split(/\s+/));
    const set2 = new Set(str2.toLowerCase().split(/\s+/));

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
}

/**
 * Calculate pattern confidence
 */
function calculateConfidence(pattern) {
    // More occurrences = higher confidence
    const occurrenceScore = Math.min(1, pattern.occurrences / 10);

    // Longer stability = higher confidence
    const stabilityMs = Date.now() - pattern.createdAt;
    const stabilityScore = Math.min(1, stabilityMs / 600000); // Max at 10 min

    // Combine scores
    return (occurrenceScore * 0.6 + stabilityScore * 0.4);
}

/**
 * Calculate pattern variance
 */
function calculateVariance(pattern) {
    // For now, variance decreases as occurrences increase
    return Math.max(0, 0.5 - (pattern.occurrences * 0.05));
}

/**
 * Check if pattern is ready for promotion
 */
function checkForPromotion(pattern, thresholdName = 'auto') {
    const threshold = reviewThresholds[thresholdName] || reviewThresholds.auto;

    const age = Date.now() - pattern.createdAt;

    if (
        pattern.occurrences >= threshold.minOccurrences &&
        pattern.confidence >= threshold.minConfidence &&
        pattern.variance <= threshold.maxVariance &&
        age >= threshold.stableForMs
    ) {
        pattern.status = 'ready-for-promotion';
        memoryEvents.emit('pattern-ready', pattern);
        return true;
    }

    return false;
}

/**
 * Promote pattern from shadow to prime memory
 */
function promote(patternId) {
    const pattern = memoryState.shadow.get(patternId);

    if (!pattern) {
        return { success: false, error: 'Pattern not found' };
    }

    if (pattern.status !== 'ready-for-promotion') {
        return { success: false, error: 'Pattern not ready for promotion' };
    }

    // Move to prime memory
    pattern.status = 'promoted';
    pattern.promotedAt = Date.now();
    memoryState.prime.set(patternId, pattern);
    memoryState.shadow.delete(patternId);

    // Update tracking
    memoryState.promoted.push(patternId);
    memoryState.pending = memoryState.pending.filter(id => id !== patternId);
    memoryState.metrics.promoted++;
    memoryState.metrics.pendingReview--;

    memoryEvents.emit('pattern-promoted', pattern);

    return { success: true, pattern };
}

/**
 * Reject a pattern
 */
function reject(patternId, reason = 'manual') {
    const pattern = memoryState.shadow.get(patternId);

    if (!pattern) {
        return { success: false, error: 'Pattern not found' };
    }

    pattern.status = 'rejected';
    pattern.rejectedAt = Date.now();
    pattern.rejectionReason = reason;

    memoryState.rejected.push({ id: patternId, reason, timestamp: Date.now() });
    memoryState.shadow.delete(patternId);
    memoryState.pending = memoryState.pending.filter(id => id !== patternId);
    memoryState.metrics.rejected++;
    memoryState.metrics.pendingReview--;

    memoryEvents.emit('pattern-rejected', pattern);

    return { success: true, pattern };
}

/**
 * Get memory status
 */
function getStatus() {
    return {
        prime: {
            size: memoryState.prime.size,
            patterns: Array.from(memoryState.prime.keys())
        },
        shadow: {
            size: memoryState.shadow.size,
            patterns: Array.from(memoryState.shadow.keys())
        },
        pending: memoryState.pending.length,
        metrics: { ...memoryState.metrics }
    };
}

/**
 * Get patterns pending review
 */
function getPendingPatterns() {
    return memoryState.pending.map(id => {
        const pattern = memoryState.shadow.get(id);
        return {
            id,
            source: pattern?.source,
            occurrences: pattern?.occurrences,
            confidence: pattern?.confidence,
            status: pattern?.status,
            age: Date.now() - (pattern?.createdAt || 0)
        };
    });
}

/**
 * Subscribe to memory events
 */
function subscribe(event, callback) {
    memoryEvents.on(event, callback);
    return () => memoryEvents.off(event, callback);
}

/**
 * Auto-promote ready patterns
 */
function autoPromote() {
    let promoted = 0;

    for (const patternId of memoryState.pending) {
        const pattern = memoryState.shadow.get(patternId);
        if (pattern && pattern.status === 'ready-for-promotion') {
            const result = promote(patternId);
            if (result.success) promoted++;
        }
    }

    return { promoted };
}

export const fractalMemory = {
    ingest,
    promote,
    reject,
    getStatus,
    getPendingPatterns,
    autoPromote,
    subscribe
};

export default fractalMemory;

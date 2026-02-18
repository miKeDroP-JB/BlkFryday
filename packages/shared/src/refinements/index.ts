/**
 * Refinement Sweep - Production Hardening
 *
 * Weak links addressed:
 * - LLM inference latency → async batch processing + GPU queue
 * - Pattern decay thresholds → auto-tune λ per user
 * - Cross-avatar memory → versioned overlay per avatar
 * - Edge KV cache → invalidation triggers on write
 * - Calibration engine → lightweight confidence scoring
 *
 * Automatic upgrades:
 * - Adaptive decay per pattern type (knowledge vs lexicon vs behavior)
 * - Confidence-weighted multi-LLM fusion for critical insights
 * - Event-driven Cloud Functions for immediate insight promotion/pruning
 * - Avatar memory overlay with selective delta patching
 */

export * from './gpu-queue';
export * from './pattern-decay';
export * from './avatar-memory';
export * from './edge-cache';
export * from './confidence-engine';
export * from './event-functions';

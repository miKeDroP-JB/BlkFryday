/**
 * Edge Preprocess Handler - Context preprocessor before core
 * Zero-wall handoff to Cloud Run
 */

import { Env } from '../index';
import { corsHeaders } from '../middleware/cors';

interface PreprocessRequest {
  message: string;
  session_id?: string;
  avatar?: string;
  include_context?: boolean;
  include_memory?: boolean;
}

interface PreprocessedPayload {
  message: string;
  user_id: string;
  session_id: string;
  avatar: string;
  edge_context: {
    operating_style: Record<string, unknown>;
    recent_topics: string[];
    emotional_state: string;
  } | null;
  hot_memory: unknown[] | null;
  edge_meta: {
    region: string;
    latency_ms: number;
    preprocessed_at: string;
  };
}

export async function handlePreprocess(
  request: Request,
  env: Env
): Promise<Response> {
  const startTime = Date.now();
  const userId = request.headers.get('X-User-ID')!;
  const edgeRegion = request.headers.get('X-Edge-Region') || 'unknown';

  const body = await request.json() as PreprocessRequest;

  // Parallel fetch context and memory if requested
  const [contextData, memoryData] = await Promise.all([
    body.include_context !== false
      ? fetchEdgeContext(userId, body.avatar || 'default', env)
      : Promise.resolve(null),
    body.include_memory !== false
      ? fetchHotMemory(userId, env)
      : Promise.resolve(null)
  ]);

  // Build preprocessed payload
  const preprocessed: PreprocessedPayload = {
    message: body.message,
    user_id: userId,
    session_id: body.session_id || crypto.randomUUID(),
    avatar: body.avatar || 'default',
    edge_context: contextData,
    hot_memory: memoryData,
    edge_meta: {
      region: edgeRegion,
      latency_ms: Date.now() - startTime,
      preprocessed_at: new Date().toISOString()
    }
  };

  // Forward to core with preprocessed context
  try {
    const coreResponse = await fetch(`${env.CORE_API_URL}/orchestrate/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': userId,
        'X-Edge-Preprocessed': 'true',
        'X-Edge-Region': edgeRegion
      },
      body: JSON.stringify(preprocessed)
    });

    if (coreResponse.ok) {
      const coreResult = await coreResponse.json();

      // Update hot memory cache with new data from core
      if ((coreResult as Record<string, unknown>).new_memories) {
        await updateHotMemoryCache(userId, (coreResult as Record<string, unknown>).new_memories as unknown[], env);
      }

      const totalLatencyMs = Date.now() - startTime;

      return new Response(JSON.stringify({
        ...coreResult,
        edge_meta: {
          ...preprocessed.edge_meta,
          total_latency_ms: totalLatencyMs,
          core_latency_ms: totalLatencyMs - preprocessed.edge_meta.latency_ms
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          'X-Edge-Latency': `${preprocessed.edge_meta.latency_ms}ms`,
          'X-Total-Latency': `${totalLatencyMs}ms`,
          ...corsHeaders
        }
      });
    }

    // Core error - return error response
    return new Response(JSON.stringify({
      error: 'Core processing failed',
      status: coreResponse.status,
      edge_preprocessed: preprocessed
    }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    // Core unreachable - return preprocessed only
    return new Response(JSON.stringify({
      error: 'Core unreachable',
      message: error instanceof Error ? error.message : 'Unknown error',
      edge_preprocessed: preprocessed,
      fallback_mode: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function fetchEdgeContext(
  userId: string,
  avatar: string,
  env: Env
): Promise<Record<string, unknown> | null> {
  const [contextStr, avatarStr] = await Promise.all([
    env.CONTEXT_CACHE.get(`context:${userId}`),
    env.AVATAR_STATE.get(`avatar:${userId}:${avatar}`)
  ]);

  if (!contextStr && !avatarStr) {
    return null;
  }

  const context = contextStr ? JSON.parse(contextStr) : {};
  const avatarState = avatarStr ? JSON.parse(avatarStr) : {};

  return {
    operating_style: avatarState.voice_config || {},
    recent_topics: context.recent_topics || [],
    emotional_state: context.emotional_state || 'neutral',
    avatar_filter: avatarState.filter_profile || null
  };
}

async function fetchHotMemory(userId: string, env: Env): Promise<unknown[] | null> {
  const indexStr = await env.MEMORY_HOT.get(`hot:${userId}:index`);
  if (!indexStr) return null;

  const index: string[] = JSON.parse(indexStr);
  const slicePromises = index.slice(0, 10).map(id =>
    env.MEMORY_HOT.get(`hot:${userId}:slice:${id}`)
  );

  const results = await Promise.all(slicePromises);
  return results
    .filter((s): s is string => s !== null)
    .map(s => JSON.parse(s));
}

async function updateHotMemoryCache(
  userId: string,
  newMemories: unknown[],
  env: Env
): Promise<void> {
  for (const memory of newMemories) {
    const memoryObj = memory as { slice_id: string; decay_index?: number };
    const sliceId = memoryObj.slice_id || crypto.randomUUID();
    const ttl = Math.max(60, Math.floor(300 * (memoryObj.decay_index || 1.0)));

    await env.MEMORY_HOT.put(
      `hot:${userId}:slice:${sliceId}`,
      JSON.stringify({ ...memoryObj, slice_id: sliceId }),
      { expirationTtl: ttl }
    );
  }
}

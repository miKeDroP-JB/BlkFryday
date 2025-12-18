/**
 * Edge Hot Memory Handler - Instant access to recent memory slices
 */

import { Env } from '../index';
import { corsHeaders } from '../middleware/cors';

interface HotMemorySlice {
  slice_id: string;
  user_id: string;
  type: 'conversation' | 'insight' | 'pattern' | 'resonance';
  content: unknown;
  relevance_score: number;
  decay_index: number;
  created_at: string;
  expires_at: string;
}

interface MemorySyncRequest {
  slices: HotMemorySlice[];
  force_refresh?: boolean;
}

export async function handleMemoryHot(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const userId = request.headers.get('X-User-ID');

  if (!userId) {
    return new Response(JSON.stringify({ error: 'User ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // GET /edge/memory/hot - get all hot memory
  if (request.method === 'GET' && url.pathname === '/edge/memory/hot') {
    return getHotMemory(userId, env);
  }

  // GET /edge/memory/hot/:slice_id - get specific slice
  if (request.method === 'GET' && url.pathname.includes('/edge/memory/hot/')) {
    const sliceId = url.pathname.split('/').pop()!;
    return getMemorySlice(userId, sliceId, env);
  }

  // POST /edge/memory/hot/sync - sync hot memory from core
  if (request.method === 'POST' && url.pathname.endsWith('/sync')) {
    const body = await request.json() as MemorySyncRequest;
    return syncHotMemory(userId, body, env);
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

async function getHotMemory(userId: string, env: Env): Promise<Response> {
  const startTime = Date.now();

  // Get hot memory index
  const indexKey = `hot:${userId}:index`;
  const indexStr = await env.MEMORY_HOT.get(indexKey);

  if (!indexStr) {
    return new Response(JSON.stringify({
      slices: [],
      meta: {
        latency_ms: Date.now() - startTime,
        count: 0,
        cache_status: 'empty'
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'EMPTY',
        ...corsHeaders
      }
    });
  }

  const index: string[] = JSON.parse(indexStr);

  // Parallel fetch all slices
  const slicePromises = index.map(sliceId =>
    env.MEMORY_HOT.get(`hot:${userId}:slice:${sliceId}`)
  );
  const sliceResults = await Promise.all(slicePromises);

  const slices: HotMemorySlice[] = sliceResults
    .filter((s): s is string => s !== null)
    .map(s => JSON.parse(s))
    .sort((a, b) => b.relevance_score - a.relevance_score);

  const latencyMs = Date.now() - startTime;

  return new Response(JSON.stringify({
    slices,
    meta: {
      latency_ms: latencyMs,
      count: slices.length,
      cache_status: 'hit'
    }
  }), {
    headers: {
      'Content-Type': 'application/json',
      'X-Cache': 'HIT',
      'X-Edge-Latency': `${latencyMs}ms`,
      ...corsHeaders
    }
  });
}

async function getMemorySlice(
  userId: string,
  sliceId: string,
  env: Env
): Promise<Response> {
  const startTime = Date.now();

  const sliceKey = `hot:${userId}:slice:${sliceId}`;
  const sliceStr = await env.MEMORY_HOT.get(sliceKey);

  if (!sliceStr) {
    return new Response(JSON.stringify({ error: 'Memory slice not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  const slice = JSON.parse(sliceStr);
  const latencyMs = Date.now() - startTime;

  return new Response(JSON.stringify({
    slice,
    meta: {
      latency_ms: latencyMs
    }
  }), {
    headers: {
      'Content-Type': 'application/json',
      'X-Edge-Latency': `${latencyMs}ms`,
      ...corsHeaders
    }
  });
}

async function syncHotMemory(
  userId: string,
  body: MemorySyncRequest,
  env: Env
): Promise<Response> {
  const startTime = Date.now();
  const { slices, force_refresh } = body;

  // Clear existing if force refresh
  if (force_refresh) {
    const indexStr = await env.MEMORY_HOT.get(`hot:${userId}:index`);
    if (indexStr) {
      const index: string[] = JSON.parse(indexStr);
      await Promise.all(index.map(id =>
        env.MEMORY_HOT.delete(`hot:${userId}:slice:${id}`)
      ));
    }
  }

  // Store new slices
  const sliceIds: string[] = [];
  const storePromises = slices.map(async slice => {
    const sliceKey = `hot:${userId}:slice:${slice.slice_id}`;

    // Calculate TTL based on decay
    const baseTtl = 300; // 5 minutes
    const ttl = Math.max(60, Math.floor(baseTtl * slice.decay_index));

    await env.MEMORY_HOT.put(sliceKey, JSON.stringify(slice), {
      expirationTtl: ttl
    });

    sliceIds.push(slice.slice_id);
  });

  await Promise.all(storePromises);

  // Update index
  await env.MEMORY_HOT.put(
    `hot:${userId}:index`,
    JSON.stringify(sliceIds),
    { expirationTtl: 300 }
  );

  const latencyMs = Date.now() - startTime;

  return new Response(JSON.stringify({
    success: true,
    synced_count: slices.length,
    slice_ids: sliceIds,
    meta: {
      latency_ms: latencyMs,
      force_refresh
    }
  }), {
    headers: {
      'Content-Type': 'application/json',
      'X-Edge-Latency': `${latencyMs}ms`,
      ...corsHeaders
    }
  });
}

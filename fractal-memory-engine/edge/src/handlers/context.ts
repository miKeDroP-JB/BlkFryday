/**
 * Edge Context Handler - Millisecond latency context hydration
 */

import { Env } from '../index';
import { corsHeaders } from '../middleware/cors';

interface ContextSlice {
  user_id: string;
  session_id: string;
  avatar: string;
  operating_style: Record<string, unknown>;
  recent_topics: string[];
  active_goals: string[];
  emotional_state: string;
  last_interaction: string;
  hydrated_at: string;
}

interface HydrateRequest {
  user_id: string;
  session_id?: string;
  avatar?: string;
  include_goals?: boolean;
  include_emotional?: boolean;
}

export async function handleContext(
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

  if (request.method === 'GET') {
    return getContext(userId, env);
  }

  if (request.method === 'POST' && url.pathname.endsWith('/hydrate')) {
    const body = await request.json() as HydrateRequest;
    return hydrateContext(userId, body, env);
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

async function getContext(userId: string, env: Env): Promise<Response> {
  const cacheKey = `context:${userId}`;

  // Try edge cache first
  const cached = await env.CONTEXT_CACHE.get(cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'HIT',
        'X-Edge-Latency': '< 1ms',
        ...corsHeaders
      }
    });
  }

  // Fetch from core and cache
  try {
    const response = await fetch(`${env.CORE_API_URL}/context/${userId}`);
    if (response.ok) {
      const context = await response.json();
      const contextStr = JSON.stringify(context);

      // Cache for 60 seconds
      await env.CONTEXT_CACHE.put(cacheKey, contextStr, { expirationTtl: 60 });

      return new Response(contextStr, {
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'MISS',
          ...corsHeaders
        }
      });
    }
  } catch (error) {
    console.error('Context fetch error:', error);
  }

  // Return empty context if core unavailable
  const emptyContext: ContextSlice = {
    user_id: userId,
    session_id: '',
    avatar: 'default',
    operating_style: {},
    recent_topics: [],
    active_goals: [],
    emotional_state: 'neutral',
    last_interaction: new Date().toISOString(),
    hydrated_at: new Date().toISOString()
  };

  return new Response(JSON.stringify(emptyContext), {
    headers: {
      'Content-Type': 'application/json',
      'X-Cache': 'EMPTY',
      ...corsHeaders
    }
  });
}

async function hydrateContext(
  userId: string,
  body: HydrateRequest,
  env: Env
): Promise<Response> {
  const startTime = Date.now();

  // Parallel fetch from multiple edge KV stores
  const [avatarState, hotMemory, contextCache] = await Promise.all([
    env.AVATAR_STATE.get(`avatar:${userId}:${body.avatar || 'default'}`),
    env.MEMORY_HOT.get(`hot:${userId}`),
    env.CONTEXT_CACHE.get(`context:${userId}`)
  ]);

  const hydratedContext: ContextSlice = {
    user_id: userId,
    session_id: body.session_id || crypto.randomUUID(),
    avatar: body.avatar || 'default',
    operating_style: avatarState ? JSON.parse(avatarState) : {},
    recent_topics: hotMemory ? JSON.parse(hotMemory).topics || [] : [],
    active_goals: body.include_goals && contextCache
      ? JSON.parse(contextCache).active_goals || []
      : [],
    emotional_state: contextCache
      ? JSON.parse(contextCache).emotional_state || 'neutral'
      : 'neutral',
    last_interaction: new Date().toISOString(),
    hydrated_at: new Date().toISOString()
  };

  const latencyMs = Date.now() - startTime;

  // Update cache
  await env.CONTEXT_CACHE.put(
    `context:${userId}`,
    JSON.stringify(hydratedContext),
    { expirationTtl: 60 }
  );

  return new Response(JSON.stringify({
    context: hydratedContext,
    meta: {
      latency_ms: latencyMs,
      cache_sources: {
        avatar: !!avatarState,
        memory: !!hotMemory,
        context: !!contextCache
      }
    }
  }), {
    headers: {
      'Content-Type': 'application/json',
      'X-Edge-Latency': `${latencyMs}ms`,
      ...corsHeaders
    }
  });
}

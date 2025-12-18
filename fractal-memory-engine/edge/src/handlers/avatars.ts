/**
 * Edge Avatar Handler - Lightning persona switching
 */

import { Env } from '../index';
import { corsHeaders } from '../middleware/cors';

interface AvatarState {
  id: string;
  name: string;
  type: string;
  filter_profile: {
    allowed_collections: string[];
    blocked_collections: string[];
    max_decay_index: number;
  };
  voice_config: {
    tone: string;
    formality: number;
    emoji_level: number;
  };
  last_active: string;
  session_count: number;
}

interface SwitchRequest {
  target_avatar: string;
  preserve_context?: boolean;
  handoff_data?: Record<string, unknown>;
}

const DEFAULT_AVATARS: Record<string, Partial<AvatarState>> = {
  default: {
    name: 'Default',
    type: 'general',
    filter_profile: {
      allowed_collections: ['*'],
      blocked_collections: [],
      max_decay_index: 0.3
    },
    voice_config: { tone: 'neutral', formality: 0.5, emoji_level: 0 }
  },
  business: {
    name: 'Business',
    type: 'business',
    filter_profile: {
      allowed_collections: ['operating_style', 'goals', 'artifacts', 'knowledge'],
      blocked_collections: ['narrative', 'rituals', 'play'],
      max_decay_index: 0.5
    },
    voice_config: { tone: 'professional', formality: 0.8, emoji_level: 0 }
  },
  creative: {
    name: 'Creative',
    type: 'creative',
    filter_profile: {
      allowed_collections: ['narrative', 'artifacts', 'knowledge', 'play'],
      blocked_collections: ['operating_style'],
      max_decay_index: 0.2
    },
    voice_config: { tone: 'playful', formality: 0.3, emoji_level: 0.5 }
  },
  builder: {
    name: 'Builder',
    type: 'builder',
    filter_profile: {
      allowed_collections: ['*'],
      blocked_collections: [],
      max_decay_index: 1.0
    },
    voice_config: { tone: 'technical', formality: 0.6, emoji_level: 0 }
  }
};

export async function handleAvatars(
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

  // GET /edge/avatars - list all avatars
  if (request.method === 'GET' && url.pathname === '/edge/avatars') {
    return listAvatars(userId, env);
  }

  // GET /edge/avatars/:active_avatar - get specific avatar
  if (request.method === 'GET' && url.pathname.includes('/edge/avatars/')) {
    const avatarId = url.pathname.split('/').pop()!;
    return getAvatar(userId, avatarId, env);
  }

  // POST /edge/avatars/switch - switch avatar
  if (request.method === 'POST' && url.pathname.endsWith('/switch')) {
    const body = await request.json() as SwitchRequest;
    return switchAvatar(userId, body, env);
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

async function listAvatars(userId: string, env: Env): Promise<Response> {
  const startTime = Date.now();

  // Get user's custom avatars from edge KV
  const customAvatarsStr = await env.AVATAR_STATE.get(`avatars:${userId}:list`);
  const customAvatars = customAvatarsStr ? JSON.parse(customAvatarsStr) : {};

  // Get current active avatar
  const activeStr = await env.AVATAR_STATE.get(`avatars:${userId}:active`);
  const active = activeStr || 'default';

  // Merge defaults with custom
  const allAvatars = { ...DEFAULT_AVATARS, ...customAvatars };

  const avatarList = Object.entries(allAvatars).map(([id, avatar]) => ({
    id,
    ...avatar,
    is_active: id === active
  }));

  return new Response(JSON.stringify({
    avatars: avatarList,
    active,
    meta: {
      latency_ms: Date.now() - startTime,
      count: avatarList.length
    }
  }), {
    headers: {
      'Content-Type': 'application/json',
      'X-Edge-Latency': `${Date.now() - startTime}ms`,
      ...corsHeaders
    }
  });
}

async function getAvatar(
  userId: string,
  avatarId: string,
  env: Env
): Promise<Response> {
  const startTime = Date.now();

  // Check edge cache first
  const cacheKey = `avatar:${userId}:${avatarId}`;
  const cached = await env.AVATAR_STATE.get(cacheKey);

  if (cached) {
    return new Response(cached, {
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'HIT',
        'X-Edge-Latency': `${Date.now() - startTime}ms`,
        ...corsHeaders
      }
    });
  }

  // Check defaults
  if (DEFAULT_AVATARS[avatarId]) {
    const avatar: AvatarState = {
      id: avatarId,
      ...DEFAULT_AVATARS[avatarId],
      last_active: new Date().toISOString(),
      session_count: 0
    } as AvatarState;

    return new Response(JSON.stringify(avatar), {
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'DEFAULT',
        'X-Edge-Latency': `${Date.now() - startTime}ms`,
        ...corsHeaders
      }
    });
  }

  return new Response(JSON.stringify({ error: 'Avatar not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

async function switchAvatar(
  userId: string,
  body: SwitchRequest,
  env: Env
): Promise<Response> {
  const startTime = Date.now();
  const { target_avatar, preserve_context, handoff_data } = body;

  // Validate target avatar exists
  const customAvatarsStr = await env.AVATAR_STATE.get(`avatars:${userId}:list`);
  const customAvatars = customAvatarsStr ? JSON.parse(customAvatarsStr) : {};
  const allAvatars = { ...DEFAULT_AVATARS, ...customAvatars };

  if (!allAvatars[target_avatar]) {
    return new Response(JSON.stringify({ error: 'Target avatar not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // Get previous avatar for handoff
  const previousActive = await env.AVATAR_STATE.get(`avatars:${userId}:active`);

  // Prepare context handoff if requested
  let contextHandoff = null;
  if (preserve_context && previousActive) {
    const prevContext = await env.CONTEXT_CACHE.get(`context:${userId}`);
    if (prevContext) {
      contextHandoff = {
        from_avatar: previousActive,
        preserved_topics: JSON.parse(prevContext).recent_topics || [],
        preserved_goals: JSON.parse(prevContext).active_goals || [],
        handoff_data: handoff_data || {}
      };
    }
  }

  // Update active avatar with TTL for hydration
  await env.AVATAR_STATE.put(
    `avatars:${userId}:active`,
    target_avatar,
    { expirationTtl: 3600 }
  );

  // Update avatar state
  const avatarState: AvatarState = {
    id: target_avatar,
    ...allAvatars[target_avatar],
    last_active: new Date().toISOString(),
    session_count: 1
  } as AvatarState;

  await env.AVATAR_STATE.put(
    `avatar:${userId}:${target_avatar}`,
    JSON.stringify(avatarState),
    { expirationTtl: 3600 }
  );

  // Invalidate context cache to force re-hydration
  await env.CONTEXT_CACHE.delete(`context:${userId}`);

  const latencyMs = Date.now() - startTime;

  return new Response(JSON.stringify({
    success: true,
    previous_avatar: previousActive || 'none',
    active_avatar: target_avatar,
    avatar_state: avatarState,
    context_handoff: contextHandoff,
    meta: {
      latency_ms: latencyMs,
      cache_invalidated: true
    }
  }), {
    headers: {
      'Content-Type': 'application/json',
      'X-Edge-Latency': `${latencyMs}ms`,
      ...corsHeaders
    }
  });
}

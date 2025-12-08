/**
 * PHASE 17: THE EDGE LAYER - "THE NODES"
 *
 * Ultra-low-latency context and persona routing at the global edge.
 * Zero-wall handoff to Cloud Run core.
 */

import { Router } from 'itty-router';
import { handleContext } from './handlers/context';
import { handleAvatars } from './handlers/avatars';
import { handleMemoryHot } from './handlers/memory';
import { handlePreprocess } from './handlers/preprocess';
import { TokenGuard } from './middleware/token-guard';
import { RateShaper } from './middleware/rate-shaper';
import { corsHeaders, handleOptions } from './middleware/cors';

export interface Env {
  MEMORY_HOT: KVNamespace;
  AVATAR_STATE: KVNamespace;
  CONTEXT_CACHE: KVNamespace;
  RATE_LIMIT: KVNamespace;
  ENVIRONMENT: string;
  CORE_API_URL: string;
}

const router = Router();

// CORS preflight
router.options('*', handleOptions);

// Health check
router.get('/health', () => new Response(JSON.stringify({
  status: 'healthy',
  layer: 'edge',
  codename: 'THE NODES',
  timestamp: new Date().toISOString()
}), {
  headers: { 'Content-Type': 'application/json', ...corsHeaders }
}));

// Edge Context - millisecond latency context hydration
router.get('/edge/context', handleContext);
router.post('/edge/context/hydrate', handleContext);

// Avatar endpoints - lightning persona switching
router.get('/edge/avatars', handleAvatars);
router.get('/edge/avatars/:active_avatar', handleAvatars);
router.post('/edge/avatars/switch', handleAvatars);

// Hot memory - instant access to recent memory slices
router.get('/edge/memory/hot', handleMemoryHot);
router.get('/edge/memory/hot/:slice_id', handleMemoryHot);
router.post('/edge/memory/hot/sync', handleMemoryHot);

// Preprocess - context preprocessor before core
router.post('/edge/preprocess', handlePreprocess);

// Catch-all - proxy to core
router.all('*', async (request: Request, env: Env) => {
  const url = new URL(request.url);
  const coreUrl = `${env.CORE_API_URL}${url.pathname}${url.search}`;

  return fetch(coreUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body
  });
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      // Token guard
      const tokenGuard = new TokenGuard(env);
      const tokenResult = await tokenGuard.validate(request);
      if (!tokenResult.valid) {
        return new Response(JSON.stringify({ error: 'Unauthorized', code: tokenResult.code }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Rate shaping
      const rateShaper = new RateShaper(env);
      const rateResult = await rateShaper.check(tokenResult.userId!);
      if (!rateResult.allowed) {
        return new Response(JSON.stringify({
          error: 'Rate limited',
          retry_after: rateResult.retryAfter
        }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(rateResult.retryAfter),
            ...corsHeaders
          }
        });
      }

      // Inject user context
      const enrichedRequest = new Request(request.url, {
        method: request.method,
        headers: new Headers({
          ...Object.fromEntries(request.headers),
          'X-User-ID': tokenResult.userId!,
          'X-Rate-Remaining': String(rateResult.remaining),
          'X-Edge-Region': request.cf?.colo as string || 'unknown'
        }),
        body: request.body
      });

      // Route
      return router.handle(enrichedRequest, env, ctx);
    } catch (error) {
      console.error('Edge error:', error);
      return new Response(JSON.stringify({
        error: 'Internal edge error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  },

  // Scheduled job for hot memory sync
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('Running scheduled edge sync:', event.cron);
    // Sync hot memory slices from core
    try {
      const response = await fetch(`${env.CORE_API_URL}/internal/memory/hot-export`);
      if (response.ok) {
        const hotSlices = await response.json() as Record<string, unknown>;
        for (const [key, value] of Object.entries(hotSlices)) {
          await env.MEMORY_HOT.put(key, JSON.stringify(value), { expirationTtl: 300 });
        }
      }
    } catch (error) {
      console.error('Hot memory sync failed:', error);
    }
  }
};

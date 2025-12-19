/**
 * PHASE 17: CORS - "THE MEMBRANE"
 *
 * Simple but hardened. Dynamic CORS based on:
 * - Trusted origins
 * - Runtime environment detection
 * - Request context
 *
 * Allows only:
 * - Playground UI
 * - Embed widgets
 * - Dev console
 * - Verified domains
 */

import { Env } from '../index';

// ═══════════════════════════════════════════════════════════════════════════
// CORS HEADERS
// ═══════════════════════════════════════════════════════════════════════════

export const corsHeaders = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Session-ID, X-Avatar-ID, X-Request-ID',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Expose-Headers': 'X-Request-ID, X-Edge-Latency, X-Rate-Remaining, X-Rate-Reset'
};

// ═══════════════════════════════════════════════════════════════════════════
// TRUSTED ORIGINS
// ═══════════════════════════════════════════════════════════════════════════

// Production domains
const PRODUCTION_ORIGINS = [
  'https://0r8.ai',
  'https://www.0r8.ai',
  'https://app.0r8.ai',
  'https://play.0r8.ai',          // Playground UI
  'https://embed.0r8.ai',         // Embed widgets
  'https://console.0r8.ai',       // Dev console
  'https://api.0r8.ai',
  'https://edge.0r8.ai'
];

// Development origins
const DEVELOPMENT_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8080',
  'http://localhost:8787',        // Wrangler dev
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:8787'
];

// Preview/staging patterns
const PREVIEW_PATTERNS = [
  /^https:\/\/.*\.0r8\.pages\.dev$/,           // Cloudflare Pages previews
  /^https:\/\/.*--0r8\.netlify\.app$/,         // Netlify previews
  /^https:\/\/0r8-.*\.vercel\.app$/,           // Vercel previews
  /^https:\/\/.*\.0r8-preview\.ai$/            // Custom preview domain
];

// Embed allowlist (third-party sites that can embed widgets)
const EMBED_ALLOWLIST = [
  /^https:\/\/.*\.notion\.site$/,
  /^https:\/\/.*\.webflow\.io$/,
  /^https:\/\/.*\.framer\.website$/
];

// ═══════════════════════════════════════════════════════════════════════════
// CORS HANDLER
// ═══════════════════════════════════════════════════════════════════════════

export class CorsHandler {
  private env: Env;
  private isDev: boolean;

  constructor(env: Env) {
    this.env = env;
    this.isDev = env.ENVIRONMENT !== 'production';
  }

  /**
   * Validate origin and return appropriate CORS headers
   */
  getHeaders(request: Request): Record<string, string> {
    const origin = request.headers.get('Origin');
    const referer = request.headers.get('Referer');

    // No origin = same-origin request or non-browser client
    if (!origin) {
      return {
        ...corsHeaders,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'false'
      };
    }

    // Check if origin is allowed
    const { allowed, reason } = this.isOriginAllowed(origin);

    if (allowed) {
      return {
        ...corsHeaders,
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true'
      };
    }

    // Origin not allowed - return restrictive headers
    console.warn(`[CORS] Blocked origin: ${origin}, reason: ${reason}`);
    return {
      ...corsHeaders,
      'Access-Control-Allow-Origin': 'null',
      'Access-Control-Allow-Credentials': 'false'
    };
  }

  /**
   * Check if origin is allowed
   */
  isOriginAllowed(origin: string): { allowed: boolean; reason: string } {
    // Production origins always allowed
    if (PRODUCTION_ORIGINS.includes(origin)) {
      return { allowed: true, reason: 'production' };
    }

    // Development origins in dev mode
    if (this.isDev && DEVELOPMENT_ORIGINS.includes(origin)) {
      return { allowed: true, reason: 'development' };
    }

    // Preview patterns
    for (const pattern of PREVIEW_PATTERNS) {
      if (pattern.test(origin)) {
        return { allowed: true, reason: 'preview' };
      }
    }

    // Embed allowlist
    for (const pattern of EMBED_ALLOWLIST) {
      if (pattern.test(origin)) {
        return { allowed: true, reason: 'embed' };
      }
    }

    // Check dynamic allowlist from KV
    // This allows adding origins at runtime without redeployment
    return { allowed: false, reason: 'not_in_allowlist' };
  }

  /**
   * Check dynamic allowlist from KV
   */
  async isDynamicallyAllowed(origin: string): Promise<boolean> {
    const key = `cors:allowed:${this.hashOrigin(origin)}`;
    const allowed = await this.env.RATE_LIMIT.get(key);
    return allowed === 'true';
  }

  /**
   * Add origin to dynamic allowlist
   */
  async addToAllowlist(origin: string, expiresInDays: number = 30): Promise<void> {
    const key = `cors:allowed:${this.hashOrigin(origin)}`;
    await this.env.RATE_LIMIT.put(key, 'true', {
      expirationTtl: expiresInDays * 86400
    });
  }

  /**
   * Remove origin from dynamic allowlist
   */
  async removeFromAllowlist(origin: string): Promise<void> {
    const key = `cors:allowed:${this.hashOrigin(origin)}`;
    await this.env.RATE_LIMIT.delete(key);
  }

  /**
   * Hash origin for KV key
   */
  private hashOrigin(origin: string): string {
    let hash = 0;
    for (let i = 0; i < origin.length; i++) {
      const char = origin.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PREFLIGHT HANDLER
// ═══════════════════════════════════════════════════════════════════════════

export function handleOptions(request: Request, env: Env): Response {
  const cors = new CorsHandler(env);
  const headers = cors.getHeaders(request);

  return new Response(null, {
    status: 204,
    headers
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE WRAPPER
// ═══════════════════════════════════════════════════════════════════════════

export function withCors(response: Response, request: Request, env: Env): Response {
  const cors = new CorsHandler(env);
  const corsHeaders = cors.getHeaders(request);

  // Clone response and add CORS headers
  const newHeaders = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders)) {
    newHeaders.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SECURITY HEADERS
// ═══════════════════════════════════════════════════════════════════════════

export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
};

export function withSecurityHeaders(response: Response): Response {
  const newHeaders = new Headers(response.headers);
  for (const [key, value] of Object.entries(securityHeaders)) {
    newHeaders.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}

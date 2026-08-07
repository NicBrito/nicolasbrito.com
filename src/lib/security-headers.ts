/**
 * Single source of truth for the HTTP security headers of this site.
 *
 * Deliberately runtime-agnostic — no imports, no `process.env` reads, no Node-only
 * APIs — so it can be consumed both by `next.config.ts` (Node config context) and by
 * the `src/proxy.ts` middleware (Edge runtime). Callers own the environment lookup
 * and pass it in via `isDev`.
 */

/** A single HTTP response header, shaped for the Next.js `headers()` config. */
export interface SecurityHeader {
  key: string;
  value: string;
}

// CSP notes for this app:
// - Next's App Router streams the RSC payload through inline <script> tags and
//   hydration scripts; since the site is statically generated there is no
//   per-request nonce, so script-src must allow 'unsafe-inline'.
// - Dev (Turbopack HMR) additionally evaluates code via eval() and opens a
//   WebSocket, so 'unsafe-eval' + ws:/wss: are permitted in development only.
// - Framer Motion writes inline `style` attributes, so style-src needs
//   'unsafe-inline' in every mode.
export function buildContentSecurityPolicy(isDev: boolean): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src 'self'${isDev ? ' ws: wss:' : ''}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    // Only force HTTPS upgrades in production; dev may run over plain http.
    ...(isDev ? [] : ['upgrade-insecure-requests']),
  ].join('; ');
}

/**
 * The complete header set that every response must carry — including the middleware
 * redirects, which bypass the `next.config.ts` `headers()` rules and would otherwise
 * ship bare, costing the domain its HSTS preload eligibility.
 */
export function buildSecurityHeaders(isDev: boolean): SecurityHeader[] {
  return [
    { key: 'Content-Security-Policy', value: buildContentSecurityPolicy(isDev) },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  ];
}

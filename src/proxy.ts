import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { buildSecurityHeaders } from '@/lib/security-headers';
import { routing } from './i18n/routing';

const isDev = process.env.NODE_ENV !== 'production';
const securityHeaders = buildSecurityHeaders(isDev);

const handleI18nRouting = createMiddleware(routing);

/**
 * Runs next-intl locale negotiation, then stamps the full security header set on the
 * response it produced. The `headers()` rules in `next.config.ts` never reach the
 * responses minted here, so both middleware outcomes — the 307 locale redirect
 * (`/` -> `/en`) and the locale rewrite — would otherwise ship without HSTS and be
 * rejected by the preload list.
 */
export default function proxy(request: NextRequest) {
  const response = handleI18nRouting(request);

  for (const { key, value } of securityHeaders) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  matcher: ['/', '/(pt|en)/:path*']
};

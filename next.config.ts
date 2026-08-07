import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
// Relative path: this config runs outside the bundler, so the `@/` alias is unavailable.
import { buildSecurityHeaders } from './src/lib/security-headers';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const isDev = process.env.NODE_ENV !== 'production';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: buildSecurityHeaders(isDev) }];
  },
};

export default withNextIntl(nextConfig);

import type { MetadataRoute } from 'next';

import { routing } from '@/i18n/routing';

const BASE_URL = 'https://nicolasbrito.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(
    routing.locales.map((locale) => [locale, `${BASE_URL}/${locale}`]),
  );

  return routing.locales.map((locale) => ({
    url: `${BASE_URL}/${locale}`,
    changeFrequency: 'monthly',
    priority: 1,
    alternates: { languages },
  }));
}

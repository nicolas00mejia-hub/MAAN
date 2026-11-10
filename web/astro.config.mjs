import { defineConfig } from 'astro/config';
import { site } from './src/config/site.ts';

export default defineConfig({
  site: site.url,
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: { prefixDefaultLocale: false },
  },
});

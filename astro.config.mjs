// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://certblueprint.com',
  trailingSlash: 'always',
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    sitemap({
      // Let Astro auto-discover all static routes.
      // Do NOT use customPages for pages that Astro already generates —
      // it can prevent proper auto-discovery and requires manual maintenance.
      filter: (page) => !page.endsWith('/404/'),
      changefreq: 'weekly',
      lastmod: new Date(),
      priority: 0.7,
    }),
  ],
  output: 'static',
});

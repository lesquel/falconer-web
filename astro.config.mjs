// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Canonical origin: canonical links, Open Graph URLs and the sitemap derive from it.
  site: 'https://falconer-web.vercel.app',
  build: {
    // The CSS is small once the fonts are trimmed: inlining it removes the render-blocking requests.
    inlineStylesheets: 'always',
  },
  vite: {
    build: {
      // Never inline scripts or fonts as data: URIs, so the CSP can stay at script-src/font-src 'self'.
      assetsInlineLimit: 0,
    },
  },
});

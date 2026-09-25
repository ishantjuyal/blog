// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.ishantjuyal.com',
  redirects: {
    '/lab': '/projects',
    '/lab/[slug]': '/projects/[slug]',
    '/writing': '/notes',
    '/writing/[...slug]': '/notes/[...slug]',
    '/resume': '/work',
  },
});

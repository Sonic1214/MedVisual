import { defineConfig } from 'astro/config';

// BASE_PATH lets the same code run at the domain root (Vercel) or in a
// sub-folder (for example GitHub Pages at /MedVisual/).
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});

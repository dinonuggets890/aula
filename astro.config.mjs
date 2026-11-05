// @ts-check
import { defineConfig } from 'astro/config';

// Statische Seite: `npm run build` erzeugt den Ordner dist/,
// der 1:1 auf den Webspace (z. B. Strato) hochgeladen wird.
export default defineConfig({
  site: 'https://schauspielgruppe-neusaess.de',
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
});

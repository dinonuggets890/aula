// @ts-check
import { defineConfig } from 'astro/config';

// Statische Seite: `npm run build` erzeugt den Ordner dist/.
//
// Adresse und Unterordner kommen beim Build aus Umgebungsvariablen:
//   SITE_URL   z. B. https://dinonuggets890.github.io  (GitHub Pages)
//   BASE_PATH  z. B. /aula                              (Unterordner bei GitHub Pages)
// Ohne Angaben gilt die eigene Domain ohne Unterordner (z. B. für Strato).
export default defineConfig({
  site: process.env.SITE_URL || 'https://schauspielgruppe-neusaess.de',
  base: process.env.BASE_PATH || '/',
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
});

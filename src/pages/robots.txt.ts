import type { APIRoute } from 'astro';
import { pfad, noindex } from '../lib/data';

// Im Prototyp-Modus (SGN_NOINDEX=1) nicht sperren: Suchmaschinen müssen die Seiten
// lesen dürfen, um das noindex-Tag zu sehen. Nur die Sitemap fällt weg.
export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nAllow: /\n${noindex ? '' : `\nSitemap: ${new URL(pfad('/sitemap.xml'), site)}\n`}`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });

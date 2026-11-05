import fs from 'node:fs';
import path from 'node:path';
import type { ImageMetadata } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import einstellungen from '../data/einstellungen.json';
import verein from '../data/verein.json';
import chronikRaw from '../data/chronik.json';
import fotosRaw from '../data/fotos.json';

export const site = einstellungen;
export const club = verein;

const TZ = 'Europe/Berlin';

/** Heutiges Datum (Europe/Berlin) als yyyy-mm-dd. Zum Testen per SGN_HEUTE überschreibbar. */
export function heuteISO(): string {
  if (process.env.SGN_HEUTE) return process.env.SGN_HEUTE;
  return new Intl.DateTimeFormat('sv-SE', { timeZone: TZ }).format(new Date());
}

const alsDatum = (iso: string) => new Date(`${iso}T12:00:00Z`);
const intl = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('de-DE', { timeZone: TZ, ...o });

export const fmt = {
  wochentag: (iso: string) => intl({ weekday: 'long' }).format(alsDatum(iso)),
  wochentagKurz: (iso: string) => intl({ weekday: 'short' }).format(alsDatum(iso)).replace('.', ''),
  tag: (iso: string) => iso.slice(8, 10),
  tagZahl: (iso: string) => String(Number(iso.slice(8, 10))),
  monat: (iso: string) => intl({ month: 'long' }).format(alsDatum(iso)),
  jahr: (iso: string) => iso.slice(0, 4),
  /** 20. März */
  tagMonat: (iso: string) => `${fmt.tagZahl(iso)}. ${fmt.monat(iso)}`,
  /** 20. März 2026 */
  mittel: (iso: string) => `${fmt.tagMonat(iso)} ${fmt.jahr(iso)}`,
  /** Freitag, 20. März 2026 */
  lang: (iso: string) => `${fmt.wochentag(iso)}, ${fmt.mittel(iso)}`,
  /** Fr, 20. März 2026 */
  langKurz: (iso: string) => `${fmt.wochentagKurz(iso)}, ${fmt.mittel(iso)}`,
};

export type Stueck = CollectionEntry<'stuecke'>;

export interface Termin {
  datum: string;
  uhrzeit: string;
  premiere: boolean;
  ausverkauft: boolean;
  vorbei: boolean;
  monat: string;
  href: string;
  extern: boolean;
}

/** Ticket-Link: Termin > Stück > allgemeiner Ticketshop > Kartenseite */
function ticketLink(termin: { ticket_url: string }, stueck: Stueck) {
  const url = termin.ticket_url || stueck.data.ticket_url || site.ticketshop_url;
  return { href: url || pfad('/karten/'), extern: /^https?:\/\//.test(url) };
}

export function termineVon(stueck: Stueck): Termin[] {
  const heute = heuteISO();
  return [...stueck.data.termine]
    .filter((t) => /^\d{4}-\d{2}-\d{2}$/.test(t.datum))
    .sort((a, b) => `${a.datum}${a.uhrzeit}`.localeCompare(`${b.datum}${b.uhrzeit}`))
    .map((t) => ({
      datum: t.datum,
      uhrzeit: t.uhrzeit || '19:30',
      premiere: t.premiere,
      ausverkauft: t.ausverkauft,
      vorbei: t.datum < heute,
      monat: fmt.monat(t.datum),
      ...ticketLink(t, stueck),
    }));
}

export async function getAktuellesStueck(): Promise<Stueck | null> {
  const alle = await getCollection('stuecke');
  const aktuell = alle
    .filter((s) => s.data.aktuell)
    .sort((a, b) => (termineVon(b)[0]?.datum ?? '').localeCompare(termineVon(a)[0]?.datum ?? ''));
  return aktuell[0] ?? null;
}

export interface ChronikEintrag {
  jahr: number;
  titel: string;
  art: 'abendfuellend' | 'klein' | 'hinweis';
  info: string;
  bild: string;
}

/** Chronik aus chronik.json, ergänzt um alle Stücke mit Terminen (ohne Doppelungen). */
export async function getChronik(): Promise<ChronikEintrag[]> {
  const norm = (e: any): ChronikEintrag => ({
    jahr: Number(e?.jahr) || 0,
    titel: String(e?.titel ?? '').trim(),
    art: ['abendfuellend', 'klein', 'hinweis'].includes(e?.art) ? e.art : 'abendfuellend',
    info: String(e?.info ?? '').trim(),
    bild: String(e?.bild ?? '').trim(),
  });
  const ausJson = (chronikRaw as any[]).map(norm).filter((e) => e.jahr && e.titel);
  const stuecke = await getCollection('stuecke');
  const ausStuecken = stuecke
    .filter((s) => termineVon(s).length)
    .map((s) =>
      norm({
        jahr: termineVon(s)[0].datum.slice(0, 4),
        titel: s.data.titel,
        art: s.data.art,
        info: [s.data.autor && `von ${s.data.autor}`, s.data.regie && `Regie: ${s.data.regie}`].filter(Boolean).join(' · '),
        bild: s.data.bild,
      }),
    );
  const key = (e: ChronikEintrag) => `${e.jahr}|${e.titel.toLowerCase()}`;
  const vorhanden = new Set(ausJson.map(key));
  return [...ausStuecken.filter((e) => !vorhanden.has(key(e))), ...ausJson].sort((a, b) => b.jahr - a.jahr);
}

export interface Foto {
  bild: string;
  titel: string;
  jahr: number | string;
}
export const fotos: Foto[] = (fotosRaw as any[]).filter((f) => f?.bild);

/** Bilder aus dem CMS liegen in src/assets/uploads und werden von Astro optimiert. */
const bilder = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/uploads/**/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP}',
  { eager: true },
);
export function bildMeta(url: string): ImageMetadata | null {
  if (!url) return null;
  const key = `/src/assets/uploads${url.replace(/^\/uploads/, '')}`;
  return bilder[key]?.default ?? bilder[decodeURI(key)]?.default ?? null;
}

/** Dateien (PDF, Video) aus public/: Link nur anzeigen, wenn die Datei existiert. */
export function dateiDa(url: string): boolean {
  if (!url) return false;
  if (/^https?:\/\//.test(url)) return true;
  return fs.existsSync(path.join(process.cwd(), 'public', decodeURI(url)));
}

export const mailto = `mailto:${site.email}`;

/** 2026-03-20 + 19:30 -> 2026-03-20T19:30:00+01:00 (Sommer-/Winterzeit berücksichtigt) */
export function isoMitZone(datum: string, uhrzeit: string): string {
  const [h = '19', m = '30'] = (uhrzeit || '19:30').split(':');
  const probe = new Date(`${datum}T${h.padStart(2, '0')}:${m.padStart(2, '0')}:00Z`);
  const teil = new Intl.DateTimeFormat('en-US', { timeZone: TZ, timeZoneName: 'shortOffset' })
    .formatToParts(probe)
    .find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+1';
  const off = Number(teil.replace('GMT', '') || '0');
  const zone = `${off >= 0 ? '+' : '-'}${String(Math.abs(off)).padStart(2, '0')}:00`;
  return `${datum}T${h.padStart(2, '0')}:${m.padStart(2, '0')}:00${zone}`;
}

/**
 * Interne Pfade (z. B. "/karten/", "/dateien/flyer.pdf") um den Basis-Pfad ergänzen.
 * Nötig, wenn die Seite in einem Unterordner läuft (GitHub Pages: /aula/).
 * Externe Links, mailto:, #Anker und leere Werte bleiben unverändert.
 */
export function pfad(url: string): string {
  if (!url || !url.startsWith('/') || url.startsWith('//')) return url;
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  if (base && (url === base || url.startsWith(`${base}/`))) return url;
  return `${base}${url}`;
}

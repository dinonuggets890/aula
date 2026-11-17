import fs from 'node:fs';
import path from 'node:path';
import type { ImageMetadata } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import einstellungen from '../data/einstellungen.json';
import verein from '../data/verein.json';
import chronikRaw from '../data/chronik.json';
import fotosRaw from '../data/fotos.json';
import jtRaw from '../data/junges-theater.json';

/* ---------- Einstellungen (Pages CMS: Website › Einstellungen) ---------- */
export interface Verweis { name: string; url: string; logo?: string }
type Einstellungen = typeof einstellungen & {
  telefon: string;
  kartentelefon: string;
  kartentelefon_zeiten: string;
  warteliste: string;
  anfahrt_oepnv: string;
  anfahrt_parken: string;
  anfahrt_barrierefrei: string;
  presse_text: string;
  presse_kontakt: string;
  presse_email: string;
  pressemappe: string;
  sponsoren: Verweis[];
  social: Verweis[];
};
const leer = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const verweise = (v: unknown): Verweis[] =>
  (Array.isArray(v) ? v : [])
    .map((x: any) => ({ name: leer(x?.name), url: leer(x?.url), logo: leer(x?.logo) }))
    .filter((x) => x.name || x.url);
export const site: Einstellungen = {
  ...einstellungen,
  telefon: leer((einstellungen as any).telefon),
  kartentelefon: leer((einstellungen as any).kartentelefon),
  kartentelefon_zeiten: leer((einstellungen as any).kartentelefon_zeiten),
  warteliste: leer((einstellungen as any).warteliste),
  anfahrt_oepnv: leer((einstellungen as any).anfahrt_oepnv),
  anfahrt_parken: leer((einstellungen as any).anfahrt_parken),
  anfahrt_barrierefrei: leer((einstellungen as any).anfahrt_barrierefrei),
  presse_text: leer((einstellungen as any).presse_text),
  presse_kontakt: leer((einstellungen as any).presse_kontakt),
  presse_email: leer((einstellungen as any).presse_email),
  pressemappe: leer((einstellungen as any).pressemappe),
  sponsoren: verweise((einstellungen as any).sponsoren),
  social: verweise((einstellungen as any).social),
};

/**
 * Staging: SGN_PLATZHALTER=1 zeigt leere Inhalte als markierte Lücken
 * („[Besetzung eintragen]“), damit man sieht, was noch fehlt.
 * Auf der Live-Seite fehlt der Schalter: leere Bereiche werden ausgeblendet.
 */
export const platzhalter = process.env.SGN_PLATZHALTER === '1';

/** Prototyp: SGN_NOINDEX=1 sperrt die Seite für Suchmaschinen (gesetzt im GitHub-Pages-Workflow). */
export const noindex = process.env.SGN_NOINDEX === '1';
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

export type Kartenstatus = 'verfuegbar' | 'wenige' | 'ausverkauft';
export const statusText: Record<Kartenstatus, string> = {
  verfuegbar: 'Karten verfügbar',
  wenige: 'Nur noch wenige Karten',
  ausverkauft: 'Ausverkauft',
};

export interface Termin {
  datum: string;
  uhrzeit: string;
  premiere: boolean;
  status: Kartenstatus;
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
    .map((t) => {
      const status: Kartenstatus = t.status ?? (t.ausverkauft ? 'ausverkauft' : 'verfuegbar');
      return {
      datum: t.datum,
      uhrzeit: t.uhrzeit || '19:30',
      premiere: t.premiere,
      status,
      ausverkauft: status === 'ausverkauft',
      vorbei: t.datum < heute,
      monat: fmt.monat(t.datum),
      ...ticketLink(t, stueck),
      };
    });
}

/** Warteliste bei ausverkauften Terminen: eigener Hinweis > Kartentelefon > E-Mail */
export function wartelisteLink(): { href: string; text: string } {
  if (site.warteliste) {
    if (/^https?:|^mailto:|^tel:/.test(site.warteliste)) return { href: site.warteliste, text: 'Warteliste' };
    if (/@/.test(site.warteliste)) return { href: `mailto:${site.warteliste}`, text: 'Warteliste' };
    if (/^[+\d][\d\s/()-]{5,}$/.test(site.warteliste)) return { href: tel(site.warteliste), text: 'Warteliste' };
  }
  if (site.kartentelefon) return { href: tel(site.kartentelefon), text: 'Warteliste' };
  return { href: `mailto:${site.email}?subject=${encodeURIComponent('Warteliste')}`, text: 'Warteliste' };
}

/** „0821 123 45 67“ -> „tel:+498211234567“ (deutsche Nummern ohne Ländervorwahl) */
export function tel(nummer: string): string {
  const roh = nummer.replace(/[^\d+]/g, '');
  if (roh.startsWith('+')) return `tel:${roh}`;
  if (roh.startsWith('00')) return `tel:+${roh.slice(2)}`;
  if (roh.startsWith('0')) return `tel:+49${roh.slice(1)}`;
  return `tel:${roh}`;
}

/** Preise eines Stücks als Text: „12 € · ermäßigt 8 €“ */
export function preisText(d: { preis: string; preis_ermaessigt: string }): string {
  const euro = (p: string) => (/€|eur/i.test(p) ? p : `${p} €`);
  return [d.preis && euro(d.preis), d.preis_ermaessigt && `ermäßigt ${euro(d.preis_ermaessigt)}`].filter(Boolean).join(' · ');
}
export const euro = (p: string) => (!p ? '' : /€|eur/i.test(p) ? p.replace(/\s*€\s*/, '') : p);

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
  fotograf: string;
}
export const fotos: Foto[] = (fotosRaw as any[])
  .filter((f) => f?.bild)
  .map((f) => ({ bild: f.bild, titel: leer(f.titel) || 'Ohne Titel', jahr: f.jahr ?? '', fotograf: leer(f.fotograf) }));

/** Fotoalbum gegliedert nach Stück und Jahr (neueste zuerst), mit Fotografen. */
export interface FotoGruppe { id: string; titel: string; jahr: number | string; fotos: Foto[]; fotografen: string[] }
export function fotoGruppen(): FotoGruppe[] {
  const gruppen: FotoGruppe[] = [];
  for (const f of fotos) {
    const id = `${f.jahr}-${f.titel}`.toLowerCase().normalize('NFKD').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');
    let g = gruppen.find((x) => x.id === id);
    if (!g) { g = { id, titel: f.titel, jahr: f.jahr, fotos: [], fotografen: [] }; gruppen.push(g); }
    g.fotos.push(f);
    if (f.fotograf && !g.fotografen.includes(f.fotograf)) g.fotografen.push(f.fotograf);
  }
  return gruppen.sort((a, b) => Number(b.jahr) - Number(a.jahr) || a.titel.localeCompare(b.titel, 'de'));
}

/* ---------- Junges Theater (Pages CMS: Verein › Junges Theater) ---------- */
const jtText = (k: string) => leer((jtRaw as any)[k]);
export const jt = {
  titel: jtText('titel'),
  titel_kursiv: jtText('titel_kursiv'),
  intro: jtText('intro'),
  aktuell_titel: jtText('aktuell_titel'),
  aktuell_text: jtText('aktuell_text'),
  aktuell_termine: jtText('aktuell_termine'),
  aktuell_bild: jtText('aktuell_bild'),
  altersgruppe: jtText('altersgruppe'),
  probenzeit: jtText('probenzeit'),
  probenort: jtText('probenort'),
  team: (Array.isArray((jtRaw as any).team) ? (jtRaw as any).team : [])
    .map((t: any) => ({ aufgabe: leer(t?.aufgabe), name: leer(t?.name) }))
    .filter((t: { aufgabe: string; name: string }) => t.aufgabe || t.name) as { aufgabe: string; name: string }[],
  mitmachen_text: jtText('mitmachen_text'),
  kontakt: jtText('kontakt'),
};

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

/** Alles, was mehrere Seiten über das aktuelle Stück wissen müssen (Bühne, Eckdaten, Ticketleiste). */
export async function getStueckInfo() {
  const heute = heuteISO();
  const stueck = await getAktuellesStueck();
  const d = stueck?.data ?? null;
  const termine = stueck ? termineVon(stueck) : [];
  const kommend = termine.filter((t) => !t.vorbei);
  const erste = termine[0];
  const letzte = termine.at(-1);
  const premiere = termine.find((t) => t.premiere) ?? erste;
  const naechste = kommend[0];
  const spielzeit = erste && letzte
    ? erste.datum === letzte.datum ? fmt.mittel(erste.datum) : `${fmt.tagMonat(erste.datum)} bis ${fmt.mittel(letzte.datum)}`
    : '';
  let hinweis = '';
  if (premiere && premiere.datum >= heute) hinweis = `Premiere am ${fmt.mittel(premiere.datum)}`;
  else if (naechste) hinweis = `Nächste Vorstellung am ${fmt.mittel(naechste.datum)}`;
  else if (letzte) hinweis = `Gespielt bis ${fmt.mittel(letzte.datum)}`;
  // Regie gehört immer ins Team, auch wenn sie dort nicht extra eingetragen ist
  const team = d
    ? [...(d.regie && !d.team.some((t) => /^regie$/i.test(t.aufgabe)) ? [{ aufgabe: 'Regie', name: d.regie }] : []), ...d.team]
    : [];
  return {
    heute, stueck, d, termine, kommend, erste, letzte, premiere, naechste, spielzeit, hinweis, team,
    preise: d ? preisText(d) : '',
    trailerDa: !!d && dateiDa(d.trailer),
    btsDa: !!d && dateiDa(d.behind_the_scenes),
    flyerDa: !!d && dateiDa(d.flyer),
    vorverkaufKommt: !!site.vorverkauf_ab && site.vorverkauf_ab > heute,
  };
}
export type StueckInfo = Awaited<ReturnType<typeof getStueckInfo>>;

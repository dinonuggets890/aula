import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Pages CMS schreibt leere Felder teils als "" oder null.
// Diese Helfer machen das Schema tolerant, damit der Build nicht bricht.
const text = z.string().nullish().transform((v) => (v ?? '').trim());
const flag = z.boolean().nullish().transform((v) => v ?? false);
/** Liste aus Pages CMS: leere Einträge (alle Felder leer) fliegen raus. */
const liste = <T extends z.ZodRawShape>(form: T) =>
  z
    .array(z.object(form))
    .nullish()
    .transform((v) => (v ?? []).filter((e) => Object.values(e).some((x) => x !== '' && x !== false)));
/** Bildliste (Pages CMS: type image, list: true) */
const bilderliste = z
  .array(z.string().nullish())
  .nullish()
  .transform((v) => (v ?? []).map((x) => (x ?? '').trim()).filter(Boolean));
/** verfügbar | wenige | ausverkauft (älteres Feld „ausverkauft“ bleibt gültig) */
const kartenstatus = z.enum(['verfuegbar', 'wenige', 'ausverkauft']).nullish();

const datum = z
  .union([z.string(), z.date()])
  .transform((v) => (typeof v === 'string' ? v.slice(0, 10) : v.toISOString().slice(0, 10)));

const stuecke = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/stuecke' }),
  schema: z.object({
    titel: z.string(),
    titel_zeile1: text,
    titel_zeile2: text,
    rahmen_text: text,
    autor: text,
    regie: text,
    genre: text,
    art: z.enum(['abendfuellend', 'klein']).nullish().transform((v) => v ?? 'abendfuellend'),
    aktuell: flag,
    kurztext: text,
    zitat: text,
    bild: text,
    trailer: text,
    trailer_poster: text,
    trailer_format: z.enum(['hoch', 'quer']).nullish().transform((v) => v ?? 'hoch'),
    behind_the_scenes: text,
    behind_the_scenes_text: text,
    flyer: text,
    ticket_url: text,
    spielplan_titel: text,
    termine: z
      .array(
        z.object({
          datum,
          uhrzeit: text,
          premiere: flag,
          status: kartenstatus,
          ausverkauft: flag,
          ticket_url: text,
        }),
      )
      .nullish()
      .transform((v) => v ?? []),
    // Besetzung und Team (Theaterzettel)
    besetzung: liste({ rolle: text, name: text }),
    team: liste({ aufgabe: text, name: text }),
    ensemble_bild: text,
    // Preise und Abendkasse
    preis: text,
    preis_ermaessigt: text,
    ermaessigt_fuer: text,
    abendkasse: text,
    // Hinter den Kulissen
    probenfotos: bilderliste,
    probenfotos_fotograf: text,
  }),
});

const seiten = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/seiten' }),
  schema: z.object({
    titel: z.string(),
  }),
});

export const collections = { stuecke, seiten };

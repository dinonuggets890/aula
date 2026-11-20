# Umzug nach WordPress

Die Website läuft derzeit als statische Astro-Seite mit Pages CMS. Sie ist so aufgebaut, dass sie sich später ohne Neugestaltung in ein WordPress-Theme übertragen lässt. Diese Datei beschreibt, was wohin gehört.

## Grundsätze, die schon jetzt gelten

- **Gleiche Adressen.** Die Seiten heißen so, wie sie in WordPress heißen sollen (`/aktuelles-stueck/`, `/junges-theater/`, `/verein/`, `/chronik/`, `/fotos/`, `/kontakt/`, `/karten/`, `/impressum/`, `/datenschutz/`). Beim Umzug sind keine Weiterleitungen nötig.
- **Inhalte als Felder, nicht als Freitext.** Alles, was die Seite anzeigt, kommt aus klar benannten Feldern (Termine, Besetzung, Preise …). Diese Felder werden in WordPress 1:1 zu Feldgruppen.
- **Komponenten = Template-Teile.** Jede Datei in `src/components/` entspricht einem Template-Teil (`template-parts/*.php`) bzw. einem Block-Pattern.
- **CSS ohne Framework.** `src/styles/global.css` ist reines CSS mit Variablen. Es kann als `style.css` des Themes übernommen werden. Klassennamen bleiben gleich.
- **JavaScript ohne Bibliotheken.** Die kleinen Skripte (Menü, Kopfzeile ein/aus, Vorhang/Trailer, Monatsfilter, Chronik-Filter, Unternavigation, Ticketleiste, `src/scripts/bewegung.ts`, `src/scripts/lightbox.ts`, `src/scripts/uebergang.ts`) sind reines JavaScript und laufen in WordPress unverändert. Das kleine Erkennungsskript aus dem `<head>` von `Base.astro` (setzt `bewegt`/`ruhig`/`sparsam` am `<html>`) gehört per `wp_head` ebenfalls in den Kopf, vor das Stylesheet.
- **Scroll-gebundene Animationen** stehen im CSS. Achtung beim Minifizieren: `animation-timeline` muss eine eigene Deklaration bleiben (siehe Kommentar in `global.css`).
- **Keine externen Dienste.** Schriften liegen lokal, keine Cookies, kein Tracking.

## Empfohlener Aufbau

Klassisches Theme (PHP-Templates) mit einem Feld-Plugin für strukturierte Inhalte, z. B. **Secure Custom Fields** oder **ACF**. So bleibt das Design fest, und der Verein füllt nur Felder aus, wie heute in Pages CMS.

```
theme/
  style.css                 ← src/styles/global.css
  functions.php             ← Schriften, Skripte, Menüs, Inhaltstypen, Optionsseiten
  header.php / footer.php   ← Header.astro / Footer.astro (+ Ticketleiste.astro)
  front-page.php            ← src/pages/index.astro
  page-aktuelles-stueck.php ← src/pages/aktuelles-stueck.astro
  page-junges-theater.php   ← src/pages/junges-theater.astro
  page-verein.php           ← src/pages/verein.astro
  page-fotos.php            ← src/pages/fotos.astro
  page-kontakt.php          ← src/pages/kontakt.astro
  page-karten.php           ← src/pages/karten.astro
  page-chronik.php          ← src/pages/chronik.astro
  page.php                  ← src/pages/[seite].astro (Impressum, Datenschutz)
  404.php                   ← src/pages/404.astro
  template-parts/
    buehne.php              ← StueckBuehne.astro (inkl. „Vorhang auf“-Trailer)
    termine.php             ← Termine.astro
    ticket.php              ← TicketKarte.astro
    theaterzettel.php       ← Theaterzettel.astro
    preise.php              ← Preise.astro
    akt.php                 ← Akt.astro
    mitmachen.php           ← Mitmachen.astro
    seitenkopf.php          ← Seitenkopf.astro
    unternav.php            ← Unternav.astro
    luecke.php              ← Luecke.astro (nur auf einer Staging-Instanz anzeigen)
  assets/fonts/             ← woff2-Dateien aus @fontsource (Playfair Display, Source Sans 3)
  assets/img/               ← public/img
```

## Inhalte: von Pages CMS nach WordPress

| Heute (Datei) | WordPress |
| --- | --- |
| `src/content/stuecke/*.md` | Inhaltstyp **Stück** (`stueck`). Titel = `titel`, Editor = Text unter dem Frontmatter, Beitragsbild = `bild` |
| Stück: `termine` (datum, uhrzeit, premiere, status, ticket_url) | Wiederholer-Feld **Termine** |
| Stück: `besetzung` (rolle, name), `team` (aufgabe, name) | Wiederholer-Felder **Besetzung** und **Team** |
| Stück: `preis`, `preis_ermaessigt`, `ermaessigt_fuer`, `abendkasse` | Feldgruppe **Preise und Abendkasse** |
| Stück: `aktuell`, `titel_zeile1/2`, `rahmen_text`, `autor`, `regie`, `genre`, `art`, `kurztext`, `zitat`, `trailer`, `trailer_poster`, `trailer_format`, `behind_the_scenes(_text)`, `flyer`, `ensemble_bild`, `probenfotos(_fotograf)`, `spielplan_titel`, `ticket_url` | Feldgruppe **Stück** (gleiche Feldnamen) |
| `src/data/chronik.json` | Entweder eigener Inhaltstyp **Chronik** (jahr, titel, art, info, bild) oder Stücke ohne Termine mit Feld `jahr`. Die Zusammenführung („Stücke mit Terminen erscheinen automatisch in der Chronik“) steht in `getChronik()` in `src/lib/data.ts` |
| `src/data/fotos.json` | Mediathek: je Bild Felder **Stück**, **Jahr** und **Fotograf**; oder ein Galerie-Feld am Stück |
| `src/data/einstellungen.json` | Optionsseite **Website-Einstellungen** (gleiche Feldnamen; Sponsoren und Social Media als Wiederholer) |
| `src/data/verein.json` | Felder an der Seite **Verein** (oder Optionsseite) |
| `src/data/junges-theater.json` | Felder an der Seite **Junges Theater** |
| `src/content/seiten/*.md` | Normale Seiten **Impressum** und **Datenschutz** |
| `src/lib/navigation.ts` | Menü **Hauptnavigation** (Unterpunkte als Anker-Links, z. B. `/aktuelles-stueck/#besetzung`) |
| `src/assets/uploads/`, `public/dateien/` | Mediathek |

## Logik, die nach PHP wandert

Alles steht in `src/lib/data.ts` und ist bewusst klein gehalten:

- `getAktuellesStueck()`: Stück mit „Aktuelles Stück“; bei mehreren das mit dem spätesten ersten Termin.
- `termineVon()`: Termine sortieren, vergangene markieren (Zeitzone Europe/Berlin), Kartenstatus, Ticket-Link (Termin › Stück › Ticketshop › Kartenseite).
- `wartelisteLink()`, `tel()`, `preisText()`: Warteliste, antippbare Telefonnummern, Preisangabe.
- `getStueckInfo()`: nächste Vorstellung, Spielzeit, Hinweiszeile der Bühne, Team inkl. Regie.
- `fotoGruppen()`: Fotoalbum nach Stück und Jahr.
- `isoMitZone()` + JSON-LD auf der Startseite: strukturierte Daten `TheaterEvent` für Google.

Entfällt in WordPress:

- `pfad()` (Unterordner für GitHub Pages) → `home_url()`.
- Der nächtliche Neubau (vergangene Termine ausblenden): WordPress rechnet bei jedem Aufruf.
- `dateiDa()` (Datei vorhanden?) → prüfen, ob das Medienfeld gefüllt ist.
- Bildoptimierung durch Astro → WordPress-Bildgrößen (`srcset`) bzw. ein Plugin für AVIF/WebP.

## Designsystem als `theme.json`

Falls ein Block-Theme gewünscht ist oder der Block-Editor die Farben kennen soll:

```json
{
  "$schema": "https://schemas.wp.org/trunk/theme.json",
  "version": 3,
  "settings": {
    "color": {
      "custom": false,
      "palette": [
        { "slug": "logo-rot", "name": "Logo-Rot", "color": "#B01F2D" },
        { "slug": "weiss", "name": "Weiß", "color": "#FFFFFF" },
        { "slug": "creme", "name": "Creme", "color": "#F7F3EC" },
        { "slug": "anthrazit", "name": "Anthrazit", "color": "#2B2320" },
        { "slug": "steingrau", "name": "Steingrau", "color": "#5A5049" },
        { "slug": "dunkelrot", "name": "Dunkelrot", "color": "#7F1722" }
      ]
    },
    "typography": {
      "fontFamilies": [
        { "slug": "display", "name": "Playfair Display", "fontFamily": "'Playfair Display Variable', Georgia, serif",
          "fontFace": [
            { "fontFamily": "Playfair Display Variable", "fontWeight": "400 900", "fontStyle": "normal", "src": ["file:./assets/fonts/playfair-display-latin-wght-normal.woff2"] },
            { "fontFamily": "Playfair Display Variable", "fontWeight": "400 900", "fontStyle": "italic", "src": ["file:./assets/fonts/playfair-display-latin-wght-italic.woff2"] }
          ] },
        { "slug": "text", "name": "Source Sans 3", "fontFamily": "'Source Sans 3 Variable', 'Helvetica Neue', Arial, sans-serif",
          "fontFace": [
            { "fontFamily": "Source Sans 3 Variable", "fontWeight": "200 900", "fontStyle": "normal", "src": ["file:./assets/fonts/source-sans-3-latin-wght-normal.woff2"] }
          ] }
      ]
    }
  },
  "styles": {
    "color": { "background": "var(--wp--preset--color--creme)", "text": "var(--wp--preset--color--anthrazit)" },
    "typography": { "fontFamily": "var(--wp--preset--font-family--text)", "fontSize": "18px", "lineHeight": "1.55" }
  }
}
```

Die CSS-Variablen in `global.css` (`--rot`, `--creme`, `--tinte`, `--muted`, `--rot-dunkel`, `--f-display`, `--f-sans`) können dann auf die WordPress-Variablen zeigen, z. B. `--rot: var(--wp--preset--color--logo-rot);`.

## Beim Umzug prüfen

- **Datenschutzerklärung:** WordPress setzt je nach Plugins Cookies (Login, Kommentare). Kommentare abschalten, keine Plugins mit externen Diensten (Google Fonts, Analytics, eingebettete Karten).
- **Hosting:** WordPress läuft auf dem Strato-Webspace (PHP + MySQL). Der SFTP-Workflow `strato.yml` entfällt dann.
- **Staging:** Für die Abnahme durch den Verein eine Staging-Instanz (z. B. Subdomain mit Passwortschutz) einrichten; dort `luecke.php` anzeigen, auf der Live-Seite nicht.
- **Rollen:** Vereinsmitglieder als „Redakteur“, nicht als Administrator.

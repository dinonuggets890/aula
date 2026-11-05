# Website Schauspielgruppe Neusäß e.V.

Statische Website mit [Astro](https://astro.build), Inhaltspflege über [Pages CMS](https://pagescms.org) und Veröffentlichung auf GitHub Pages (später optional Strato).

```
Pages CMS ──speichert──> GitHub-Repo (main) ──GitHub Action──> npm run build ──> GitHub Pages
```

Adresse vorerst: https://dinonuggets890.github.io/aula/

## Lokal starten

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # fertige Seite in dist/
```

Zum Testen mit anderem „Heute“-Datum (z. B. um Termine als kommend zu sehen):

```bash
SGN_HEUTE=2026-02-10 npm run dev
```

## Wo welche Inhalte liegen

| Inhalt | Datei | In Pages CMS |
| --- | --- | --- |
| Stücke mit Terminen, Trailer, Flyer | `src/content/stuecke/*.md` | Programm › Stücke |
| Über uns, Zahlen, Mitmachen, Junges Theater | `src/data/verein.json` | Verein › Über uns und Mitmachen |
| Chronik (alle Produktionen seit 1977) | `src/data/chronik.json` | Verein › Chronik |
| Fotoalbum | `src/data/fotos.json` | Verein › Fotoalbum |
| Kontakt, Spielort, Vorverkauf, Ticketshop | `src/data/einstellungen.json` | Website › Einstellungen |
| Impressum, Datenschutz | `src/content/seiten/*.md` | Website › Impressum und Datenschutz |
| Bilder (werden automatisch verkleinert) | `src/assets/uploads/` | Medien › Bilder |
| PDFs und Videos | `public/dateien/` | Medien › Dateien |

Automatik:

- Das Stück mit **„Aktuelles Stück“** steht oben auf der Startseite.
- Vergangene Termine werden ausgeblendet. Sind alle vorbei, zeigt der Spielplan einen Hinweis. Die Seite baut sich dafür jede Nacht neu.
- Jedes Stück mit Terminen erscheint automatisch in der Chronik.
- Buttons für Flyer, Trailer oder Mitgliedsantrag erscheinen erst, wenn die Datei hochgeladen ist.
- **Bühnenflächen** (Einstellungen): „Dunkel“ oder „Cremefarben“ für Startbereich und Spielplan.

## Einrichtung

### 1. GitHub Pages

1. Projekt auf den Branch `main` pushen.
2. *Settings › Pages › Build and deployment › Source* auf **GitHub Actions** stellen.
   (Mit kostenlosem GitHub-Konto muss das Repository dafür öffentlich sein.)
3. Jeder Push auf `main` (auch jede Speicherung in Pages CMS) startet *Actions › Website veröffentlichen (GitHub Pages)*. Zusätzlich baut sich die Seite jede Nacht neu. Manuell starten geht dort über *Run workflow*.

Die Seite liegt dann im Unterordner `/aula/`. Adresse und Unterordner setzt der Workflow automatisch (`SITE_URL`, `BASE_PATH`). Interne Links im Code immer mit `pfad('/…')` aus `src/lib/data.ts` schreiben, sonst fehlt der Unterordner.

Eigene Domain später: unter *Settings › Pages › Custom domain* eintragen, dann fällt der Unterordner automatisch weg.

### 2. Später: Umzug zu Strato (optional)

Der Workflow `.github/workflows/strato.yml` ist vorbereitet, läuft aber nur manuell. Für den Umzug:

1. Unter *Settings › Secrets and variables › Actions* vier Secrets anlegen: `STRATO_SFTP_HOST` (z. B. `5012345.ssh.w1.strato.hosting`), `STRATO_SFTP_USER`, `STRATO_SFTP_PASSWORD`, `STRATO_SFTP_PATH` (Zielordner, z. B. `/schauspielgruppe`).
2. Im Strato-Kundenlogin einen **SFTP-Zugang** anlegen (ab Paket „Hosting Starter“) und einen **eigenen, leeren Ordner** für die Website, auf den die Domain zeigt.
   **Wichtig:** Der Upload spiegelt `dist/` und löscht im Zielordner alles, was nicht dazugehört.
3. SSL aktivieren. Die `.htaccess` leitet auf HTTPS um und alte WordPress-Adressen auf die neuen Seiten (wirkt nur bei Strato, nicht bei GitHub Pages).
4. In `strato.yml` die Auslöser unter `on:` wieder einkommentieren und `pages.yml` löschen.

### 3. Pages CMS

1. [app.pagescms.org](https://app.pagescms.org) öffnen, mit GitHub anmelden, die Pages-CMS-App für das Repository freigeben und das Repository auswählen. Die Konfiguration steht in `.pages.yml`.
2. Die Vereinsmitglieder als *Collaborators* per E-Mail einladen. Sie melden sich per E-Mail-Link an und brauchen kein GitHub-Konto.

## Vor dem Livegang

- [ ] Dateien aus dem alten WordPress herunterladen und nach `public/dateien/` legen (Namen beibehalten):
  - `wp-content/uploads/2026/01/Video-Die-12-Geschworenen-1.mp4`
  - `wp-content/uploads/2026/02/behind-the-scenes-Proben.mp4`
  - `wp-content/uploads/2026/01/Flyer_12-Geschworenen_Druck-2.pdf`
  - `wp-content/uploads/2020/10/SGN_Mitgliedsantrag_2019.05.pdf`
  - `wp-content/uploads/2018/05/SGN_Nachtrag-I_zur-Satzung.pdf`
- [ ] Fotos in besserer Auflösung übernehmen (die aktuellen Archivfotos sind nur Vorschaubilder mit 240 × 160 px).
- [ ] Ticketshop eintragen (Einstellungen › Link zum Ticketshop), sobald klar ist, welcher Anbieter genutzt wird.
- [ ] Eintrittspreise eintragen (Einstellungen › Eintrittspreise).
- [ ] **Datenschutzerklärung prüfen lassen.** Sie ist ein Entwurf für die neue Seite (kein Google Analytics mehr, keine Cookies). Hosting-Angabe anpassen: vorerst GitHub Pages (GitHub Inc., USA), später ggf. Strato.
- [ ] Impressum prüfen. Der Verweis auf den alten § 55 RStV wurde auf § 18 Abs. 2 MStV aktualisiert.

## Technik

- Astro 7, komplett statisch, kein Server-Code, keine Datenbank.
- Schriften lokal eingebunden (Archivo, Instrument Serif), keine externen Dienste, keine Cookies.
- Bilder werden beim Build als AVIF/WebP in passenden Größen erzeugt.
- Videos werden direkt vom eigenen Server geladen (Dateien möglichst unter 50 MB halten).
- Strukturierte Daten (schema.org `TheaterEvent`) für kommende Vorstellungen, Sitemap unter `/sitemap.xml`.

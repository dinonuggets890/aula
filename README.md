# Website Schauspielgruppe Neusäß e.V.

Statische Website mit [Astro](https://astro.build), Inhaltspflege über [Pages CMS](https://pagescms.org), Staging-Seite auf GitHub Pages und (nach dem Launch) Live-Seite auf Strato.

```
Pages CMS ──speichert──> Branch „staging“ ──> Staging auf GitHub Pages (Link für den Verein)
                                │
             Actions › „Staging freigeben“
                                │
                                v
                         Branch „main“ ──> Live-Seite auf Strato (nach dem Launch)
```

Staging: https://dinonuggets890.github.io/aula/

## Staging und Freigabe

| Branch | Bedeutung | Wird veröffentlicht auf |
| --- | --- | --- |
| `staging` | Arbeitsstand. Hier speichert Pages CMS. | GitHub Pages (Staging-Link), 1–2 Minuten nach jeder Änderung |
| `main` | Freigegebener Stand | Strato (sobald eingerichtet) |

1. In Pages CMS oben den Branch **`staging`** auswählen und Inhalte bearbeiten.
2. Den Staging-Link an den Verein schicken. Er ist öffentlich erreichbar (wer den Link hat, kann ihn öffnen), steht aber nicht bei Google (`noindex`).
3. Passt alles: auf GitHub *Actions › Staging freigeben › Run workflow* (Branch egal) klicken. Der Stand von `staging` wird nach `main` übernommen.
   Alternativ geht auch ein Pull Request `staging → main`, dann sieht man vorher genau, was sich ändert.

Hinweise:

- Nicht direkt auf `main` bearbeiten. Sonst bricht die Freigabe mit einer Meldung ab, statt etwas zu überschreiben. Lösung: Pull Request `main → staging` mergen, dann erneut freigeben.
- Änderungen an den Workflows (`.github/workflows/`) kann der Freigabe-Knopf aus Sicherheitsgründen nicht übernehmen (GitHub erlaubt das dem automatischen Token nicht). Solche Änderungen per Pull Request nach `main` bringen.

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

## Seitenstruktur

Höchstens zwei Ebenen: Jeder Menüpunkt ist eine Seite, die Unterpunkte sind Abschnitte darauf (Sprungleiste unter dem Seitenkopf). Definiert in `src/lib/navigation.ts`.

| Seite | Adresse | Abschnitte |
| --- | --- | --- |
| Startseite | `/` | Bühne mit Stück, Tickets und Trailer · Eckdaten · Termine · Programmheft in drei Akten (Ensemble, Junges Theater, Archiv) · Hinter den Kulissen und Fotos · Mitmachen |
| Aktuelles Stück | `/aktuelles-stueck/` | Handlung und Trailer · Besetzung und Team · Termine und Karten · Preise und Abendkasse |
| Junges Theater | `/junges-theater/` | Aktuelles Stück des JT · Team und Proben · Mitmachen · Bisher gespielt |
| Verein | `/verein/` | Wir über uns · Mitmachen und Mitgliedschaft · Frühere Aufführungen (→ `/chronik/`) |
| Fotos | `/fotos/` | Fotoalbum nach Stück und Jahr, mit Fotografen |
| Kontakt | `/kontakt/` | E-Mail und Telefon · Anfahrt · Presse · Sponsoren |
| Tickets | `/karten/` | Vorstellungen und Ticketshop |

Fußzeile auf jeder Seite: Kontaktdaten, Seiten, Social Media, Impressum und Datenschutz.
Auf dem Smartphone erscheint unten ein angehefteter Ticket-Button, sobald man an den Ticket-Buttons der Bühne vorbeigescrollt ist (nur wenn es kommende Vorstellungen gibt).

## Wo welche Inhalte liegen

| Inhalt | Datei | In Pages CMS |
| --- | --- | --- |
| Stücke: Termine mit Kartenstatus, Besetzung, Team, Preise, Abendkasse, Trailer, Probenfotos, Flyer | `src/content/stuecke/*.md` | Programm › Stücke |
| Über uns, Zahlen, Mitmachen | `src/data/verein.json` | Verein › Über uns und Mitmachen |
| Junges Theater: aktuelles Stück, Probenplan, Team | `src/data/junges-theater.json` | Verein › Junges Theater |
| Chronik (alle Produktionen seit 1977) | `src/data/chronik.json` | Verein › Chronik |
| Fotoalbum (mit Fotograf je Foto) | `src/data/fotos.json` | Verein › Fotoalbum |
| Kontakt, Telefon, Kartentelefon, Warteliste, Spielort, Anfahrt, Presse, Sponsoren, Social Media, Ticketshop | `src/data/einstellungen.json` | Website › Einstellungen |
| Impressum, Datenschutz | `src/content/seiten/*.md` | Website › Impressum und Datenschutz |
| Bilder (werden automatisch verkleinert) | `src/assets/uploads/` | Medien › Bilder |
| PDFs und Videos | `public/dateien/` | Medien › Dateien |

Automatik:

- Das Stück mit **„Aktuelles Stück“** steht auf der Startseite und auf `/aktuelles-stueck/`.
- **Kartenstatus je Termin:** „Karten verfügbar“, „Nur noch wenige Karten“ oder „Ausverkauft“. Bei ausverkauften Terminen erscheint statt „Karten kaufen“ die Warteliste (Einstellung „Warteliste“, sonst Kartentelefon, sonst E-Mail).
- Vergangene Termine werden ausgeblendet. Sind alle vorbei, zeigt der Terminbereich einen Hinweis. Die Seite baut sich dafür jede Nacht neu.
- Jedes Stück mit Terminen erscheint automatisch in der Chronik. Kleine Stücke aus der Chronik erscheinen auf der Seite „Junges Theater“ unter „Bisher gespielt“.
- Regie wird automatisch ins Team des Theaterzettels übernommen.
- Buttons für Flyer, Trailer, Pressemappe oder Mitgliedsantrag erscheinen erst, wenn die Datei hochgeladen ist.
- **Trailer:** „Trailer ansehen“ öffnet einen Vorhang auf der Bühne, das Video spielt direkt auf der Seite.
- Telefonnummern sind auf dem Handy antippbar.
- **Bühnenflächen** (Einstellungen): „Dunkel“ oder „Cremefarben“ für die Bühne oben.

### Platzhalter auf Staging

Auf der Staging-Seite (GitHub Pages) erscheinen fehlende Inhalte als gestrichelte Kästchen, z. B. `[Kartentelefon eintragen]`, `[Rolle] … [Name]` oder `[Trailer-Datei fehlt: …]`. So sieht man, was noch nachgetragen werden muss. Auf der Live-Seite (Strato) sind diese Kästchen nie zu sehen: Leere Bereiche werden dort ausgeblendet oder zeigen einen neutralen Text. Gesteuert über `SGN_PLATZHALTER=1` im Staging-Workflow.

Lokal mit Platzhaltern ansehen:

```bash
SGN_PLATZHALTER=1 npm run dev
```

## Später WordPress

Die Seite ist so gebaut, dass sie sich in ein WordPress-Theme übertragen lässt: gleiche Adressen, gleiche Inhaltsfelder, Komponenten als Template-Teile, CSS ohne Framework. Details in [`WORDPRESS.md`](WORDPRESS.md).

## Einrichtung

### 1. GitHub Pages (Staging)

1. *Settings › Pages › Build and deployment › Source* auf **GitHub Actions** stellen.
   (Mit kostenlosem GitHub-Konto muss das Repository dafür öffentlich sein.)
2. *Settings › Environments › github-pages › Deployment branches and tags*: **`staging`** und `main` erlauben.
3. Jeder Push auf `staging` (auch jede Speicherung in Pages CMS) startet *Actions › Staging veröffentlichen (GitHub Pages)*. Zusätzlich baut sich die Staging-Seite jede Nacht neu. Manuell starten geht dort über *Run workflow*.

Die Staging-Seite liegt im Unterordner `/aula/`. Adresse und Unterordner setzt der Workflow automatisch (`SITE_URL`, `BASE_PATH`). Interne Links im Code immer mit `pfad('/…')` aus `src/lib/data.ts` schreiben, sonst fehlt der Unterordner.

### 2. Strato (Live-Seite)

Der Workflow `.github/workflows/strato.yml` ist vorbereitet, läuft aber nur manuell. Für den Launch:

1. Unter *Settings › Secrets and variables › Actions › Secrets* vier Secrets anlegen: `STRATO_SFTP_HOST` (z. B. `5012345.ssh.w1.strato.hosting`), `STRATO_SFTP_USER`, `STRATO_SFTP_PASSWORD`, `STRATO_SFTP_PATH` (Zielordner, z. B. `/schauspielgruppe`).
2. Unter *… › Variables* die Variable `LIVE_STRATO` mit dem Wert `true` anlegen. Dann lädt „Staging freigeben“ die Seite direkt danach auf Strato hoch.
3. In `strato.yml` die Auslöser unter `on:` einkommentieren (Upload auch nach Pull-Request-Merge und jede Nacht).
4. Im Strato-Kundenlogin einen **SFTP-Zugang** anlegen (ab Paket „Hosting Starter“) und einen **eigenen, leeren Ordner** für die Website, auf den die Domain zeigt.
   **Wichtig:** Der Upload spiegelt `dist/` und löscht im Zielordner alles, was nicht dazugehört.
5. SSL aktivieren. Die `.htaccess` leitet auf HTTPS um und alte WordPress-Adressen auf die neuen Seiten (wirkt nur bei Strato, nicht bei GitHub Pages).

### 3. Pages CMS

1. [app.pagescms.org](https://app.pagescms.org) öffnen, mit GitHub anmelden, die Pages-CMS-App für das Repository freigeben, das Repository und den Branch **`staging`** auswählen. Die Konfiguration steht in `.pages.yml`.
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
- [ ] Im Strato-Kundenlogin den **Vertrag zur Auftragsverarbeitung** (Art. 28 DSGVO) abschließen.
- [ ] In der Datenschutzerklärung die genaue Speicherdauer der Strato-Logfiles eintragen (statt „nach kurzer Zeit“).
- [ ] Prüfen, ob „Wolfgang Hugo Ritter“ der amtliche Name ist (Impressum und Datenschutz).
- [ ] Fotos, Videos und Musik: Rechte der Fotografen, Einwilligungen (bei Kindern der Eltern) und Musiklizenzen klären.

## Staging nicht bei Google

Der Staging-Workflow baut mit `SGN_NOINDEX=1`: Jede Seite bekommt `<meta name="robots" content="noindex, nofollow">`, und die robots.txt verweist auf keine Sitemap. Der Strato-Workflow setzt die Variable nicht, dort ist die Seite normal auffindbar.

## Technik

- Astro 7, komplett statisch, kein Server-Code, keine Datenbank.
- Designsystem: Farben und Schriften als CSS-Variablen in `src/styles/global.css` (Logo-Rot, Weiß, Creme, Anthrazit, Steingrau, Dunkelrot; Playfair Display und Source Sans 3).
- Schriften lokal eingebunden (Playfair Display, Source Sans 3), keine externen Dienste, keine Cookies.
- Bilder werden beim Build als AVIF/WebP in passenden Größen erzeugt.
- Videos werden direkt vom eigenen Server geladen (Dateien möglichst unter 50 MB halten).
- Strukturierte Daten (schema.org `TheaterEvent`) für kommende Vorstellungen, Sitemap unter `/sitemap.xml`.

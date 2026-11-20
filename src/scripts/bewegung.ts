/**
 * Bewegung und Interaktion – ohne Bibliotheken, für alte Geräte geeignet.
 *
 * - Inhalte erscheinen beim Scrollen (gestaffelt), Elemente im ersten Bild bleiben sofort sichtbar
 * - Zahlen zählen hoch, Bilder blenden beim Laden weich ein
 * - Laufband reagiert auf das Scrolltempo (auch rückwärts)
 * - Maus: Bühnen-Scheinwerfer folgt dem Zeiger, roter Rahmen weicht leicht aus
 *
 * Regeln für Leistung:
 * - nur transform/translate/opacity animieren (läuft auf der Grafikkarte)
 * - IntersectionObserver statt Scroll-Berechnungen, ein einziger Scroll-Listener mit requestAnimationFrame
 * - html.ruhig (prefers-reduced-motion) → nichts davon; html.sparsam (schwaches Gerät) → keine Maus- und Laufband-Effekte
 * - ohne JavaScript ist alles sichtbar (versteckt wird nur, was dieses Skript selbst markiert)
 *
 * (WordPress: als Theme-Skript einbinden, Klassen sind identisch)
 */

const html = document.documentElement;
const bewegt = html.classList.contains('bewegt');
const sparsam = html.classList.contains('sparsam');
const feineMaus = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------- 1. Inhalte beim Scrollen erscheinen lassen ---------- */
// Reihenfolge egal: Es wird immer nur das äußerste passende Element animiert.
const ZIELE: [string, string][] = [
  ['.kopfzeile, .seitenkopf__intro, .kulissen__kopf, .besetzung__kopf', ''],
  ['.ticket', 'karte'],
  ['.infozeile > div, .preise__infos > div, .anfahrt__wege > div', ''],
  ['.akt', ''],
  ['.zahlen > div, .vorstand, .aushang, .team-liste > li, .kontaktkarte, .sponsoren > li', ''],
  ['.zeilen > li', 'links'],
  ['.abriss, .eintrag, .filmstreifen, .kontaktbogen > li, .fotos > li', ''],
  ['.zettel, .preiskarte, .anfahrt__karte, .jt-buehne, .jt-einladung, .jahrzehnt__kopf, .hinweis-box', ''],
  ['.zwei-spalten > .stapel, .zwei-spalten > .prosa, .kulissen__video, .bts', ''],
  ['.mitmachen__rollen > li', 'karte'],
  ['.mitmachen__titel, .mitmachen__text, .jt', ''],
];

function erscheinen() {
  const auswahl = ZIELE.map(([sel]) => sel).join(', ');
  const art = (el: Element) => ZIELE.find(([sel]) => el.matches(sel))?.[1] ?? '';
  const grenze = window.innerHeight * 0.92;
  const beob = new IntersectionObserver(
    (eintraege) => {
      // Gleichzeitig sichtbare Elemente nacheinander erscheinen lassen (in Dokumentreihenfolge)
      const neu = eintraege.filter((e) => e.isIntersecting).map((e) => e.target as HTMLElement);
      neu.forEach((el, k) => {
        const verz = Math.min(k, 7) * 70;
        el.style.setProperty('--verz', `${verz}ms`);
        el.classList.add('ist-da');
        beob.unobserve(el);
        // Verzögerung nur für den Auftritt, nicht für spätere Hover-Effekte
        window.setTimeout(() => el.style.removeProperty('--verz'), verz + 1000);
      });
    },
    { rootMargin: '0px 0px -6% 0px' },
  );
  document.querySelectorAll<HTMLElement>(auswahl).forEach((el) => {
    if (el.closest('.hero, [data-reveal]') || el.closest('[hidden]')) return; // Bühne hat eigene Auftritte
    if (el.getBoundingClientRect().top < grenze) return; // schon im Bild: nicht verstecken
    el.dataset.reveal = art(el);
    beob.observe(el);
  });
}

/* ---------- 2. Zahlen hochzählen (z. B. „80+“, nicht bei Jahreszahlen) ---------- */
function zaehlen() {
  const ziele = [...document.querySelectorAll<HTMLElement>('.zahlen dd')]
    .map((el) => ({ el, m: el.textContent!.trim().match(/^(\d+)(.*)$/) }))
    .filter((z) => z.m && Number(z.m[1]) < 1900);
  if (!ziele.length) return;
  const beob = new IntersectionObserver((eintraege) => {
    eintraege.forEach((e) => {
      if (!e.isIntersecting) return;
      beob.unobserve(e.target);
      const z = ziele.find((x) => x.el === e.target)!;
      const ziel = Number(z.m![1]);
      const rest = z.m![2];
      const t0 = performance.now();
      const dauer = 1200;
      const schritt = (t: number) => {
        const p = Math.min(1, (t - t0) / dauer);
        z.el.textContent = `${Math.round(ziel * (1 - Math.pow(1 - p, 3)))}${rest}`;
        if (p < 1) requestAnimationFrame(schritt);
      };
      requestAnimationFrame(schritt);
    });
  }, { threshold: 0.6 });
  ziele.forEach((z) => beob.observe(z.el));
}

/* ---------- 3. Bilder weich einblenden, sobald sie geladen sind ---------- */
function bilder() {
  document.querySelectorAll<HTMLImageElement>('.foto__bild img, .akt__bild img, .jt-buehne__bild img, .sponsoren img').forEach((img) => {
    if (img.complete && img.naturalWidth) return;
    img.classList.add('laedt');
    const fertig = () => img.classList.replace('laedt', 'geladen');
    img.addEventListener('load', fertig, { once: true });
    img.addEventListener('error', fertig, { once: true });
  });
}

/* ---------- 4. Laufband: Tempo folgt dem Scrollen ---------- */
function laufband() {
  const spur = document.querySelector<HTMLElement>('.laufband__spur');
  const anim = spur?.getAnimations?.()[0];
  if (!anim) return;
  let letzte = window.scrollY;
  let tempo = 1;
  let laeuft = false;
  const schritt = () => {
    const y = window.scrollY;
    const ziel = 1 + Math.max(-6, Math.min(8, (y - letzte) * 0.35));
    letzte = y;
    tempo += (ziel - tempo) * 0.12;
    anim.playbackRate = Math.abs(tempo) < 0.05 ? 0.05 : tempo;
    if (Math.abs(tempo - 1) > 0.01) requestAnimationFrame(schritt);
    else { anim.playbackRate = 1; laeuft = false; }
  };
  window.addEventListener('scroll', () => {
    if (!laeuft) { laeuft = true; requestAnimationFrame(schritt); }
  }, { passive: true });
}

/* ---------- 5. Maus: Scheinwerfer auf dunklen Bühnen, Rahmen weicht aus ---------- */
function scheinwerfer() {
  document.querySelectorAll<HTMLElement>('.stage.grain:not(.spielplan--hell)').forEach((buehne) => {
    const spot = document.createElement('div');
    spot.className = 'spot';
    spot.setAttribute('aria-hidden', 'true');
    buehne.prepend(spot);
    const rahmen = buehne.querySelector<HTMLElement>('.hero .rahmen');
    let x = 0, y = 0, geplant = false;
    const zeichnen = () => {
      geplant = false;
      const r = buehne.getBoundingClientRect();
      spot.style.translate = `${x - r.left}px ${y - r.top}px`;
      if (rahmen) {
        const dx = (x - r.left) / r.width - 0.5;
        const dy = (y - r.top) / r.height - 0.5;
        rahmen.style.translate = `${dx * -18}px ${dy * -14}px`;
      }
    };
    buehne.addEventListener('pointermove', (e) => {
      x = e.clientX; y = e.clientY;
      if (!geplant) { geplant = true; requestAnimationFrame(zeichnen); }
    }, { passive: true });
    buehne.addEventListener('pointerleave', () => { if (rahmen) rahmen.style.translate = ''; });
  });
}

/* ---------- 6. Große Buttons ziehen leicht zur Maus ---------- */
function magnetisch() {
  document.querySelectorAll<HTMLElement>('.btn--gross, .kopf__nav .btn, .mitmachen .btn, .jt-einladung .btn').forEach((btn) => {
    let geplant = false, x = 0, y = 0;
    const zeichnen = () => {
      geplant = false;
      const r = btn.getBoundingClientRect();
      const dx = (x - (r.left + r.width / 2)) / r.width;
      const dy = (y - (r.top + r.height / 2)) / r.height;
      btn.style.translate = `${(dx * 10).toFixed(1)}px ${(dy * 8 - 2).toFixed(1)}px`;
    };
    btn.addEventListener('pointermove', (e) => {
      x = e.clientX; y = e.clientY;
      if (!geplant) { geplant = true; requestAnimationFrame(zeichnen); }
    }, { passive: true });
    btn.addEventListener('pointerleave', () => { btn.style.translate = ''; });
  });
}

/* ---------- 7. Akte: Karte neigt sich zur Maus, Lichtreflex folgt ---------- */
function neigen() {
  document.querySelectorAll<HTMLElement>('.akt').forEach((akt) => {
    const bild = akt.querySelector<HTMLElement>('.akt__bild');
    if (!bild) return;
    let geplant = false, x = 0, y = 0;
    const zeichnen = () => {
      geplant = false;
      const r = bild.getBoundingClientRect();
      const px = Math.min(1, Math.max(0, (x - r.left) / r.width));
      const py = Math.min(1, Math.max(0, (y - r.top) / r.height));
      bild.style.setProperty('--ry', `${((px - 0.5) * 9).toFixed(2)}deg`);
      bild.style.setProperty('--rx', `${((0.5 - py) * 7).toFixed(2)}deg`);
      bild.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
      bild.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
    };
    akt.addEventListener('pointerenter', () => akt.classList.add('wird-geneigt'));
    akt.addEventListener('pointermove', (e) => {
      x = e.clientX; y = e.clientY;
      if (!geplant) { geplant = true; requestAnimationFrame(zeichnen); }
    }, { passive: true });
    akt.addEventListener('pointerleave', () => {
      akt.classList.remove('wird-geneigt');
      ['--rx', '--ry'].forEach((v) => bild.style.removeProperty(v));
    });
  });
}

if (bewegt) {
  erscheinen();
  zaehlen();
  bilder();
  if (!sparsam) laufband();
  if (!sparsam && feineMaus) {
    scheinwerfer();
    magnetisch();
    neigen();
  }
}

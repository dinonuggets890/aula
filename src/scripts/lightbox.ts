/**
 * Fotos groß ansehen (Lightbox) – natives <dialog>, ohne Bibliothek.
 * - Klick, Tippen oder Enter/Leertaste auf ein Foto öffnet es groß
 * - Pfeiltasten bzw. Wischen blättern innerhalb der Gruppe (eine Produktion, ein Kontaktbogen …)
 * - Esc, Klick daneben oder „Schließen“ schließt; der Fokus springt zurück
 * (WordPress: als Theme-Skript einbinden, die Klassen bleiben gleich)
 */

const AUSLOESER = '.filmstreifen .foto__bild, .kontaktbogen .foto__bild, .eintrag .foto__bild, .besetzung__foto .foto__bild';
const GRUPPE = '.filmstreifen, .kontaktbogen, .jahrzehnte, .besetzung__foto';

const pfeil = (richtung: 'l' | 'r') =>
  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="square" aria-hidden="true">${
    richtung === 'r' ? '<path d="M4 12h15"/><path d="M13 6l6 6-6 6"/>' : '<path d="M20 12H5"/><path d="M11 6l-6 6 6 6"/>'
  }</svg>`;

/** Größte verfügbare Bildquelle (aus srcset), sonst die angezeigte */
function grosseQuelle(img: HTMLImageElement): string {
  const kandidaten = (img.getAttribute('srcset') || '')
    .split(',')
    .map((s) => s.trim().split(/\s+/))
    .filter(([u]) => u)
    .map(([u, w]) => ({ u, w: parseInt(w) || 0 }));
  kandidaten.sort((a, b) => b.w - a.w);
  return kandidaten[0]?.u || img.currentSrc || img.src;
}

/** Bildunterschrift je nach Ort: Produktion · Jahr, Fotograf */
function beschriftung(ausloeser: HTMLElement, img: HTMLImageElement): { titel: string; credit: string } {
  const streifen = ausloeser.closest('.filmstreifen');
  if (streifen) {
    const titel = [streifen.querySelector('h2')?.textContent, streifen.querySelector('.filmstreifen__jahr')?.textContent].filter(Boolean).join(' · ');
    const credit = streifen.querySelector('.filmstreifen__credit')?.textContent?.trim() || '';
    return { titel, credit: credit.startsWith('Fotos:') && credit.length > 7 ? credit : '' };
  }
  const eintrag = ausloeser.closest('.eintrag');
  if (eintrag) return { titel: [eintrag.querySelector('h3')?.textContent, eintrag.querySelector('.eintrag__jahr')?.textContent].filter(Boolean).join(' · '), credit: '' };
  const fig = ausloeser.closest('figure')?.querySelector('figcaption')?.textContent?.trim();
  return { titel: fig || img.alt, credit: '' };
}

const ausloeser = [...document.querySelectorAll<HTMLElement>(AUSLOESER)].filter((a) => a.querySelector('img'));

if (ausloeser.length && 'HTMLDialogElement' in window) {
  let dialog: HTMLDialogElement | null = null;
  let gruppe: HTMLElement[] = [];
  let index = 0;

  const bauen = () => {
    dialog = document.createElement('dialog');
    dialog.className = 'lightbox';
    dialog.setAttribute('aria-label', 'Foto');
    dialog.innerHTML = `
      <figure><img alt="" /><figcaption><span class="lightbox__titel"></span><span class="lightbox__credit"></span><span class="lightbox__nr"></span></figcaption></figure>
      <button class="lightbox__zurueck" type="button" aria-label="Vorheriges Foto">${pfeil('l')}</button>
      <button class="lightbox__vor" type="button" aria-label="Nächstes Foto">${pfeil('r')}</button>
      <button class="lightbox__zu" type="button" aria-label="Schließen"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="square" aria-hidden="true"><path d="M5 5l14 14"/><path d="M19 5L5 19"/></svg></button>`;
    document.body.append(dialog);
    const d = dialog;
    d.querySelector('.lightbox__zurueck')!.addEventListener('click', () => zeigen(index - 1));
    d.querySelector('.lightbox__vor')!.addEventListener('click', () => zeigen(index + 1));
    d.querySelector('.lightbox__zu')!.addEventListener('click', () => d.close());
    // Klick neben das Foto schließt
    d.addEventListener('click', (e) => { if (e.target === d || (e.target as HTMLElement).tagName === 'FIGURE') d.close(); });
    d.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); zeigen(index - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); zeigen(index + 1); }
    });
    // Wischen
    let startX = 0, startY = 0;
    d.addEventListener('pointerdown', (e) => { startX = e.clientX; startY = e.clientY; });
    d.addEventListener('pointerup', (e) => {
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (e.pointerType !== 'mouse' && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) zeigen(index + (dx < 0 ? 1 : -1));
    });
    d.addEventListener('close', () => { document.documentElement.style.overflow = ''; });
    return d;
  };

  const zeigen = (i: number) => {
    if (!dialog || !gruppe.length) return;
    index = (i + gruppe.length) % gruppe.length;
    const quelle = gruppe[index];
    const img = quelle.querySelector('img')!;
    const { titel, credit } = beschriftung(quelle, img);
    const gross = dialog.querySelector<HTMLImageElement>('figure img')!;
    gross.src = grosseQuelle(img);
    gross.alt = img.alt || titel;
    dialog.querySelector('.lightbox__titel')!.textContent = titel;
    dialog.querySelector('.lightbox__credit')!.textContent = credit;
    dialog.querySelector('.lightbox__nr')!.textContent = gruppe.length > 1 ? `Foto ${index + 1} von ${gruppe.length}` : '';
    dialog.querySelector<HTMLElement>('.lightbox__zurueck')!.hidden = gruppe.length < 2;
    dialog.querySelector<HTMLElement>('.lightbox__vor')!.hidden = gruppe.length < 2;
    dialog.classList.remove('wechselt');
    void dialog.offsetWidth; // Animation neu starten
    dialog.classList.add('wechselt');
  };

  const oeffnen = (a: HTMLElement) => {
    const d = dialog ?? bauen();
    const container = a.closest(GRUPPE);
    gruppe = container ? ausloeser.filter((x) => container.contains(x) && !x.closest('[hidden]')) : [a];
    document.documentElement.style.overflow = 'hidden';
    d.showModal();
    zeigen(gruppe.indexOf(a));
  };

  ausloeser.forEach((a) => {
    const img = a.querySelector('img')!;
    a.dataset.gross = '';
    a.tabIndex = 0;
    a.setAttribute('role', 'button');
    a.setAttribute('aria-label', `Foto vergrößern: ${beschriftung(a, img).titel || img.alt}`);
    a.addEventListener('click', () => oeffnen(a));
    a.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); oeffnen(a); }
    });
  });
}

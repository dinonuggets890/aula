/**
 * Änderungen an Listen (z. B. Filter) mit weichem Übergang:
 * Elemente gleiten an ihren neuen Platz, neue blenden ein, wegfallende aus.
 * Nutzt die View Transitions API; ohne Unterstützung, bei wenig Bewegung oder im Sparmodus
 * wird die Änderung einfach sofort ausgeführt.
 */
export function mitUebergang(elemente: Iterable<HTMLElement>, aendern: () => void) {
  const html = document.documentElement;
  const d = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };
  if (!d.startViewTransition || !html.classList.contains('bewegt') || html.classList.contains('sparsam')) {
    aendern();
    return;
  }
  const liste = [...elemente];
  liste.forEach((el, i) => el.style.setProperty('view-transition-name', `liste-${i}`));
  html.classList.add('vt-filter');
  d.startViewTransition(aendern).finished.finally(() => {
    liste.forEach((el) => el.style.removeProperty('view-transition-name'));
    html.classList.remove('vt-filter');
  });
}

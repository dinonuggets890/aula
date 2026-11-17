/**
 * Seitenstruktur: höchstens zwei Ebenen.
 * Hauptpunkte = eigene Seiten, Unterpunkte = Abschnitte auf diesen Seiten.
 * (Für WordPress: entspricht dem Menü „Hauptnavigation“, Unterpunkte als Anker-Links.)
 */
export type Bereich = 'stueck' | 'jt' | 'verein' | 'fotos' | 'kontakt' | 'karten';

export interface NavPunkt {
  key: Bereich;
  href: string;
  text: string;
  unter: { href: string; text: string }[];
}

export const navigation: NavPunkt[] = [
  {
    key: 'stueck',
    href: '/aktuelles-stueck/',
    text: 'Aktuelles Stück',
    unter: [
      { href: '/aktuelles-stueck/#handlung', text: 'Handlung und Trailer' },
      { href: '/aktuelles-stueck/#besetzung', text: 'Besetzung und Team' },
      { href: '/aktuelles-stueck/#termine', text: 'Termine und Karten' },
      { href: '/aktuelles-stueck/#preise', text: 'Preise und Abendkasse' },
    ],
  },
  {
    key: 'jt',
    href: '/junges-theater/',
    text: 'Junges Theater',
    unter: [
      { href: '/junges-theater/#aktuell', text: 'Aktuelles Stück' },
      { href: '/junges-theater/#proben', text: 'Team und Proben' },
      { href: '/junges-theater/#mitmachen', text: 'Mitmachen' },
    ],
  },
  {
    key: 'verein',
    href: '/verein/',
    text: 'Verein',
    unter: [
      { href: '/verein/#ueber-uns', text: 'Wir über uns' },
      { href: '/verein/#mitmachen', text: 'Mitmachen und Mitgliedschaft' },
      { href: '/chronik/', text: 'Frühere Aufführungen' },
    ],
  },
  {
    key: 'fotos',
    href: '/fotos/',
    text: 'Fotos',
    unter: [],
  },
  {
    key: 'kontakt',
    href: '/kontakt/',
    text: 'Kontakt',
    unter: [
      { href: '/kontakt/#anfahrt', text: 'Anfahrt' },
      { href: '/kontakt/#presse', text: 'Presse' },
      { href: '/kontakt/#sponsoren', text: 'Sponsoren' },
    ],
  },
];

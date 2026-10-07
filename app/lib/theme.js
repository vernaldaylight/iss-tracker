// Farbschema-Logik ohne React. Reine Funktionen, damit die Zustandsregeln
// unabhängig von der Oberfläche prüfbar bleiben.
//
// Zwei Dinge werden bewusst getrennt:
//   * Modus  — was die Nutzerin gewählt hat ('light' | 'dark' | 'system'),
//              wird gespeichert.
//   * Schema — was tatsächlich angezeigt wird ('light' | 'dark'),
//              wird abgeleitet und nie gespeichert.

export const THEMES = ['light', 'dark', 'system'];

// Ohne gespeicherte Wahl folgt die Anzeige der Systemeinstellung.
export const DEFAULT_MODE = 'system';

export const STORAGE_KEY = 'iss-theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

export function isThemeMode(value) {
  return typeof value === 'string' && THEMES.includes(value);
}

// localStorage wirft in privaten Fenstern und bei blockierten Cookies. Beide
// Zugriffe fangen das ab: das Umschalten funktioniert dann weiterhin, die Wahl
// gilt nur für die laufende Sitzung.
export function readStoredMode() {
  if (typeof window === 'undefined') return DEFAULT_MODE;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    // Ein manipulierter oder veralteter Wert zählt wie "keine Wahl".
    return isThemeMode(stored) ? stored : DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
}

export function writeStoredMode(mode) {
  if (typeof window === 'undefined' || !isThemeMode(mode)) return;

  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Siehe oben: ohne Speicher läuft das Umschalten trotzdem.
  }
}

export function systemPrefersDark() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(DARK_QUERY).matches;
}

export function resolveTheme(mode, prefersDark) {
  if (mode === 'dark' || mode === 'light') return mode;
  return prefersDark ? 'dark' : 'light';
}

export { DARK_QUERY };

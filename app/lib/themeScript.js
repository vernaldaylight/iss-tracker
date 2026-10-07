import { DARK_QUERY, DEFAULT_MODE, STORAGE_KEY } from './theme';

// Dieses Skript läuft blockierend im <head>, also vor dem ersten Paint von
// React. Es setzt das Farbschema am <html>-Element, damit beim Laden nie kurz
// das falsche Schema aufblitzt (FOUC).
//
// Als Zeichenkette statt als Komponente, weil es unverändert und ohne Bundle
// in den HTML-Kopf geschrieben werden muss. Schlüssel und Standardwert kommen
// aus theme.js, damit sie nur an einer Stelle stehen — beide Module sind
// reines JavaScript und serverseitig importierbar.
//
// Beide Zugriffe stehen in eigenen try-Blöcken: fällt localStorage weg (privates
// Fenster), bleibt der Modus "system" und es wird trotzdem korrekt gegen die
// Systemeinstellung aufgelöst. Ein hartes "light" im Fehlerfall würde hier ein
// Aufblitzen erzeugen, das der Provider nach dem Mount wieder korrigieren müsste.
export const THEME_SCRIPT = `(function(){var dark=false;try{dark=window.matchMedia(${JSON.stringify(
  DARK_QUERY,
)}).matches;}catch(error){}var mode=${JSON.stringify(DEFAULT_MODE)};try{mode=window.localStorage.getItem(${JSON.stringify(
  STORAGE_KEY,
)})||mode;}catch(error){}var theme=mode==='light'||mode==='dark'?mode:dark?'dark':'light';document.documentElement.dataset.theme=theme;})();`;

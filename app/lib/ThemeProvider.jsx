'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  DARK_QUERY,
  DEFAULT_MODE,
  STORAGE_KEY,
  isThemeMode,
  readStoredMode,
  resolveTheme,
  writeStoredMode,
} from './theme';

const ThemeContext = createContext(null);

export default function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(DEFAULT_MODE);
  // Systemeinstellung als eigener Zustand: nur so kann der Modus "system"
  // einem Wechsel des Betriebssystems live folgen.
  const [prefersDark, setPrefersDark] = useState(false);
  // Vor dem Mount ist localStorage nicht lesbar. Bis dahin bleibt das vom
  // Inline-Skript gesetzte Attribut unangetastet.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(DARK_QUERY);

    setPrefersDark(query.matches);
    setModeState(readStoredMode());
    setReady(true);

    const onChange = (event) => setPrefersDark(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const resolvedTheme = resolveTheme(mode, prefersDark);

  // Erst nach dem Mount schreiben. Ein Schreiben mit dem noch unbekannten
  // Modus würde das korrekte Schema aus dem Inline-Skript kurz überschreiben
  // und genau das Aufblitzen erzeugen, das es zu verhindern gilt.
  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.theme = resolvedTheme;
  }, [ready, resolvedTheme]);

  const setMode = useCallback((next) => {
    if (!isThemeMode(next)) return;
    setModeState(next);
    writeStoredMode(next);
  }, []);

  // Andere Tabs übernehmen die Wahl mit (F9). Das Event kommt nur aus
  // fremden Tabs, nicht aus dem eigenen.
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== STORAGE_KEY) return;
      setModeState(isThemeMode(event.newValue) ? event.newValue : DEFAULT_MODE);
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo(
    () => ({ mode, setMode, resolvedTheme, ready }),
    [mode, setMode, resolvedTheme, ready],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme muss innerhalb von <ThemeProvider> verwendet werden.');
  }
  return context;
}

'use client';

import { useTheme } from '../lib/ThemeProvider';

const OPTIONS = [
  { value: 'light', label: 'Hell' },
  { value: 'dark', label: 'Dunkel' },
  { value: 'system', label: 'System' },
];

// Drei Knöpfe statt eines durchklickenden Schalters: bei drei Zuständen ist
// sonst nicht erkennbar, was der nächste Klick tut.
export default function ThemeToggle() {
  const { mode, setMode, ready } = useTheme();

  return (
    <div className="theme-toggle" role="group" aria-label="Farbschema wählen">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className="theme-toggle__option"
          // Vor dem Mount ist der gespeicherte Modus unbekannt. Alle Knöpfe
          // gelten dann als nicht gedrückt — das entspricht dem Server-HTML.
          aria-pressed={ready && mode === option.value}
          onClick={() => setMode(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

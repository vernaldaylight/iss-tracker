// Die ISS als vereinfachte Draufsicht: vier Solarflügel am Träger, in der Mitte
// die Module.
//
// Zwei Dinge sind hier Absicht:
//   * Keine <defs> (also keine Gradienten oder Patterns) — dieselbe Grafik steht
//     mehrfach im Dokument (Marker, Kopfbereich), und IDs würden kollidieren.
//   * Dunkle Konturen statt heller: Die Karte ist unter OpenStreetMap überwiegend
//     hell, ein weiß gerahmtes Icon verschwindet darin.
//
// Dieselbe Grafik liegt als Favicon unter app/icon.svg — dort muss nach
// Next.js-Konvention eine echte Datei stehen. Änderungen also dort nachziehen.
const STATION = `
  <!-- Solarflügel -->
  <g fill="#2563eb">
    <rect x="6.5" y="12.5" width="18" height="16" rx="2.2" />
    <rect x="6.5" y="35.5" width="18" height="16" rx="2.2" />
    <rect x="39.5" y="12.5" width="18" height="16" rx="2.2" />
    <rect x="39.5" y="35.5" width="18" height="16" rx="2.2" />
  </g>

  <!-- Zellreihen der Panels -->
  <path
    d="M12.5 12.5V28.5M18.5 12.5V28.5M12.5 35.5V51.5M18.5 35.5V51.5
       M45.5 12.5V28.5M51.5 12.5V28.5M45.5 35.5V51.5M51.5 35.5V51.5
       M6.5 17.5H24.5M6.5 22.5H24.5M6.5 40.5H24.5M6.5 45.5H24.5
       M39.5 17.5H57.5M39.5 22.5H57.5M39.5 40.5H57.5M39.5 45.5H57.5"
    fill="none" stroke="#bfdbfe" stroke-width="1.1" opacity="0.85" />

  <!-- Panelrahmen -->
  <g fill="none" stroke="#0f172a" stroke-width="2">
    <rect x="6.5" y="12.5" width="18" height="16" rx="2.2" />
    <rect x="6.5" y="35.5" width="18" height="16" rx="2.2" />
    <rect x="39.5" y="12.5" width="18" height="16" rx="2.2" />
    <rect x="39.5" y="35.5" width="18" height="16" rx="2.2" />
  </g>

  <!-- Träger -->
  <rect x="4" y="29" width="56" height="6" rx="3" fill="#94a3b8" stroke="#0f172a" stroke-width="2" />

  <!-- Module -->
  <rect x="25.5" y="19.5" width="13" height="25" rx="4" fill="#f1f5f9" stroke="#0f172a" stroke-width="2" />
  <rect x="28.5" y="23.5" width="7" height="5" rx="1.2" fill="#475569" />
  <rect x="28.5" y="35.5" width="7" height="5" rx="1.2" fill="#475569" />`;

export const ISS_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
  <g transform="translate(32 32) scale(1.12) translate(-32 -32)">
${STATION}
  </g>
</svg>`;

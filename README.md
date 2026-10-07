# ISS Live-Tracker

Das ist unser Repo für die ISS-Tracker App.

Zeigt die aktuelle Position der Internationalen Raumstation live auf einer
OpenStreetMap-Karte — inklusive Breitengrad, Längengrad, Höhe und
Geschwindigkeit.

## Starten

```bash
npm install
npm run dev
```

Danach http://localhost:3000 öffnen.

## Aufbau

| Pfad | Inhalt |
|---|---|
| `app/page.jsx` | Einstiegspunkt der Seite |
| `app/layout.jsx` | Grundgerüst und Metadaten |
| `app/globals.css` | Layout und Gestaltung |
| `app/components/IssTracker.jsx` | Polling, Zustand und Anzeige der Messwerte |
| `app/components/IssMap.jsx` | Leaflet-Karte und ISS-Marker (nur clientseitig) |
| `app/lib/iss.js` | Zugriff auf die Datenquelle |

## Datenquelle

`https://api.wheretheiss.at/v1/satellites/25544` — kostenlos, kein API-Key,
ausschließlich HTTPS. Die App fragt die Position alle 5 Sekunden neu ab.

Ist die Quelle nicht erreichbar, bleibt die Seite bedienbar: Es erscheint ein
Hinweis, die Karte und die zuletzt empfangenen Werte bleiben stehen, und das
Polling versucht es automatisch weiter.

## Deployen

Vercel ist mit dem App Router die einfachste Variante:

```bash
npx vercel --prod
```

Die URL liefert automatisch HTTPS. Damit tritt kein Mixed-Content-Fehler auf,
weil sowohl die API als auch die Kartenkacheln über HTTPS geladen werden.

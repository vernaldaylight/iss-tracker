# ISS Live-Tracker

Das ist unser Repo für die ISS-Tracker App.

Zeigt die aktuelle Position der Internationalen Raumstation live auf einer
OpenStreetMap-Karte — inklusive Breitengrad, Längengrad, Höhe und
Geschwindigkeit. Dazu die Liste der Menschen, die gerade im All sind.

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
| `app/components/AstronautList.jsx` | Liste der Menschen im All |
| `app/lib/iss.js` | Zugriff auf die Datenquelle |
| `app/lib/astros.js` | Zugriff auf die Astronauten-Liste |
| `app/api/astros/route.js` | Proxy für die Astronauten-Liste (einzige Server-Route) |

## Datenquellen

`https://api.wheretheiss.at/v1/satellites/25544` — kostenlos, kein API-Key,
ausschließlich HTTPS. Die App fragt die Position alle 5 Sekunden neu ab.

Ist die Quelle nicht erreichbar, bleibt die Seite bedienbar: Es erscheint ein
Hinweis, die Karte und die zuletzt empfangenen Werte bleiben stehen, und das
Polling versucht es automatisch weiter.

Die Astronauten-Liste kommt aus `http://api.open-notify.org/astros.json`. Diese
Quelle ist **nur über HTTP** erreichbar (Port 443 nimmt keine Verbindung an) und
würde im Browser als Mixed Content blockiert. Der Abruf läuft deshalb über die
eigene Route `app/api/astros`: Der Server holt die Daten einmalig über HTTP und
gibt sie über HTTPS weiter. Der Browser spricht nur mit der eigenen Adresse.

Die Crew wechselt nur alle paar Monate und wird deshalb nicht im
5-Sekunden-Takt geholt, sondern einmal beim Öffnen und danach auf Klick auf
„Aktualisieren". Schlägt der Abruf fehl, bleibt die zuletzt erhaltene Liste
stehen und der Knopf wird zu „Erneut versuchen".

## Deployen

Vercel ist mit dem App Router die einfachste Variante. Das Deployment ist mit
GitHub verbunden und läuft **automatisch bei jedem Push** — es ist kein
manueller Befehl nötig:

```bash
git push
```

Die URL liefert automatisch HTTPS. Damit tritt kein Mixed-Content-Fehler auf:
Position, Kartenkacheln und Astronauten-Liste werden vom Browser ausschließlich
über HTTPS geladen — die eine HTTP-Quelle (Open Notify) läuft über die eigene
Route.

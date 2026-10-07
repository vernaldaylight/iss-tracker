# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Harte Vorgaben** (aus `ai_docs/PRD.md` — nicht verhandelbar)
> - **Kein eigenes Backend.** Next.js nur als Frontend-Framework. Einzige Ausnahme: Proxy für Bonus B4 in `app/api/`.
> - **Keine API-Keys oder Secrets im Code** — auch keine Dienste, die einen Key verlangen.
> - **HTTPS zwingend** für alle Requests der App. Kein Mixed-Content-Fehler in der Browser-Konsole.
> - **Deutsch** in UI-Texten, Code-Kommentaren und Dokumentation.

## Projekt

Reine Frontend-Web-App: zeigt die Live-Position der ISS auf einer Leaflet-Karte (plus Breite, Länge, Höhe und Geschwindigkeit). Next.js App Router, Deployment über Vercel mit automatischem HTTPS.

Beim Ergänzen von Code Sprache, Kommentarstil und Detailtiefe der Nachbardateien übernehmen.

## Befehle

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
npm start
```

**Deployment:** läuft automatisch über Vercel bei einem Push auf GitHub. `npx vercel --prod` **nicht** von Hand ausführen — das würde am Git-Flow vorbei deployen. Deployen heißt hier: committen und pushen.

Es gibt **keine** Lint-, Test- oder Typecheck-Skripte. Verifikation läuft manuell im Browser (DevTools: Network für Mixed Content, Rendering → `prefers-color-scheme` fürs Farbschema) — siehe die Prüflisten in `ai_docs/features/`.

## Dokumente als Auftragsquelle

- `ai_docs/PRD.md` — Anforderungen (F1–F4 Muss, B1–B4 Bonus). Muss-Scope ist bewusst klein: kein Backend außer für Bonus B4.
- `ai_docs/features/*.md` — Feature-Anweisungen im selben Stil, jeweils mit Akzeptanzkriterien, manueller Prüfliste und „Offene Punkte". `dark-mode.md` ist umgesetzt und dokumentiert dort auch getroffene Entscheidungen und bewusst offen gelassene Punkte.
- Bei neuen Features: Anweisung in dieses Muster einordnen, am Ende die Akzeptanzkriterien abarbeiten statt nur den Code zu schreiben.

## Architektur

**Datenfluss:** `app/page.jsx` → `app/components/IssTracker.jsx` hält den gesamten Zustand. Es pollt alle 5 s über `fetchIssPosition()` aus `app/lib/iss.js`, reicht `latitude`/`longitude` an `IssMap` weiter und rendert die Messwerte. `IssMap` hält die Leaflet-Instanz in Refs; `IssTracker` kennt Leaflet nicht.

**Kein Server-Side-Rendering der Karte.** Leaflet braucht `window` und wird in `IssMap.jsx` erst im Effekt per dynamischem `import()` geladen (modulweites `leafletPromise` cached das). Die Karte wird in einem Effekt mit `[]`-Dependencies **genau einmal** aufgebaut — Zoom und Ausschnitt der Nutzerin dürfen nicht zurückgesetzt werden. Marker-Updates, Kachelwechsel und Zentrierung laufen in getrennten Effekten über Refs.

**Zwei Kachelquellen** in `TILE_SOURCES` (`IssMap.jsx`), passend zum Schema: OSM (hell) und Esri World Dark Gray Base (dunkel). Beide Fallen sind dort kommentiert und dürfen nicht „aufgeräumt" werden: Esri gibt `y` **vor** `x` an, und `maxNativeZoom: 16` ist nötig, weil Esri ab Stufe 17 inhaltlose Kacheln ausliefert. CARTO wurde verworfen — liefert ohne Key nur Wasserzeichen, und ein Key ist laut PRD verboten.

**Farbschema:** drei Schichten, die zusammenspielen.
1. `app/lib/theme.js` — reine Funktionen ohne React (`resolveTheme`, `readStoredMode`), damit die Regeln isoliert prüfbar sind. Trennt strikt **Modus** (`light`/`dark`/`system`, wird in `localStorage['iss-theme']` gespeichert) von **aufgelöstem Schema** (`light`/`dark`, nur abgeleitet, nie gespeichert).
2. `app/lib/themeScript.js` — Inline-String für `app/layout.jsx`, läuft blockierend im `<head>` und setzt `document.documentElement.dataset.theme` **vor dem ersten Paint** (FOUC-Vermeidung). Schlüssel und Standardwert kommen aus `theme.js`, damit sie nur an einer Stelle stehen.
3. `app/lib/ThemeProvider.jsx` — Client-Context. Die `ready`-Sperre vor dem Schreiben des Attributs ist Absicht: ein Schreiben mit noch unbekanntem Modus würde das korrekte Schema aus dem Inline-Skript überschreiben und genau das Aufblitzen erzeugen, das verhindert werden soll.

**CSS:** `app/globals.css` ist die einzige Stylesheet-Datei, mit Token-Sets unter `:root` (hell) und `:root[data-theme='dark']`. Das dunkle Set ist unter `@media (prefers-color-scheme: dark)` für den No-JS-Fall **dupliziert** und muss dort mitgezogen werden. Keine harten Farbwerte außerhalb der Token-Blöcke; gegenprüfen mit
`grep -nE '#[0-9a-fA-F]{3,6}|rgba?\(' app/globals.css`.

**SVG-Icon** `app/lib/issIcon.js` wird als String exportiert und an zwei Stellen per `dangerouslySetInnerHTML` gesetzt (Header-Marke, Leaflet-`divIcon`). Das `divIcon` umgeht bewusst die Standard-Bildpfade von Leaflet, die im Bundler ins Leere zeigen.

**Robustheit:** Fehler beim Abruf dürfen nie zu Absturz oder leerer Seite führen. `load()` in `IssTracker` behält den letzten Stand, `AbortError` wird geschluckt, das Polling läuft weiter. Neue Fehlerpfade müssen dieses Verhalten erhalten.

## Nicht versionierte Werkzeuge

`.agents/` und `.claude/skills/` (installierte Agent-Skills, u. a. Vercel React Best Practices) sowie `skills-lock.json` stehen in `.gitignore` und gehören nicht ins Projekt — nicht committen, nicht als Projektstruktur behandeln.

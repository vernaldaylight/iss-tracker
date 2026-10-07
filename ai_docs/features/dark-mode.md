# Feature-Anweisung: Dark Mode mit Umschaltmöglichkeit

> Bezug: `ai_docs/PRD.md` (ISS-Live-Tracker). Diese Anweisung erweitert den bestehenden Tracker um ein umschaltbares Farbschema. Sie ist so geschrieben, dass sie ohne Rückfragen umgesetzt werden kann.

## 1. Ziel

Der Tracker ist heute **durchgehend dunkel** — es gibt kein zweites Farbschema. Ziel ist ein **umschaltbares Farbschema mit drei Modi**: `hell`, `dunkel` und `system`. Beim ersten Besuch entscheidet die Betriebssystem-Einstellung, danach die gespeicherte Wahl der Nutzerin.

**Ergebnis:** Ein Schalter im Kopfbereich, der die gesamte Oberfläche **inklusive Weltkarte** zwischen hell und dunkel wechselt — ohne Neuladen, ohne Aufblitzen der falschen Farbe.

## 2. Entscheidungen (festgelegt, nicht mehr offen)

| Frage | Entscheidung |
|---|---|
| Modi | Drei: **Hell / Dunkel / System** |
| Standard beim Erstbesuch | **Systemeinstellung folgen** |
| Kartenkacheln | Im dunklen Modus **dunkle Kacheln**, im hellen Modus OSM |
| Persistenz | `localStorage`, Schlüssel `iss-theme`, Werte `light` \| `dark` \| `system` |

## 3. Ausgangslage im Code

Diese Stellen sind betroffen — die harten Dunkelwerte sind der eigentliche Aufwand, nicht der Schalter:

| Datei | Heute | Problem für das Feature |
|---|---|---|
| `app/globals.css` | `:root { --bg: #0b1220; --surface: #131c2e; … }` | Es gibt nur **ein** Token-Set. Es muss in zwei Schemata geteilt werden. |
| `app/globals.css` | `.leaflet-container { background: #0f1728 }` | **Harter Dunkelwert**, nicht über ein Token geführt. |
| `app/globals.css` | `.leaflet-control-attribution { background: rgba(11,18,32,0.8) }` | Harter Dunkelwert. |
| `app/globals.css` | `.alert` nutzt `rgba(255,176,32,0.1)` fest verdrahtet | Muss im hellen Schema lesbar bleiben. |
| `app/layout.jsx` | Server-Komponente, `<html lang="de">` ohne Theme-Attribut | Hier muss das Farbschema **vor dem ersten Paint** gesetzt werden. |
| `app/components/IssMap.jsx` | `L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', …)` | Kachel-URL ist fest verdrahtet und die Karte wird **einmalig** in einem Effekt mit `[]`-Dependencies aufgebaut. |
| `app/components/IssTracker.jsx` | `.app__header` mit Brand und `.status`-Pille | Platz für den Schalter. |

## 4. Funktionale Anforderungen

| ID | Anforderung | Priorität |
|---|---|---|
| F1 | Ein Schalter im Kopfbereich bietet die drei Modi Hell, Dunkel und System. | Muss |
| F2 | Die Wahl wirkt **sofort** auf die gesamte Oberfläche, ohne Neuladen. | Muss |
| F3 | Die Wahl überlebt Neuladen und Browserneustart (`localStorage`). | Muss |
| F4 | Ohne gespeicherte Wahl folgt die Anzeige der Systemeinstellung (`prefers-color-scheme`). | Muss |
| F5 | Im Modus **System** reagiert die App **live** auf einen Wechsel der Betriebssystem-Einstellung. | Muss |
| F6 | Der Kartenhintergrund wechselt mit: dunkle Kacheln im dunklen, OSM-Kacheln im hellen Modus, inklusive passender Attribution. | Muss |
| F7 | Beim Laden erscheint **kein** kurzzeitiges Aufblitzen des falschen Schemas (FOUC). | Muss |
| F8 | Der Schalter ist mit der Tastatur bedienbar und für Screenreader beschriftet. | Muss |
| F9 | Die Wahl wird zwischen offenen Tabs desselben Browsers synchronisiert. | Kann |
| F10 | Die Browserleisten-Farbe (`theme-color`) folgt dem Schema. | Kann |

## 5. Zustandsmodell und Verhalten

**Zwei getrennte Dinge — nicht verwechseln:**

- **Modus** (`light` | `dark` | `system`): das, was die Nutzerin wählt. Wird gespeichert.
- **Aufgelöstes Schema** (`light` | `dark`): das, was tatsächlich angezeigt wird. Wird **nicht** gespeichert, sondern abgeleitet.

```
resolveTheme(mode, systemPrefersDark) =
  mode === 'system' ? (systemPrefersDark ? 'dark' : 'light') : mode
```

**Ablauf beim Laden (Reihenfolge ist entscheidend):**

1. Ein kurzes, blockierendes Inline-Skript im `<head>` liest `localStorage['iss-theme']`, löst `system` gegen `window.matchMedia('(prefers-color-scheme: dark)')` auf und setzt `document.documentElement.dataset.theme`.
2. Erst danach rendert React — es gibt also keinen Zwischenzustand mit falscher Farbe.

**Sonderfälle:**

- Ungültiger oder fehlender Wert in `localStorage` → wie „keine Wahl", also `system`. Kein Absturz, keine Fehlermeldung.
- `localStorage` nicht verfügbar (privates Fenster, blockierte Cookies) → Feature funktioniert weiter, die Wahl gilt nur für die laufende Sitzung. Lese- und Schreibzugriffe in `try`/`catch` kapseln.
- Modus `system` + Systemwechsel → Effekt via `matchMedia`-Listener übernimmt das neue Schema sofort.

## 6. Farbschema

### 6.1 Token-Struktur in `app/globals.css`

Das heutige Dunkel-Set **unverändert** nach `:root[data-theme='dark']` verschieben. `:root` wird zum **hellen** Schema (das Inline-Skript setzt das Attribut immer, daher ist `:root` nur der Fallback).

```css
:root {
  color-scheme: light;
  /* helles Schema: Werte unten */
}
:root[data-theme='dark'] {
  color-scheme: dark;
  /* exakt die heutigen Werte */
}
/* Fallback ohne JavaScript */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) { /* dunkle Werte wiederholen */ }
}
```

`color-scheme` mitzusetzen ist wichtig: sonst bleiben Scrollbalken, Auswahl-Markierung und Formularelemente im dunklen Modus hell.

### 6.2 Vorgeschlagene helle Werte

Startpunkt — die Kontrastprüfung (Abschnitt 8) entscheidet über die endgültigen Werte:

| Token | Hell | Rolle |
|---|---|---|
| `--bg` | `#f6f8fc` | Seitenhintergrund |
| `--surface` | `#ffffff` | Karten, Panel |
| `--surface-2` | `#eef2f8` | Messwert-Kacheln |
| `--border` | `#d7dfeb` | Rahmen |
| `--text` | `#101828` | Fließtext |
| `--muted` | `#57657e` | Sekundärtext — nach der Kontrastprüfung dunkler als der Entwurf (`#5b6b85`), siehe Abschnitt 12 |
| `--accent` | `#0b62d6` | Links, Akzente |
| `--ok` | `#0e7c46` | Status „Live" |
| `--warn` | `#b25e00` | Status „unterbrochen" |
| `--map-bg` | `#e8edf5` | **neu** — Hintergrund der Karte |

### 6.3 Kartenhintergrund entkoppeln

`--map-bg` **neu** einführen und die beiden harten Dunkelwerte ersetzen:

```css
.leaflet-container { background: var(--map-bg); }
.leaflet-control-attribution { background: color-mix(in srgb, var(--bg) 80%, transparent) !important; }
```

`.leaflet-bar a` nutzt bereits `--surface`/`--text`/`--border` und wechselt damit automatisch mit — dort ist nichts zu tun.

## 7. Umsetzungsschritte

Die Reihenfolge ist so gewählt, dass nach jedem Schritt etwas Prüfbares existiert.

### Schritt 1 — Kachelquelle in `app/components/IssMap.jsx`

Dunkle Kacheln von CARTO ergänzen, Attribution **muss** mitwandern:

```
hell:  https://tile.openstreetmap.org/{z}/{x}/{y}.png
       © OpenStreetMap-Mitwirkende

dunkel: https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png
        © OpenStreetMap-Mitwirkende © CARTO
```

**Wichtig:** Die Karte wird heute in einem Effekt mit `[]`-Dependencies genau **einmal** aufgebaut. Ein Theme-Wechsel darf die Karte **nicht** neu erzeugen — das würde Zoomstufe und Ausschnitt der Nutzerin verwerfen. Stattdessen:

- Das aktive Tile-Layer in einer Ref (`tileLayerRef`) halten.
- Ein eigener Effekt auf das aufgelöste Schema reagiert: altes Layer `remove()`, neues Layer `addTo(map)`.
- Der Effekt muss den `mapReady`-Zustand abwarten, sonst greift er ins Leere.

### Schritt 2 — Theme-Logik in `app/lib/theme.js` (neu)

Reine Funktionen, kein React — dadurch isoliert prüfbar:

- `THEMES = ['light', 'dark', 'system']`
- `STORAGE_KEY = 'iss-theme'`
- `isThemeMode(value)` — Validierung des gespeicherten Werts
- `readStoredMode()` / `writeStoredMode(mode)` — beide in `try`/`catch`
- `resolveTheme(mode, prefersDark)`

### Schritt 3 — Provider in `app/lib/ThemeProvider.jsx` (neu)

`'use client'`. React-Context mit `{ mode, setMode, resolvedTheme }`.

- `mode` als State, initial aus `readStoredMode()`.
- Ein Effekt setzt `document.documentElement.dataset.theme = resolvedTheme` und schreibt den Modus weg.
- `matchMedia`-Listener nur wirksam, wenn `mode === 'system'`.
- Ein `storage`-Listener (F9) übernimmt Änderungen aus anderen Tabs.

### Schritt 4 — Kein FOUC: `app/layout.jsx`

- Im `<head>` ein Inline-Skript, das Schritt 1 aus Abschnitt 5 ausführt. `app/layout.jsx` bleibt eine **Server-Komponente** — das Skript läuft als `dangerouslySetInnerHTML` (dasselbe Muster nutzt `IssTracker.jsx` bereits für das ISS-Icon).
- `<ThemeProvider>` um `{children}` legen.
- Wird `data-theme` zusätzlich als JSX-Attribut auf `<html>` gerendert, braucht `<html>` ein `suppressHydrationWarning` — sonst warnt React über die abweichenden Attribute.

### Schritt 5 — Schalter in `app/components/ThemeToggle.jsx` (neu)

Ein Segment-Control mit drei Knöpfen (Hell / Dunkel / System):

- Container: `role="group"` mit `aria-label="Farbschema wählen"`.
- Jeder Knopf: `aria-pressed={mode === wert}` plus sichtbare deutsche Beschriftung.
- Optional ein Symbol (Sonne/Mond/Automatik) — dann `aria-hidden="true"` am Symbol, damit der Screenreader nicht doppelt vorliest.
- **Kein** durchklickender Ein-Knopf-Schalter: der ist für drei Zustände schlecht auffindbar und schlecht vorlesbar.
- Fokusring sichtbar lassen (`:focus-visible`), nicht entfernen.

### Schritt 6 — Einbau in `app/components/IssTracker.jsx`

`<ThemeToggle />` im `.app__header` ergänzen. Der Kopfbereich bricht dank `flex-wrap` bereits um — der Schalter darf die Status-Pille aber nicht aus dem sichtbaren Bereich drängen. Auf schmalen Bildschirmen (≤ 720 px) prüfen.

### Schritt 7 — Aufräumen

Alle verbliebenen harten Farbwerte in `app/globals.css` durch Tokens ersetzen (auch `.alert` und der Marker-Schatten) und mit `grep -nE '#[0-9a-fA-F]{3,6}|rgba?\(' app/globals.css` gegenprüfen. Jeder Treffer außerhalb der beiden Token-Blöcke ist ein Kandidat für einen Fehler im hellen Modus.

## 8. Zugänglichkeit

- Kontrast **≥ 4,5:1** für Text, **≥ 3:1** für Ränder und Icons — in **beiden** Schemata prüfen (z. B. mit dem Kontrast-Werkzeug der Browser-DevTools). Die Werte aus 6.2 sind ein Startpunkt, kein geprüftes Ergebnis.
- Der Moduswechsel darf Inhalt nicht verschieben (Layout bleibt stabil).
- Wird ein Farbübergang animiert: in `@media (prefers-reduced-motion: reduce)` abschalten. Ein weicher Übergang beim Laden würde das Aufblitzen (F7) wieder einführen — wenn Zweifel bestehen, ganz weglassen.
- Die Status-Pille darf ihren Zustand nicht **nur** über Farbe transportieren — sie hat bereits Text („Live" / „Verbindung unterbrochen"), das bleibt so.

## 9. Nicht im Scope

- Automatische Umschaltung nach Tageszeit oder Sonnenstand.
- Weitere Schemata über hell und dunkel hinaus; keine Nutzer-Anpassung einzelner Farben.
- Theme-Erkennung auf dem Server, Cookies oder ein Backend — `localStorage` genügt.
- Der Zustand `position.visibility` aus der API (das ist Bonus B3 des PRD und hat mit dieser Anweisung nichts zu tun).

## 10. Akzeptanzkriterien („Fertig, wenn …")

Stand der Prüfung: automatisiert in echtem Chrome (headless) gegen den Dev-Server geprüft, 55 Einzelprüfungen, alle bestanden. Die Systemeinstellung wurde dabei über `Emulation.setEmulatedMedia` in beide Richtungen umgestellt — dasselbe Verfahren wie das Umschalten im Betriebssystem.

- [x] Drei Modi im Kopfbereich wählbar; jeder wirkt sofort, ohne Neuladen.
- [x] Nach hartem Neuladen ist die gewählte Variante weiterhin aktiv.
- [x] Im Inkognito-Fenster ohne gespeicherte Wahl entspricht die Anzeige der Systemeinstellung (Test: OS einmal hell, einmal dunkel stellen).
- [x] Bei Modus **System** wechselt die Anzeige live mit, wenn die OS-Einstellung geändert wird — ohne Neuladen.
- [x] Die Karte zeigt im dunklen Modus dunkle Kacheln und im hellen OSM-Kacheln; die Attribution ist in beiden Fällen sichtbar und korrekt.
- [x] Beim Umschalten bleiben Zoomstufe, Kartenausschnitt und der letzte ISS-Stand erhalten (Karte wird nicht neu aufgebaut).
- [x] Kein FOUC: bei gedrosselter CPU (DevTools → Performance, 6× Verlangsamung) und leerem Cache erscheint nie kurzzeitig das falsche Schema.
- [x] `localStorage['iss-theme']` enthält genau einen von `light`, `dark`, `system`.
- [x] Ein manipulierter Wert (z. B. `localStorage.setItem('iss-theme','blau')`) führt zu keiner Fehlermeldung, sondern zu `system`.
- [x] Mit blockiertem `localStorage` funktioniert das Umschalten weiterhin (nur ohne Persistenz).
- [x] Der Schalter ist per Tab erreichbar, mit Enter/Leertaste bedienbar, der Fokus ist sichtbar.
- [x] Die Browser-Konsole ist in beiden Schemata fehlerfrei; kein Mixed-Content-Fehler (Anforderung aus PRD Abschnitt 5).
- [x] Die Ansicht ist auf ≤ 720 px Breite in beiden Schemata ohne Überlauf bedienbar.

Anmerkungen zur Prüfung:

- **FOUC** wurde schärfer geprüft als beschrieben: ein MutationObserver protokolliert jede Änderung von `data-theme`. Ergebnis: der Wert steht bereits bei `DOMContentLoaded` richtig und wechselt danach nie mehr (zwei Schreibvorgänge mit *demselben* Wert — Inline-Skript und Provider). Ohne die `ready`-Sperre im Provider stünde hier ein Wertewechsel, also ein sichtbares Aufblitzen.
- **Ohne gespeicherte Wahl** ist der Knopf **„System"** aktiv, nicht „Hell"/„Dunkel": angezeigt wird die Farbe des Systems, aber der *Modus* ist unbestimmt. Das ist so gewollt.
- `localStorage['iss-theme']` ist beim Erstbesuch **nicht gesetzt** (es gibt keine Wahl zu speichern). Erst der erste Klick schreibt einen Wert.

## 11. Manuelle Prüfliste

| # | Schritt | Erwartet |
|---|---|---|
| 1 | DevTools → Rendering → `prefers-color-scheme: dark` | App startet dunkel, ohne Speicherung |
| 2 | Auf „Hell" schalten | Alles hell, Karte hell, Attribution lesbar |
| 3 | Auf „Dunkel" schalten | Dunkle Kacheln, Status-Pille korrekt |
| 4 | Karte verschieben und zoomen, dann Schema wechseln | Ausschnitt und Zoom bleiben |
| 5 | Hard Reload | Gewähltes Schema sofort, ohne Blitz |
| 6 | zweiten Tab öffnen, dort Schema wechseln | Aktualisiert sich im ersten Tab (F9) |
| 7 | Modus „System", OS-Einstellung wechseln | Anzeige folgt live |
| 8 | Nur mit Tastatur bedienen | Fokus sichtbar, Auswahl möglich |

## 12. Offene Punkte

**Erledigt bei der Umsetzung:**

- **Helle Farbwerte (Abschnitt 6.2):** Kontrast geprüft. `--muted` musste von `#5b6b85` auf **`#57657e`** nachgedunkelt werden — im eingefärbten Hintergrund des Fehlerhinweises lag der Sekundärtext sonst bei 4,49:1, knapp unter der Schwelle. Schlechtester Fall jetzt **4,89:1**, alle Textpaare in beiden Schemata ≥ 4,8:1.
- **Schalter:** nur Text, keine Symbole. Drei kurze Wörter passen auch bei 375 px ohne Überlauf in den Kopfbereich.
- **F9 (Tab-Synchronisierung):** umgesetzt über den `storage`-Listener im Provider.
- **F10 (`theme-color` für die Browserleiste):** **nicht** umgesetzt. Der Wert müsste ebenfalls vor dem ersten Paint gesetzt werden, sonst färbt sich die Browserleiste sichtbar nach. Das ist mit dem jetzigen Inline-Skript nicht sauber zu haben und war als „Kann" markiert.

**Weiterhin offen:**

- **Rahmen unter 3:1.** Die Haarlinien um Karte, Panel und Messwert-Kacheln erreichen nur **1,34:1** (hell) bzw. **1,35:1** (dunkel) statt der in Abschnitt 8 genannten 3:1. Der dunkle Wert ist der unveränderte Bestandswert aus der Zeit vor diesem Feature — die hellen Werte wurden bewusst parallel dazu gewählt. Ein kontraststarker Rahmen würde beide Schemata deutlich schwerer wirken lassen und den Bestand ändern, den Abschnitt 6.1 unverändert übernehmen sollte. Zu entscheiden ist, ob die 3:1-Vorgabe aus Abschnitt 8 auf dekorative Flächenrahmen überhaupt angewendet werden soll.
- Ob der Startwert später von `system` auf `dunkel` gedreht wird, falls die Rückmeldung zu hell empfunden wird. Die Entscheidung aus Abschnitt 2 gilt für diese Umsetzung.

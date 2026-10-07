# Feature-Anweisung: Astronauten-Liste (Bonus B4)

> Bezug: `ai_docs/PRD.md`, Abschnitt 4 (Bonus B4). Diese Anweisung ergänzt den bestehenden Tracker um eine Liste der Menschen an Bord. Sie ist so geschrieben, dass sie ohne Rückfragen umgesetzt werden kann.

## 1. Ziel

Der Tracker zeigt bisher nur, **wo** die ISS ist. Ziel ist eine Liste der **Menschen, die gerade im All sind** — Name und Raumstation — unter den Messwerten in der rechten Spalte.

**Ergebnis:** Ein Panel „Menschen im All" mit der Anzahl und allen Namen, aktuell gehalten über einen Knopf.

**Das ist die schwerste Bonus-Aufgabe**, weil die Quelle nur über HTTP erreichbar ist und dafür erstmals eine Server-Route nötig wird (PRD Abschnitt 5: „Kein eigenes Backend — Ausnahme: Proxy für Bonus B4").

## 2. Entscheidungen (festgelegt, nicht mehr offen)

| Frage | Entscheidung |
|---|---|
| Quelle | `http://api.open-notify.org/astros.json` (kein API-Key) |
| Weg zum Browser | Route Handler `app/api/astros` — die einzige Server-Route der App |
| Abrufzeitpunkt | Einmal beim Öffnen, danach nur auf Klick auf „Aktualisieren" |
| Ort in der Oberfläche | Eigenes Panel in der rechten Spalte, unter den Messwerten |
| Angezeigte Felder | `name` und `craft` (Raumstation), dazu die Gesamtzahl |
| Verhalten bei Fehlern | Letzte Liste bleibt stehen, Knopf wird zu „Erneut versuchen" |

## 3. Warum ein Proxy nötig ist (nachgemessen)

| Prüfung | Ergebnis |
|---|---|
| `https://api.open-notify.org/astros.json` | Verbindung auf Port 443 wird verweigert (`curl` Fehler 7) |
| `http://api.open-notify.org/astros.json` | HTTP 200, `application/json`, ca. 587 Byte |
| Antwortzeit (5 Messungen) | 0,38 s / 0,45 s / 0,45 s / 3,38 s / 3,45 s |
| Antwortzeit aus dem Dev-Server heraus | bis 7,4 s (Einzelausreisser) |

Eine HTTPS-Seite darf keine HTTP-Anfrage stellen — der Browser blockiert sie als Mixed Content. Der Server darf das. Der Browser spricht deshalb **nur** mit der eigenen Adresse `/api/astros`, die in Produktion automatisch über HTTPS ausgeliefert wird. Dass im Client-Bundle kein `open-notify` mehr vorkommt, ist nachprüfbar:

```bash
grep -rl "open-notify" .next/static    # kein Treffer
grep -rl "api.open-notify.org" .next/server   # nur die Route
```

## 4. Funktionale Anforderungen

| ID | Anforderung | Priorität |
|---|---|---|
| F1 | Ein Panel zeigt alle Menschen aus `people` mit Namen. | Muss |
| F2 | Die Anzahl der Personen ist sichtbar. | Muss |
| F3 | Zu jeder Person ist die Raumstation (`craft`) erkennbar. | Muss |
| F4 | Die Liste lässt sich auf Klick aktualisieren. | Muss |
| F5 | Ist die Liste nicht zu bekommen, erscheint ein verständlicher Hinweis statt einer leeren Fläche (PRD F4). | Muss |
| F6 | Nach einem Fehler bleibt die zuletzt erhaltene Liste stehen. | Muss |
| F7 | Der Browser stellt keine HTTP-Anfrage; die Konsole zeigt keinen Mixed-Content-Fehler (PRD Abschnitt 5). | Muss |
| F8 | Der Knopf ist mit der Tastatur bedienbar und hat einen sichtbaren Fokusring. | Muss |
| F9 | Unvollständige Einträge der Quelle werden übersprungen statt die Liste zu kosten. | Muss |
| F10 | Während des Ladens ist der Knopf gesperrt und beschriftet („Lädt …"). | Kann |

## 5. Aufbau

```
Browser ──HTTPS──► /api/astros (Route Handler, Node)
                        │
                        └──HTTP──► api.open-notify.org/astros.json
```

Drei neue Dateien, eine geänderte:

| Datei | Aufgabe |
|---|---|
| `app/api/astros/route.js` | Server-Route: holt die Quelle über HTTP, prüft sie, gibt eine bereinigte Liste über HTTPS zurück |
| `app/lib/astros.js` | Browser-Seite des Zugriffs: `fetchAstronauts(signal)`, wirft verständliche Fehler |
| `app/components/AstronautList.jsx` | Zustand und Darstellung des Panels |
| `app/components/IssTracker.jsx` | Panel in die rechte Spalte eingehängt |

Die Trennung entspricht der bestehenden Aufteilung: `lib/` kennt nur den Abruf, die Komponente nur die Anzeige.

## 6. Die Server-Route im Einzelnen

- **`export const dynamic = 'force-dynamic'`** — die Route darf nicht beim Build eingefroren werden; sie muss bei jeder Anfrage frisch holen.
- **Zeitlimit 8 s** (`AbortSignal.timeout`). Die Quelle antwortet normalerweise in unter einer Sekunde, wurde aber schon mit 3,4 s und einmal mit 7,4 s gemessen. Ohne Limit hängt die Route so lange, bis die Plattform sie abbricht — dann käme beim Browser gar keine Antwort mehr an. Oberhalb von 8 s sind 502 und ein klarer Hinweis die bessere Antwort als ein hängender Aufruf.
- **`Cache-Control: no-store`** auf allen Antworten, auch auf den Fehlerantworten: sonst zeigt der Browser nach „Aktualisieren" den alten Stand bzw. hält einen alten Fehler fest.
- **Bereinigung statt Durchreichen.** Die Antwort ist `{ number, people: [{ name, craft }] }`. Einträge ohne brauchbaren Namen fallen weg, ein fehlendes `craft` wird zu `''` und die Anzeige lässt das Abzeichen dann einfach weg. Ein einzelner kaputter Datensatz darf nicht die ganze Liste kosten.
- **Kein Durchreichen von Fehlerdetails der Quelle** — die Texte sind deutsch und für die Nutzerin geschrieben.

## 7. Verhalten im Browser

- Der Abruf läuft **einmal beim Öffnen** — nicht im 5-Sekunden-Takt wie die Position. Die Crew wechselt nur alle paar Monate; ein Polling würde nur Last erzeugen.
- Der Ladezustand sperrt den Knopf und beschriftet ihn „Lädt …"; danach steht dort „Aktualisieren", im Fehlerfall „Erneut versuchen".
- Der AufräumEffekt bricht einen laufenden Abruf beim Verlassen der Seite ab. Wie in `IssTracker` wird `AbortError` geschluckt, damit der Abbruch nicht als Fehler in der Oberfläche landet.
- Ein zweiter Klick kann den ersten nicht überholen: der Knopf ist während des Ladens gesperrt, und ein neuer Abruf bricht den vorherigen ab.

## 8. Anordnung in der Oberfläche

Das Grid `.app__body` hatte bisher genau zwei Kinder (Karte, Messwerte-Panel). Die rechte Spalte wurde zu einem eigenen Flex-Container `.app__aside`, der Messwerte und Liste untereinander aufnimmt. Damit bleibt das Grid bei zwei Spalten, und die schmale Ansicht (≤ 720 px) stapelt weiterhin korrekt.

Der Knopf steht in einer eigenen Zeile (`.panel__foot`) und nicht neben der Überschrift: In der 280 px breiten Spalte passt „Menschen im All" zusammen mit Zähler und Knopf nicht in eine Zeile — der Titel brach um.

## 9. Prüfung

Stand der Prüfung: automatisiert in echtem Chrome (headless, über das DevTools-Protokoll) gegen Dev- **und** Produktions-Build (`npm run build` + `npm start`). Geprüft wurden vier Szenarien — hell (1400 px), dunkel (1400 px), schmal (375 px) und Fehlerfall (Netzwerk blockiert) — dazu die Tastaturbedienung und die Server-Route isoliert.

### Akzeptanzkriterien („Fertig, wenn …")

- [x] Das Panel zeigt alle 12 Personen aus der Quelle mit Namen; die Anzahl steht daneben.
- [x] Die Raumstation ist je Person ablesbar („ISS" bzw. „Tiangong").
- [x] Klick auf „Aktualisieren" holt die Liste neu (`GET /api/astros 200`), der Knopf zeigt währenddessen „Lädt …" und ist gesperrt.
- [x] Die Server-Route antwortet über HTTPS mit `200`, `content-type: application/json` und `cache-control: no-store`.
- [x] Im Client-Bundle kommt `open-notify` nicht vor; die Konsole ist in allen vier Szenarien fehlerfrei (kein Mixed-Content-Eintrag, keine Ausnahme).
- [x] Ist die Route nicht erreichbar, erscheint „Die Liste ist gerade nicht erreichbar." statt einer leeren Fläche; die Karte und die Messwerte laufen ungestört weiter.
- [x] Nach einem Fehler wird der Knopf zu „Erneut versuchen"; nach Wiederherstellung des Netzes füllt ein Klick die Liste (12 Einträge) und der Hinweis verschwindet.
- [x] Der Knopf ist per Tab erreichbar, mit Enter und Leertaste auslösbar, der Fokusring ist sichtbar (2 px `--accent`).
- [x] Kein waagerechter Überlauf bei 375 px, 720 px und 1400 px Breite (hell und dunkel).
- [x] Die Kartenbedienung bleibt unberührt: Zoomstufe und Ausschnitt ändern sich beim Laden der Liste nicht.
- [x] Der Produktions-Build läuft fehlerfrei durch; `/api/astros` wird als „Dynamic" geführt, nicht vorgerendert.
- [x] `app/globals.css` enthält weiterhin keine harten Farbwerte außerhalb der Token-Blöcke (neue Regeln nutzen nur Tokens).

### Fehlerpfade der Server-Route (isoliert geprüft)

| Fall | Antwort |
|---|---|
| Quelle nicht erreichbar / Zeitüberschreitung | 502 „Die Astronauten-Datenquelle ist nicht erreichbar." |
| Quelle antwortet mit Fehlerstatus | 502 „… antwortet mit Fehler `<status>`." |
| Antwort ist kein gültiges JSON | 502 „… liefert unerwartete Daten." |
| Antwort ist kein Objekt mit `people`-Liste | 502 „… liefert unerwartete Daten." |
| Eintrag ohne Namen / `null` | wird übersprungen |
| `craft` fehlt oder ist kein Text | Eintrag bleibt, Abzeichen entfällt |
| Namen mit Leerzeichen | werden getrimmt |

## 10. Manuelle Prüfliste

| # | Schritt | Erwartet |
|---|---|---|
| 1 | `npm run dev`, Seite öffnen | Panel „Menschen im All" erscheint; die Liste kann einige Sekunden auf sich warten lassen |
| 2 | DevTools → Network | Nur `GET /api/astros` an die eigene Adresse; **kein** Aufruf an `open-notify.org` aus dem Browser |
| 3 | Auf „Aktualisieren" klicken | Knopf wird kurz zu „Lädt …", Liste bleibt bzw. wird neu gefüllt |
| 4 | DevTools → Network → `/api/astros` blockieren, Seite neu laden | Hinweis im Panel, Knopf heißt „Erneut versuchen", Karte und Messwerte laufen weiter |
| 5 | Blockade aufheben, „Erneut versuchen" klicken | Liste füllt sich, Hinweis verschwindet |
| 6 | Farbschema umschalten | Panel wechselt mit, Abzeichen bleiben lesbar |
| 7 | Fenster auf 375 px ziehen | Panel rutscht unter die Messwerte, kein waagerechter Scrollbalken |
| 8 | Nur mit der Tastatur bedienen | Knopf erreichbar, Fokusring sichtbar, Enter und Leertaste lösen aus |
| 9 | Nach dem Deploy: Konsole auf der Live-URL | Kein Mixed-Content-Fehler; `Network` zeigt den `/api/astros`-Aufruf über HTTPS |

## 11. Offene Punkte

**Entschieden bei der Umsetzung:**

- **Kein Polling für die Liste**, sondern ein Knopf. Die Crew wechselt nur alle paar Monate; das 5-Sekunden-Polling des PRD gilt für die Position, nicht für diese Liste.
- **Zeitlimit 8 s** statt keines: Die Quelle war in einer Messung 7,4 s langsam. Das Limit liegt unter dem, was die Plattform ohnehin abbrechen würde, und oberhalb der üblichen Antwortzeiten.
- **`craft` wird angezeigt, aber nicht gruppiert.** Die Liste enthält auch die Besatzung der chinesischen Station Tiangong; die Sortierung der Quelle (ISS zuerst) bleibt erhalten, die Zuordnung steht als Abzeichen in der Zeile. Eine Gruppierung mit Zwischenüberschriften wäre bei zwölf Zeilen mehr Rahmen als Inhalt.
- **Der Knopf steht in einer eigenen Zeile.** Neben der Überschrift war die Zeile in der 280 px breiten Spalte zu eng (siehe Abschnitt 8).

**Weiterhin offen:**

- **Das Zeitlimit greift gelegentlich.** Bei einer der Prüfungen antwortete die Quelle länger als 8 s; die Route lieferte daraufhin 502 und das Panel zeigte den Hinweis mit „Erneut versuchen" — genau das gewünschte Verhalten, aber die Liste fehlt dann beim ersten Öffnen. Ursache ist die schwankende Antwortzeit der Quelle (gemessen: 0,37 s bis 4,4 s, mit Ausreissern darüber). Ein höheres Limit wäre möglich, liegt aber über dem, was die Plattform ohnehin abbricht — dann käme statt der deutschen Meldung ein nackter Fehler der Plattform an.
- **Erster Aufbau kann mehrere Sekunden dauern.** Beim Öffnen der Seite steht im Panel so lange „Liste wird geladen …". Ein Vorabruf beim Rendern der Seite wäre möglich (die Route ist eine Server-Route), würde aber die Startseite von einer zweiten, langsamen Quelle abhängig machen — der Knopf erschien als der bessere Handel.
- **Die Liste veraltet innerhalb einer langen Sitzung stillschweigend.** Es gibt keinen Hinweis darauf, wie alt der angezeigte Stand ist. Die Position hat dafür einen Zeitstempel, die Liste nicht; die Quelle liefert keinen.
- **`number` aus der Quelle wird nicht angezeigt, sondern `people.length`.** Die beiden können auseinandergehen, wenn Einträge bereinigt wurden; angezeigt wird die Zahl, die zur sichtbaren Liste passt.
- **Die Route hat keine eigene Absicherung gegen Fremdaufrufe.** Sie ist öffentlich lesbar, verrät aber nichts und kostet nur den einen Upstream-Abruf. Ein Rate-Limit wäre erst nötig, wenn die Route mehr täte.

// Einzige Server-Route der App (Bonus B4 aus dem PRD). Sie existiert, weil
// open-notify.org ausschliesslich über HTTP erreichbar ist: Port 443 nimmt
// keine Verbindung an. Der Browser würde die Anfrage von der HTTPS-Seite aus
// als Mixed Content blockieren — der Server darf das. Alles andere läuft
// weiterhin direkt im Browser.
export const dynamic = 'force-dynamic';

const ASTROS_URL = 'http://api.open-notify.org/astros.json';

// Die Quelle antwortet gelegentlich sehr langsam. Ohne Zeitlimit hängt die
// Route, bis die Plattform sie abbricht — dann käme beim Browser gar keine
// Antwort mehr an.
const TIMEOUT_MS = 8000;

// no-store auch für den Browser: sonst zeigt die Liste nach einem Klick auf
// „Aktualisieren" weiterhin den alten Stand. Fehlerantworten tragen den Kopf
// ebenfalls, damit kein Zwischenspeicher einen alten Fehler festhält.
const NO_STORE = { 'Cache-Control': 'no-store' };

function fail(message, status = 502) {
  return Response.json({ error: message }, { status, headers: NO_STORE });
}

export async function GET() {
  let response;
  try {
    response = await fetch(ASTROS_URL, {
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return fail('Die Astronauten-Datenquelle ist nicht erreichbar.');
  }

  if (!response.ok) {
    return fail(`Die Astronauten-Datenquelle antwortet mit Fehler ${response.status}.`);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    return fail('Die Astronauten-Datenquelle liefert unerwartete Daten.');
  }

  if (!Array.isArray(data?.people)) {
    return fail('Die Astronauten-Datenquelle liefert unerwartete Daten.');
  }

  // Nur weitergeben, was die App anzeigt, und nur brauchbare Einträge: Ein
  // einzelner unvollständiger Datensatz darf nicht die ganze Liste kosten.
  const people = data.people
    .filter((person) => typeof person?.name === 'string' && person.name.trim() !== '')
    .map((person) => ({
      name: person.name.trim(),
      craft: typeof person.craft === 'string' ? person.craft.trim() : '',
    }));

  return Response.json({ number: people.length, people }, { headers: NO_STORE });
}

// Die Astronauten-Liste kommt über die eigene Route app/api/astros: Die Quelle
// open-notify.org ist nur über HTTP erreichbar und würde im Browser als Mixed
// Content blockiert. Der Aufruf geht deshalb an die eigene, in Produktion
// automatisch per HTTPS ausgelieferte Adresse.
export const ASTROS_API_URL = '/api/astros';

/**
 * Holt die Namen der Menschen an Bord.
 * Wirft einen Error mit verständlichem Text, wenn die Liste nicht zu bekommen ist.
 */
export async function fetchAstronauts(signal) {
  let response;
  try {
    response = await fetch(ASTROS_API_URL, { cache: 'no-store', signal });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Keine Verbindung zum eigenen Server.');
  }

  if (!response.ok) {
    // Die Route schickt bei Fehlern einen fertigen deutschen Text mit - der ist
    // genauer als "Fehler 502" und wird deshalb bevorzugt.
    const detail = await response.json().catch(() => null);
    throw new Error(detail?.error ?? `Der Server antwortet mit Fehler ${response.status}.`);
  }

  const data = await response.json();

  if (!Array.isArray(data?.people)) {
    throw new Error('Der Server liefert unerwartete Daten.');
  }

  return data.people;
}

// Datenquelle: https://wheretheiss.at — kostenlos, kein API-Key, ausschliesslich HTTPS.
export const ISS_API_URL = 'https://api.wheretheiss.at/v1/satellites/25544';

/** Abstand zwischen zwei Abfragen in Millisekunden. */
export const POLL_INTERVAL_MS = 5000;

/**
 * Holt die aktuelle Position der ISS.
 * Wirft einen Error mit verständlichem Text, wenn die API nicht antwortet.
 */
export async function fetchIssPosition(signal) {
  let response;
  try {
    // cache: 'no-store' — sonst liefert der Browser die alte Position aus dem Cache.
    response = await fetch(ISS_API_URL, { cache: 'no-store', signal });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Keine Verbindung zur ISS-Datenquelle.');
  }

  if (!response.ok) {
    throw new Error(`Die ISS-Datenquelle antwortet mit Fehler ${response.status}.`);
  }

  const data = await response.json();

  if (typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
    throw new Error('Die ISS-Datenquelle liefert unerwartete Daten.');
  }

  return {
    latitude: data.latitude,
    longitude: data.longitude,
    altitude: data.altitude, // km
    velocity: data.velocity, // km/h
    visibility: data.visibility, // 'daylight' | 'eclipsed'
    timestamp: data.timestamp, // Unix-Sekunden
  };
}

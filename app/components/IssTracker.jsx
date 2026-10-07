'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import AstronautList from './AstronautList';
import IssMap from './IssMap';
import ThemeToggle from './ThemeToggle';
import { ISS_ICON_SVG } from '../lib/issIcon';
import { POLL_INTERVAL_MS, fetchIssPosition } from '../lib/iss';

function formatCoordinate(value, positive, negative) {
  if (typeof value !== 'number') return '–';
  return `${Math.abs(value).toFixed(4)}° ${value >= 0 ? positive : negative}`;
}

function formatNumber(value, unit) {
  if (typeof value !== 'number') return '–';
  return `${Math.round(value).toLocaleString('de-DE')} ${unit}`;
}

export default function IssTracker() {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const abortRef = useRef(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const next = await fetchIssPosition(controller.signal);
      setPosition(next);
      setError(null);
    } catch (caught) {
      if (caught.name === 'AbortError') return;
      // Letzter bekannter Stand bleibt stehen, das Polling läuft weiter.
      setError(caught.message);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      clearInterval(timer);
      abortRef.current?.abort();
    };
  }, [load]);

  const isStale = Boolean(error);

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__brand">
          <span
            className="brand-mark"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: ISS_ICON_SVG }}
          />
          <div>
            <h1>ISS Live-Tracker</h1>
            <p className="app__subtitle">
              Live-Position der Internationalen Raumstation — aktualisiert alle 5 Sekunden.
            </p>
          </div>
        </div>
        <div className="app__actions">
          <span className={`status status--${isStale ? 'warn' : loading ? 'idle' : 'live'}`}>
            {isStale ? 'Verbindung unterbrochen' : loading ? 'Verbinde …' : 'Live'}
          </span>
          <ThemeToggle />
        </div>
      </header>

      {isStale && (
        <div className="alert" role="status">
          <strong>Die ISS-Daten sind gerade nicht erreichbar.</strong>{' '}
          <span>
            {position
              ? 'Auf der Karte siehst du den zuletzt empfangenen Stand. '
              : 'Die Karte ist noch leer. '}
            Ein neuer Versuch läuft automatisch.
          </span>
          {error && <span className="alert__detail"> ({error})</span>}
        </div>
      )}

      <main className="app__body">
        <section className="app__map">
          <IssMap latitude={position?.latitude} longitude={position?.longitude} />
        </section>

        <div className="app__aside">
          <aside className="panel" aria-label="Messwerte der ISS">
            <dl className="stats">
              <div className="stat">
                <dt>Breitengrad</dt>
                <dd>{formatCoordinate(position?.latitude, 'N', 'S')}</dd>
              </div>
              <div className="stat">
                <dt>Längengrad</dt>
                <dd>{formatCoordinate(position?.longitude, 'O', 'W')}</dd>
              </div>
              <div className="stat">
                <dt>Höhe</dt>
                <dd>{formatNumber(position?.altitude, 'km')}</dd>
              </div>
              <div className="stat">
                <dt>Geschwindigkeit</dt>
                <dd>{formatNumber(position?.velocity, 'km/h')}</dd>
              </div>
            </dl>

            <p className="panel__footer">
              {position
                ? `Letzte Aktualisierung: ${new Date(position.timestamp * 1000).toLocaleTimeString('de-DE')} Uhr`
                : 'Noch keine Daten empfangen.'}
            </p>
          </aside>

          <AstronautList />
        </div>
      </main>
    </div>
  );
}

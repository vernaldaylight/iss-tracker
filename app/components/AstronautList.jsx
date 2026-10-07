'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchAstronauts } from '../lib/astros';

export default function AstronautList() {
  const [people, setPeople] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(true);

  const abortRef = useRef(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setBusy(true);
    try {
      setPeople(await fetchAstronauts(controller.signal));
      setError(null);
    } catch (caught) {
      if (caught.name === 'AbortError') return;
      // Wie beim ISS-Abruf: Der letzte Stand bleibt stehen.
      setError(caught.message);
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }, []);

  // Die Crew wechselt nur alle paar Monate. Ein einmaliger Abruf beim Öffnen
  // genügt deshalb; aktualisiert wird auf Wunsch über den Knopf.
  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  return (
    <aside className="panel" aria-label="Menschen im All">
      <div className="panel__head">
        <h2 className="panel__title">Menschen im All</h2>
        {people && <span className="chip">{people.length}</span>}
      </div>

      {error && (
        <p className="alert alert--inline" role="status">
          {people
            ? 'Die Liste konnte nicht aktualisiert werden — angezeigt wird der letzte Stand.'
            : 'Die Liste ist gerade nicht erreichbar.'}
          <span className="alert__detail"> ({error})</span>
        </p>
      )}

      {people ? (
        <ul className="crew">
          {people.map((person) => (
            <li className="crew__item" key={`${person.craft}/${person.name}`}>
              <span>{person.name}</span>
              {person.craft && <span className="crew__craft">{person.craft}</span>}
            </li>
          ))}
        </ul>
      ) : (
        !error && <p className="panel__footer">Liste wird geladen …</p>
      )}

      {/* Der Knopf steht in einer eigenen Zeile: In der 280 px breiten Spalte
          passt er nicht neben die Überschrift. */}
      <div className="panel__foot">
        <button type="button" className="button" onClick={load} disabled={busy}>
          {busy ? 'Lädt …' : error ? 'Erneut versuchen' : 'Aktualisieren'}
        </button>
      </div>
    </aside>
  );
}

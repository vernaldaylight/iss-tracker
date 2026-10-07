'use client';

import { useEffect, useRef, useState } from 'react';
import { ISS_ICON_SVG } from '../lib/issIcon';
import { useTheme } from '../lib/ThemeProvider';
import 'leaflet/dist/leaflet.css';

// Leaflet braucht das window-Objekt. Es wird deshalb erst im Effekt geladen
// und nie serverseitig gerendert.
let leafletPromise;

function loadLeaflet() {
  if (!leafletPromise) {
    leafletPromise = import('leaflet').then((mod) => mod.default);
  }
  return leafletPromise;
}

const INITIAL_ZOOM = 3;
const MARKER_SIZE = 44;

// Die OSM-Standardkacheln sind hell und passen zum hellen Layout. Für das
// dunkle Layout braucht es einen eigenen Kachelsatz, sonst bliebe die Karte ein
// helles Fenster im dunklen Rahmen. Beide Quellen verlangen ihre Attribution.
const ATTRIBUTION_OSM =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>-Mitwirkende';

// Für die dunkle Karte wurde zuerst CARTO verwendet. Dessen Kacheln liefern
// ohne API-Key aber nur noch ein Wasserzeichen "API KEY REQUIRED" aus — das
// PRD verbietet Keys im Code, also unbrauchbar. Esri liefert denselben Zweck
// ohne Key.
const ATTRIBUTION_ESRI =
  '&copy; <a href="https://www.esri.com/" target="_blank" rel="noreferrer">Esri</a>, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>-Mitwirkende';

const TILE_SOURCES = {
  light: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxNativeZoom: 19,
    attribution: ATTRIBUTION_OSM,
  },
  dark: {
    // Achtung: Esri gibt y vor x an. Das Muster ist NICHT das der OSM-URL.
    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    // Der Dienst liefert nur bis Zoomstufe 16. maxNativeZoom lässt Leaflet
    // darüber hinaus die vorhandenen Kacheln hochskalieren, statt fehlende
    // anzufordern (die sonst als graue Fläche erschienen).
    maxNativeZoom: 16,
    attribution: ATTRIBUTION_ESRI,
  },
};

const MAX_ZOOM = 19;

export default function IssMap({ latitude, longitude }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const markerRef = useRef(null);
  const positionRef = useRef(null);
  // Nur der erste Fix zentriert die Karte — danach bleibt der Ausschnitt
  // dort, wo die Nutzerin ihn hingeschoben hat.
  const centeredRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const { resolvedTheme } = useTheme();

  positionRef.current =
    typeof latitude === 'number' && typeof longitude === 'number'
      ? [latitude, longitude]
      : null;

  // Karte einmalig aufbauen.
  useEffect(() => {
    let cancelled = false;

    loadLeaflet().then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: positionRef.current ?? [0, 0],
        zoom: INITIAL_ZOOM,
        minZoom: 2,
        worldCopyJump: true,
        zoomControl: true,
      });

      leafletRef.current = L;
      mapRef.current = map;
      centeredRef.current = Boolean(positionRef.current);
      setMapReady(true);
    });

    return () => {
      cancelled = true;
      setMapReady(false);
      centeredRef.current = false;
      markerRef.current = null;
      leafletRef.current = null;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Kachelsatz passend zum Farbschema. Bewusst ein eigener Effekt: die Karte
  // wird oben nur einmal aufgebaut, ein Schemawechsel darf Zoomstufe und
  // Ausschnitt der Nutzerin nicht zurücksetzen. Die Aufräumfunktion entfernt
  // das alte Layer, bevor das neue dazukommt.
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!mapReady || !L || !map) return;

    const source = TILE_SOURCES[resolvedTheme] ?? TILE_SOURCES.light;
    const layer = L.tileLayer(source.url, {
      maxZoom: MAX_ZOOM,
      maxNativeZoom: source.maxNativeZoom,
      attribution: source.attribution,
    }).addTo(map);

    return () => layer.remove();
  }, [mapReady, resolvedTheme]);

  // Marker bei jeder neuen Position nachführen; beim ersten Fix zusätzlich
  // auf die ISS schwenken, damit der Marker nicht außerhalb des Ausschnitts liegt.
  // Ohne Daten gibt es keinen Marker — er stünde sonst auf 0°/0°.
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!mapReady || !L || !map) return;
    if (typeof latitude !== 'number' || typeof longitude !== 'number') return;

    const latlng = [latitude, longitude];

    if (!markerRef.current) {
      // Eigenes DivIcon: umgeht die Bildpfade des Leaflet-Standardicons,
      // die in Bundlern ins Leere zeigen.
      const icon = L.divIcon({
        html: ISS_ICON_SVG,
        className: 'iss-marker',
        iconSize: [MARKER_SIZE, MARKER_SIZE],
        iconAnchor: [MARKER_SIZE / 2, MARKER_SIZE / 2],
      });
      markerRef.current = L.marker(latlng, {
        icon,
        keyboard: false,
        title: 'ISS',
      }).addTo(map);
    } else {
      markerRef.current.setLatLng(latlng);
    }

    if (!centeredRef.current) {
      map.setView(latlng, INITIAL_ZOOM);
      centeredRef.current = true;
    }
  }, [mapReady, latitude, longitude]);

  return <div className="map" ref={containerRef} role="img" aria-label="Weltkarte mit der aktuellen Position der ISS" />;
}

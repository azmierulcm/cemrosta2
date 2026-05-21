'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface SummaryMapLeafletProps {
  mapCoords: { code: string; coords: [number, number] }[]; // coords are [lng, lat] from parent
  topRoute: { from: string; to: string; count: number } | null;
}

// Parent stores coords as [lng, lat] (react-simple-maps convention)
// Leaflet needs [lat, lng] — swap here
function toLL([lng, lat]: [number, number]): [number, number] {
  return [lat, lng];
}

function ZoomControls() {
  const map = useMap();
  return (
    <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1">
      <button
        onClick={() => map.zoomIn()}
        className="w-7 h-7 rounded-lg border border-border bg-bg text-text-muted hover:text-text hover:bg-surface flex items-center justify-center text-[14px] font-black transition-colors shadow-sm"
        aria-label="Zoom in"
      >+</button>
      <button
        onClick={() => map.zoomOut()}
        className="w-7 h-7 rounded-lg border border-border bg-bg text-text-muted hover:text-text hover:bg-surface flex items-center justify-center text-[14px] font-black transition-colors shadow-sm"
        aria-label="Zoom out"
      >−</button>
    </div>
  );
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(L.latLngBounds(positions), { padding: [36, 36], maxZoom: 6 });
    } else {
      map.setView([10, 105], 4);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions.length]);
  return null;
}

const ACCENT       = '#e5484d';
const ACCENT_ALPHA = 'rgba(229,72,77,0.14)';

// Tiny SVG label rendered as a Leaflet DivIcon — avoids all tooltip CSS battles
function LabelMarker({
  position,
  label,
  color = '#222',
}: {
  position: [number, number];
  label: string;
  color?: string;
}) {
  const map = useMap();

  useEffect(() => {
    const marker = L.marker(position, {
      icon: L.divIcon({
        className: '',
        html: `<span style="
          font-family: var(--font-inter), Inter, sans-serif;
          font-size: 10px;
          font-weight: 800;
          color: ${color};
          white-space: nowrap;
          text-shadow: 0 1px 3px rgba(255,255,255,0.9), 0 0 6px rgba(255,255,255,0.9);
          pointer-events: none;
        ">${label}</span>`,
        iconAnchor: [label.length * 3.2, 20],
      }),
      interactive: false,
      zIndexOffset: 500,
    });
    marker.addTo(map);
    return () => { marker.remove(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label, position[0], position[1]]);

  return null;
}

export default function SummaryMapLeaflet({ mapCoords, topRoute }: SummaryMapLeafletProps) {
  const kulEntry  = mapCoords.find((p) => p.code === 'KUL');
  const kulLL     = toLL(kulEntry?.coords ?? [101.71, 2.74]);
  const dests     = mapCoords.filter((p) => p.code !== 'KUL');
  const allLL     = mapCoords.map((p) => toLL(p.coords));

  return (
    <MapContainer
      center={kulLL}
      zoom={3}
      scrollWheelZoom={true}
      zoomControl={false}
      attributionControl={false}
      style={{ height: '100%', width: '100%', minHeight: 300, background: '#f2f2f0', position: 'relative' }}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />

      <FitBounds positions={allLL} />
      <ZoomControls />

      {/* Route lines */}
      {dests.map(({ code, coords }) => {
        const isTop = code === topRoute?.to;
        return (
          <Polyline
            key={code}
            positions={[kulLL, toLL(coords)]}
            pathOptions={{
              color:     ACCENT,
              weight:    isTop ? 2 : 1.5,
              opacity:   isTop ? 0.9 : 0.4,
              dashArray: isTop ? '6 8' : '3 10',
            }}
          />
        );
      })}

      {/* Destination markers */}
      {dests.map(({ code, coords }) => {
        const isTop = code === topRoute?.to;
        const ll    = toLL(coords);
        return (
          <React.Fragment key={code}>
            <CircleMarker
              center={ll}
              radius={isTop ? 11 : 7}
              pathOptions={{ color: 'transparent', fillColor: ACCENT_ALPHA, fillOpacity: 1, weight: 0 }}
            />
            <CircleMarker
              center={ll}
              radius={isTop ? 5 : 3.5}
              pathOptions={{ color: 'white', fillColor: ACCENT, fillOpacity: 1, weight: isTop ? 1.5 : 1 }}
            />
            {isTop && <LabelMarker position={ll} label={code} />}
          </React.Fragment>
        );
      })}

      {/* KUL home marker */}
      <CircleMarker
        center={kulLL}
        radius={14}
        pathOptions={{ color: 'transparent', fillColor: ACCENT_ALPHA, fillOpacity: 1, weight: 0 }}
      />
      <CircleMarker
        center={kulLL}
        radius={6}
        pathOptions={{ color: 'white', fillColor: ACCENT, fillOpacity: 1, weight: 2 }}
      />
      <LabelMarker position={kulLL} label="KUL" color={ACCENT} />
    </MapContainer>
  );
}

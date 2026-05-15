'use client';

import React, { useMemo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Line,
  Marker
} from 'react-simple-maps';
import { DutyEvent } from '@/types';
import { MapPin } from 'lucide-react';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const IATA_COORDS: Record<string, [number, number]> = {
  'KUL': [101.7099, 2.7456],
  'LHR': [-0.4543, 51.4700],
  'CAN': [113.2988, 23.3924],
  'NRT': [140.3929, 35.7720],
  'SYD': [151.1772, -33.9461],
  'IST': [28.7519, 41.2753],
  'SIN': [103.9915, 1.3644],
  'CDG': [2.5479, 49.0097],
  'DXB': [55.3657, 25.2532],
};

const FlightMap = ({ events }: { events: DutyEvent[] }) => {
  const routes = useMemo(() => {
    const r: any[] = [];
    events.forEach((event) => {
      if (event.type === 'FLIGHT' && event.depPort && event.arrPort) {
        const from = IATA_COORDS[event.depPort.toUpperCase()];
        const to = IATA_COORDS[event.arrPort.toUpperCase()];
        if (from && to) {
          r.push({ from, to });
        }
      }
    });
    return r;
  }, [events]);

  const uniquePorts = useMemo(() => {
    const ports = new Set<string>();
    events.forEach(e => {
        if (e.depPort) ports.add(e.depPort.toUpperCase());
        if (e.arrPort) ports.add(e.arrPort.toUpperCase());
    });
    return Array.from(ports).filter(p => IATA_COORDS[p]);
  }, [events]);

  return (
    <div className="w-full h-[500px] rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-card bg-slate-50 mb-16 relative">
      <ComposableMap
        projectionConfig={{
          rotate: [-120, 0, 0],
          scale: 140
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#E2E8F0"
                stroke="#FFFFFF"
                strokeWidth={0.5}
                style={{
                  default: { outline: "none" },
                  hover: { outline: "none", fill: "#CBD5E1" },
                  pressed: { outline: "none" },
                }}
              />
            ))
          }
        </Geographies>
        
        {routes.map((route, i) => (
          <Line
            key={i}
            from={route.from}
            to={route.to}
            stroke="#FF5A5F"
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray="4 4"
          />
        ))}

        {uniquePorts.map(port => {
            const coords = IATA_COORDS[port];
            return (
                <Marker key={port} coordinates={coords as [number, number]}>
                    <circle r={4} fill="#FF5A5F" stroke="#FFF" strokeWidth={2} className="shadow-lg" />
                    <text
                        textAnchor="middle"
                        y={-12}
                        style={{ fontFamily: "Inter", fontSize: "10px", fontWeight: "black", fill: "#111827" }}
                        className="uppercase"
                    >
                        {port}
                    </text>
                </Marker>
            );
        })}
      </ComposableMap>
      
      <div className="absolute top-6 left-6 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-white shadow-sm z-10">
        <p className="text-[10px] font-black text-gray-900 flex items-center gap-2 tracking-widest uppercase">
            <MapPin size={12} className="text-rausch" />
            Mission Tracker
        </p>
      </div>
    </div>
  );
};

export default FlightMap;

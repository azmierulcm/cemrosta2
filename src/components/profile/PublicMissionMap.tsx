'use client';

import React from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Line,
  Marker
} from 'react-simple-maps';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface Route {
  from: [number, number]; // [lon, lat]
  to: [number, number];
}

const PublicMissionMap = () => {
  const routes: Route[] = [
    { from: [101.7099, 2.7456], to: [-0.4543, 51.4700] }, // KUL to LHR
    { from: [101.7099, 2.7456], to: [113.2988, 23.3924] }, // KUL to CAN
    { from: [101.7099, 2.7456], to: [140.3929, 35.7720] }, // KUL to NRT
  ];

  const markers = [
    { name: "KUL", coordinates: [101.7099, 2.7456] },
    { name: "LHR", coordinates: [-0.4543, 51.4700] },
    { name: "CAN", coordinates: [113.2988, 23.3924] },
    { name: "NRT", coordinates: [140.3929, 35.7720] },
  ];

  return (
    <div className="w-full h-[400px] bg-slate-50 rounded-[2.5rem] overflow-hidden border border-gray-100 relative group">
      <ComposableMap
        projectionConfig={{
          rotate: [-120, 0, 0],
          scale: 120
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
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeDasharray="4 4"
          />
        ))}

        {markers.map(({ name, coordinates }) => (
          <Marker key={name} coordinates={coordinates as [number, number]}>
            <circle r={3} fill="#FF5A5F" stroke="#FFF" strokeWidth={1} />
            <text
              textAnchor="middle"
              y={-10}
              style={{ fontFamily: "Inter", fontSize: "8px", fontWeight: "bold", fill: "#1F2937" }}
            >
              {name}
            </text>
          </Marker>
        ))}
      </ComposableMap>

      <div className="absolute top-6 left-6 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-white shadow-sm z-10">
        <p className="text-[10px] font-black text-gray-900 tracking-widest uppercase">
          Current Month Operations
        </p>
      </div>
    </div>
  );
};

export default PublicMissionMap;

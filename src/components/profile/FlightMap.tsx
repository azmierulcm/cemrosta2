'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { DutyEvent } from '@/types';
import { MapPin, ExternalLink } from 'lucide-react';

// Dynamically import Leaflet map to avoid SSR "window is not defined" issues
const LeafletMap = dynamic(() => import('./LeafletMap'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-rausch/20 border-t-rausch rounded-full animate-spin" />
    </div>
  )
});

const IATA_CITIES: Record<string, string> = {
  'KUL': 'Kuala Lumpur International Airport',
  'LHR': 'London Heathrow Airport',
  'CAN': 'Guangzhou Baiyun International Airport',
  'NRT': 'Narita International Airport',
  'SYD': 'Sydney Airport',
  'IST': 'Istanbul Airport',
  'SIN': 'Singapore Changi Airport',
  'CDG': 'Charles de Gaulle Airport',
  'DXB': 'Dubai International Airport',
};

const FlightMap = ({ events }: { events: DutyEvent[] }) => {
  const uniquePorts = Array.from(new Set(
    events.flatMap(e => [e.depPort?.toUpperCase(), e.arrPort?.toUpperCase()])
      .filter((p): p is string => !!p && !!IATA_CITIES[p])
  ));

  return (
    <div className="space-y-6 mb-16">
      {/* Interactive World Map */}
      <div className="w-full h-[500px] rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-card bg-gray-50 relative">
        <LeafletMap events={events} />
        
        <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-white shadow-sm z-10 pointer-events-none">
          <p className="text-[10px] font-black text-gray-900 flex items-center gap-2 tracking-widest uppercase">
              <MapPin size={12} className="text-rausch" />
              Interactive Mission Tracker
          </p>
        </div>
      </div>

      {/* Destinations Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {uniquePorts.map((port) => (
          <a 
            key={port}
            href={`https://www.google.com/maps/search/${encodeURIComponent(IATA_CITIES[port])}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-rausch/30 transition-all group"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-black text-gray-900">{port}</span>
              <ExternalLink size={12} className="text-gray-300 group-hover:text-rausch transition-colors" />
            </div>
            <p className="text-[10px] text-gray-500 font-medium truncate uppercase tracking-tight">
              {IATA_CITIES[port].split(' ')[0]}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
};

export default FlightMap;

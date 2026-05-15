'use client';

import React from 'react';
import { DutyEvent } from '@/types';
import { MapPin, ExternalLink } from 'lucide-react';

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

  // Default to KUL if no ports found
  const primaryCity = uniquePorts[0] || 'KUL';
  const query = encodeURIComponent(IATA_CITIES[primaryCity]);

  return (
    <div className="space-y-6 mb-16">
      {/* Google Maps Iframe */}
      <div className="w-full h-[500px] rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-card bg-gray-50 relative">
        <iframe
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://maps.google.com/maps?q=${query}&t=&z=5&ie=UTF8&iwloc=&output=embed`}
        ></iframe>
        
        <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-white shadow-sm z-10">
          <p className="text-[10px] font-black text-gray-900 flex items-center gap-2 tracking-widest uppercase">
              <MapPin size={12} className="text-rausch" />
              Interactive Mission Map
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

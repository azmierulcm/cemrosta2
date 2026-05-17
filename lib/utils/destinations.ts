import { Destination, DutyEvent } from '@/lib/types';

const IATA_MAP: Record<string, { city: string, country: string, color: string, shape: 'oval' | 'hexagon' | 'rectangle' }> = {
  // Malaysia
  'KUL': { city: 'Kuala Lumpur', country: 'Malaysia', color: 'border-rausch text-rausch', shape: 'rectangle' },
  'PEN': { city: 'Penang', country: 'Malaysia', color: 'border-rausch text-rausch', shape: 'oval' },
  'BKI': { city: 'Kota Kinabalu', country: 'Malaysia', color: 'border-rausch text-rausch', shape: 'hexagon' },
  'KCH': { city: 'Kuching', country: 'Malaysia', color: 'border-rausch text-rausch', shape: 'rectangle' },
  'LGK': { city: 'Langkawi', country: 'Malaysia', color: 'border-rausch text-rausch', shape: 'oval' },
  // UK & Europe
  'LHR': { city: 'London', country: 'United Kingdom', color: 'border-gray-500 text-gray-600', shape: 'oval' },
  'CDG': { city: 'Paris', country: 'France', color: 'border-blue-500 text-blue-600', shape: 'hexagon' },
  'FRA': { city: 'Frankfurt', country: 'Germany', color: 'border-yellow-600 text-yellow-700', shape: 'rectangle' },
  'AMS': { city: 'Amsterdam', country: 'Netherlands', color: 'border-orange-400 text-orange-500', shape: 'oval' },
  'ZRH': { city: 'Zurich', country: 'Switzerland', color: 'border-red-500 text-red-600', shape: 'hexagon' },
  'FCO': { city: 'Rome', country: 'Italy', color: 'border-green-600 text-green-700', shape: 'oval' },
  'MAD': { city: 'Madrid', country: 'Spain', color: 'border-red-600 text-red-700', shape: 'rectangle' },
  'MAN': { city: 'Manchester', country: 'United Kingdom', color: 'border-gray-400 text-gray-500', shape: 'hexagon' },
  // Middle East
  'DXB': { city: 'Dubai', country: 'UAE', color: 'border-amber-500 text-amber-600', shape: 'rectangle' },
  'AUH': { city: 'Abu Dhabi', country: 'UAE', color: 'border-amber-400 text-amber-500', shape: 'hexagon' },
  'DOH': { city: 'Doha', country: 'Qatar', color: 'border-purple-500 text-purple-600', shape: 'oval' },
  'RUH': { city: 'Riyadh', country: 'Saudi Arabia', color: 'border-green-600 text-green-700', shape: 'hexagon' },
  'JED': { city: 'Jeddah', country: 'Saudi Arabia', color: 'border-green-500 text-green-600', shape: 'rectangle' },
  // East Asia
  'NRT': { city: 'Tokyo Narita', country: 'Japan', color: 'border-pink-400 text-pink-500', shape: 'oval' },
  'HND': { city: 'Tokyo Haneda', country: 'Japan', color: 'border-pink-500 text-pink-600', shape: 'hexagon' },
  'KIX': { city: 'Osaka', country: 'Japan', color: 'border-pink-300 text-pink-400', shape: 'rectangle' },
  'NGO': { city: 'Nagoya', country: 'Japan', color: 'border-pink-400 text-pink-500', shape: 'oval' },
  'ICN': { city: 'Seoul', country: 'South Korea', color: 'border-blue-400 text-blue-500', shape: 'hexagon' },
  'PEK': { city: 'Beijing', country: 'China', color: 'border-red-600 text-red-700', shape: 'rectangle' },
  'PKX': { city: 'Beijing Daxing', country: 'China', color: 'border-red-500 text-red-600', shape: 'oval' },
  'PVG': { city: 'Shanghai', country: 'China', color: 'border-red-500 text-red-600', shape: 'hexagon' },
  'CAN': { city: 'Guangzhou', country: 'China', color: 'border-red-500 text-red-600', shape: 'hexagon' },
  'SZX': { city: 'Shenzhen', country: 'China', color: 'border-red-400 text-red-500', shape: 'rectangle' },
  'XMN': { city: 'Xiamen', country: 'China', color: 'border-red-400 text-red-500', shape: 'oval' },
  'HKG': { city: 'Hong Kong', country: 'Hong Kong', color: 'border-red-500 text-red-600', shape: 'oval' },
  'TPE': { city: 'Taipei', country: 'Taiwan', color: 'border-blue-500 text-blue-600', shape: 'hexagon' },
  // Southeast Asia
  'SIN': { city: 'Singapore', country: 'Singapore', color: 'border-red-500 text-red-600', shape: 'rectangle' },
  'BKK': { city: 'Bangkok', country: 'Thailand', color: 'border-yellow-500 text-yellow-600', shape: 'oval' },
  'DMK': { city: 'Bangkok Don Mueang', country: 'Thailand', color: 'border-yellow-400 text-yellow-500', shape: 'hexagon' },
  'CGK': { city: 'Jakarta', country: 'Indonesia', color: 'border-red-600 text-red-700', shape: 'rectangle' },
  'DPS': { city: 'Bali', country: 'Indonesia', color: 'border-emerald-500 text-emerald-600', shape: 'oval' },
  'MNL': { city: 'Manila', country: 'Philippines', color: 'border-blue-600 text-blue-700', shape: 'hexagon' },
  'SGN': { city: 'Ho Chi Minh City', country: 'Vietnam', color: 'border-red-500 text-red-600', shape: 'oval' },
  'HAN': { city: 'Hanoi', country: 'Vietnam', color: 'border-red-400 text-red-500', shape: 'rectangle' },
  'RGN': { city: 'Yangon', country: 'Myanmar', color: 'border-yellow-600 text-yellow-700', shape: 'hexagon' },
  'PNH': { city: 'Phnom Penh', country: 'Cambodia', color: 'border-blue-500 text-blue-600', shape: 'oval' },
  'VTE': { city: 'Vientiane', country: 'Laos', color: 'border-blue-400 text-blue-500', shape: 'rectangle' },
  'BWN': { city: 'Bandar Seri Begawan', country: 'Brunei', color: 'border-yellow-500 text-yellow-600', shape: 'hexagon' },
  // South Asia
  'DEL': { city: 'New Delhi', country: 'India', color: 'border-orange-500 text-orange-600', shape: 'oval' },
  'BOM': { city: 'Mumbai', country: 'India', color: 'border-orange-400 text-orange-500', shape: 'hexagon' },
  'MAA': { city: 'Chennai', country: 'India', color: 'border-orange-400 text-orange-500', shape: 'rectangle' },
  'DAC': { city: 'Dhaka', country: 'Bangladesh', color: 'border-green-600 text-green-700', shape: 'oval' },
  'CMB': { city: 'Colombo', country: 'Sri Lanka', color: 'border-blue-600 text-blue-700', shape: 'hexagon' },
  // Oceania
  'SYD': { city: 'Sydney', country: 'Australia', color: 'border-emerald-500 text-emerald-600', shape: 'rectangle' },
  'MEL': { city: 'Melbourne', country: 'Australia', color: 'border-emerald-400 text-emerald-500', shape: 'oval' },
  'PER': { city: 'Perth', country: 'Australia', color: 'border-emerald-400 text-emerald-500', shape: 'hexagon' },
  'AKL': { city: 'Auckland', country: 'New Zealand', color: 'border-teal-500 text-teal-600', shape: 'rectangle' },
  // Turkey & Africa
  'IST': { city: 'Istanbul', country: 'Turkey', color: 'border-orange-500 text-orange-600', shape: 'hexagon' },
  'CAI': { city: 'Cairo', country: 'Egypt', color: 'border-yellow-600 text-yellow-700', shape: 'oval' },
  'JNB': { city: 'Johannesburg', country: 'South Africa', color: 'border-green-600 text-green-700', shape: 'rectangle' },
  // North America
  'LAX': { city: 'Los Angeles', country: 'United States', color: 'border-blue-600 text-blue-700', shape: 'oval' },
  'JFK': { city: 'New York', country: 'United States', color: 'border-blue-500 text-blue-600', shape: 'rectangle' },
};

const SHAPES = ['oval', 'hexagon', 'rectangle'] as const;

export function extractDestinations(events: DutyEvent[]): Destination[] {
  const destMap = new Map<string, Destination>();

  events.forEach(event => {
    if (event.type === 'FLIGHT' && event.arrPort && /^[A-Z]{3}$/.test(event.arrPort.toUpperCase())) {
      const iata = event.arrPort.toUpperCase();
      const meta = IATA_MAP[iata] || { 
        city: iata, 
        country: 'Global', 
        color: 'border-gray-400 text-gray-500',
        shape: SHAPES[iata.charCodeAt(0) % SHAPES.length]
      };

      const existing = destMap.get(iata);
      if (existing) {
        existing.count += 1;
        if (new Date(event.date) > new Date(existing.lastVisited)) {
          existing.lastVisited = event.date;
        }
      } else {
        destMap.set(iata, {
          iata,
          city: meta.city,
          country: meta.country,
          count: 1,
          lastVisited: event.date,
          colorTheme: meta.color,
          shape: meta.shape
        });
      }
    }
  });

  return Array.from(destMap.values());
}

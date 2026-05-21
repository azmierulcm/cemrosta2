
/**
 * Calculates Great Circle distance between two points in Kilometers
 * Uses the Haversine formula
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in KM
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export interface RouteFlags {
  crosses_equator: boolean;
  crosses_polar: boolean;
  crosses_arctic_circle: boolean;
  crosses_antarctic_circle: boolean;
  crosses_idl: boolean;
}

/**
 * Checks route markers based on origin and destination
 * Note: For 100% precision on crossings, intermediate flight path points are needed.
 * This is a high-confidence heuristic based on end points.
 */
export function computeRouteFlags(lat1: number, lon1: number, lat2: number, lon2: number): RouteFlags {
  return {
    crosses_equator: (lat1 > 0 && lat2 < 0) || (lat1 < 0 && lat2 > 0),
    crosses_polar: Math.abs(lat1) > 80 || Math.abs(lat2) > 80,
    crosses_arctic_circle: lat1 > 66.5 || lat2 > 66.5,
    crosses_antarctic_circle: lat1 < -66.5 || lat2 < -66.5,
    crosses_idl: Math.abs(lon1 - lon2) > 180,
  };
}

/**
 * Witnessed Sunrise/Sunset Heuristic
 * Checks if the flight duration spans typical sunrise/sunset times in UTC
 * relative to the geographic position.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function checkWitnessedEvents(_std: string, _sta: string, _lon1: number, _lon2: number) {
  // Simplified version: Check if flight crosses local 6am or 6pm roughly
  // Real implementation would use suncalc or similar library with UTC conversion
  return {
    witnessed_sunrise: false, // Placeholder
    witnessed_sunset: false,
  };
}

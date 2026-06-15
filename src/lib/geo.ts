import type { Category, LatLng } from '../types';

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/**
 * Geographic (great-circle) midpoint of two coordinates.
 * More accurate than averaging lat/lng, especially across long distances
 * or the antimeridian.
 */
export function geographicMidpoint(a: LatLng, b: LatLng): LatLng {
  const lat1 = toRad(a.lat);
  const lng1 = toRad(a.lng);
  const lat2 = toRad(b.lat);
  const lng2 = toRad(b.lng);

  const bx = Math.cos(lat2) * Math.cos(lng2 - lng1);
  const by = Math.cos(lat2) * Math.sin(lng2 - lng1);

  const lat3 = Math.atan2(
    Math.sin(lat1) + Math.sin(lat2),
    Math.sqrt((Math.cos(lat1) + bx) ** 2 + by ** 2),
  );
  const lng3 = lng1 + Math.atan2(by, Math.cos(lat1) + bx);

  return { lat: toDeg(lat3), lng: toDeg(lng3) };
}

/** Great-circle distance between two points, in metres. */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Format a metre distance as a friendly km / m string. */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Activity categories surfaced as filter chips. `placeType` maps to a
 * Google Places nearby-search supported type.
 */
export const CATEGORIES: Category[] = [
  { id: 'restaurant', label: 'Restaurants', icon: '🍽️', placeType: 'restaurant' },
  { id: 'cafe', label: 'Cafés', icon: '☕', placeType: 'cafe' },
  { id: 'bar', label: 'Bars', icon: '🍸', placeType: 'bar' },
  { id: 'park', label: 'Parks', icon: '🌳', placeType: 'park' },
  { id: 'museum', label: 'Museums', icon: '🏛️', placeType: 'museum' },
  { id: 'movie_theater', label: 'Cinemas', icon: '🎬', placeType: 'movie_theater' },
  { id: 'shopping_mall', label: 'Shopping', icon: '🛍️', placeType: 'shopping_mall' },
  { id: 'tourist_attraction', label: 'Attractions', icon: '📸', placeType: 'tourist_attraction' },
  { id: 'night_club', label: 'Nightlife', icon: '🎶', placeType: 'night_club' },
  { id: 'gym', label: 'Gyms', icon: '💪', placeType: 'gym' },
];

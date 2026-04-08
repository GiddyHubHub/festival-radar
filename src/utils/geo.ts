import type { Coordinates } from '../types';

/**
 * Calculate the distance in kilometers between two coordinates
 * using the Haversine formula.
 */
export function haversineDistance(a: Coordinates, b: Coordinates): number {
  const R = 6371; // Earth radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const c =
    2 *
    Math.asin(
      Math.sqrt(
        sinDLat * sinDLat +
          Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng,
      ),
    );

  return R * c;
}

/**
 * Geocode a German postal code using the Nominatim API.
 * Returns null if the postal code cannot be resolved.
 */
export async function geocodePostalCode(
  postalCode: string,
): Promise<Coordinates | null> {
  const trimmed = postalCode.trim();
  if (!/^\d{4,6}$/.test(trimmed)) return null;

  try {
    const url = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(trimmed)}&country=DE&format=json&limit=1`;
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'de',
        'User-Agent': 'FestivalRadar/1.0',
      },
    });
    if (!response.ok) return null;
    const data: Array<{ lat: string; lon: string }> = await response.json();
    if (data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

/**
 * Return the number of days from today until the given ISO date string.
 * Negative values mean the date is in the past.
 */
export function daysUntil(isoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(isoDate);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Format an ISO date string to a German locale string.
 */
export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

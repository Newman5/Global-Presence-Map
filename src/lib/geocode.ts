import { cityCoords } from "~/data/cityCoords";

export function geocodeCity(
  city: string | undefined | null
): { lat: number; lng: number } | null {
  if (!city) return null; // guard against undefined or empty

  // Normalize input
  const key = city.trim().replace(/\s+/g, '');
  if (!key) return null; // still empty after trimming

  const coords = cityCoords[key] ?? cityCoords[city.trim()];
  if (!coords) return null;

  return { lat: coords.lat, lng: coords.lng };
}

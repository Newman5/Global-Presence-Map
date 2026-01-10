import { getCityCoordinates } from "./cities";

export function geocodeCity(
  city: string | undefined | null
): { lat: number; lng: number } | null {
  if (!city) return null; // guard against undefined or empty

  // Get coordinates from cities service
  return getCityCoordinates(city);
}

import { cityCoords } from "~/data/cityCoords";

export function geocodeCity(city: string): { lat: number; lng: number } | null {
  // Normalize key (remove spaces, capitalize first letter)
  const key = city.trim().replace(/\s+/g, "");
  const coords = cityCoords[key] || cityCoords[city];
  return coords || null;
}

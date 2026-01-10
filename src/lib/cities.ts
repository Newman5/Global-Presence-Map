// src/lib/cities.ts
import citiesData from '~/data/cities.json';
import { type City } from './validation';

/**
 * In-memory cache of cities loaded from cities.json
 * This is the single source of truth for city coordinates
 */
const citiesCache: Map<string, City> = new Map();

/**
 * Normalize city name for lookup (lowercase, trim, keep spaces)
 */
function normalizeCityName(cityName: string): string {
  return cityName.toLowerCase().trim();
}

/**
 * Initialize the cities cache from cities.json
 */
function initializeCitiesCache() {
  if (citiesCache.size > 0) return; // Already initialized
  
  Object.values(citiesData).forEach((city) => {
    citiesCache.set(city.normalizedName, city as City);
  });
}

/**
 * Get city by normalized name
 * Returns city data if found, null otherwise
 */
export function getCityByName(cityName: string): City | null {
  initializeCitiesCache();
  const normalized = normalizeCityName(cityName);
  return citiesCache.get(normalized) ?? null;
}

/**
 * Get coordinates for a city
 * Returns { lat, lng } if found, null otherwise
 */
export function getCityCoordinates(cityName: string): { lat: number; lng: number } | null {
  const city = getCityByName(cityName);
  if (!city) return null;
  return { lat: city.lat, lng: city.lng };
}

/**
 * Get all cities
 */
export function getAllCities(): City[] {
  initializeCitiesCache();
  return Array.from(citiesCache.values());
}

/**
 * Check if a city exists in the database
 */
export function cityExists(cityName: string): boolean {
  return getCityByName(cityName) !== null;
}

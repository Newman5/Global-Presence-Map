// src/lib/cityCache.ts
/**
 * City Cache Module
 * 
 * This module separates city geocoding from member persistence.
 * It provides a clean interface for coordinate lookups without
 * mixing concerns with member data storage.
 * 
 * Phase 2 Improvement: Uses cities.json as single source of truth
 */

import { getCityByName, getCityCoordinates, getAllCities, cityExists } from './cities';
import type { CityCoord } from './validation';

/**
 * Result of a city lookup, indicating whether coordinates were found
 */
export type CityLookupResult =
  | { found: true; coords: CityCoord; source: 'static' }
  | { found: false; coords: null; source: 'none' };

/**
 * Normalizes a city name for lookup
 * Converts to lowercase and removes spaces for consistent matching
 */
export function normalizeCityForLookup(city: string): string {
  return city.toLowerCase().replace(/\s+/g, '');
}

/**
 * Looks up coordinates for a city
 * Returns null if not found (caller decides how to handle)
 * 
 * @param city - City name to lookup
 * @returns Coordinates if found, null otherwise
 */
export function lookupCityCoords(city: string): CityCoord | null {
  if (!city) return null;
  return getCityCoordinates(city);
}

/**
 * Performs a city lookup and returns a structured result
 * This is the preferred method as it provides context about the lookup
 * 
 * @param city - City name to lookup
 * @returns Lookup result with found status and coordinates
 */
export function getCityLookupResult(city: string): CityLookupResult {
  const coords = lookupCityCoords(city);

  if (coords) {
    return {
      found: true,
      coords,
      source: 'static',
    };
  }

  return {
    found: false,
    coords: null,
    source: 'none',
  };
}

/**
 * Gets all known cities
 * @returns Array of city names that have coordinates
 */
export function getKnownCities(): string[] {
  return getAllCities().map(city => city.normalizedName);
}

/**
 * Checks if a city has known coordinates
 * @param city - City name to check
 * @returns true if coordinates exist, false otherwise
 */
export function hasCityCoords(city: string): boolean {
  return cityExists(city);
}

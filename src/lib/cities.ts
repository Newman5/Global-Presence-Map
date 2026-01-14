// src/lib/cities.ts
/**
 * City Lookup Service
 * 
 * This module provides the single source of truth for city coordinates.
 * All coordinate lookups should go through this service to ensure consistency.
 * 
 * Data Source: src/data/cities.json
 * 
 * Key Features:
 * - In-memory caching for fast lookups
 * - Case-insensitive city name matching
 * - Consistent normalization (lowercase, trimmed)
 * - Lazy initialization of cache
 */
import citiesData from '~/data/cities.json';
import { type City } from './validation';

// ===== In-Memory Cache =====
// Stores cities loaded from cities.json for fast lookups
// Initialized on first access, persists for application lifetime
const citiesCache: Map<string, City> = new Map<string, City>();

// ===== Normalization Utilities =====
/**
 * Normalize city name for consistent lookup
 * Converts to lowercase and trims whitespace while preserving spaces
 * Example: "New York" -> "new york", "  Paris  " -> "paris"
 */
function normalizeCityName(cityName: string): string {
  return cityName.toLowerCase().trim();
}

// ===== Cache Initialization =====
/**
 * Initializes the cities cache from cities.json
 * Only runs once per application lifetime (checks if cache is already populated)
 * Loads all cities into memory for fast subsequent lookups
 */
function initializeCitiesCache() {
  if (citiesCache.size > 0) return; // Already initialized
  
  Object.values(citiesData).forEach((city) => {
    citiesCache.set(city.normalizedName, city as City);
  });
}

// ===== Public API =====
// These functions provide the interface for looking up city data

/**
 * Get city by normalized name
 * Returns complete city data if found, null otherwise
 * 
 * @param cityName - City name to look up (case-insensitive)
 * @returns City object with coordinates and metadata, or null if not found
 */
export function getCityByName(cityName: string): City | null {
  initializeCitiesCache();
  const normalized = normalizeCityName(cityName);
  return citiesCache.get(normalized) ?? null;
}

/**
 * Get coordinates for a city
 * Convenience function for when you only need lat/lng
 * 
 * @param cityName - City name to look up (case-insensitive)
 * @returns Coordinates object with lat and lng, or null if not found
 */
export function getCityCoordinates(cityName: string): { lat: number; lng: number } | null {
  const city = getCityByName(cityName);
  if (!city) return null;
  return { lat: city.lat, lng: city.lng };
}

/**
 * Get all cities from the database
 * Useful for generating city lists or statistics
 * 
 * @returns Array of all city objects
 */
export function getAllCities(): City[] {
  initializeCitiesCache();
  return Array.from(citiesCache.values());
}

/**
 * Check if a city exists in the database
 * Faster than getCityByName when you only need existence check
 * 
 * @param cityName - City name to check (case-insensitive)
 * @returns true if city exists, false otherwise
 */
export function cityExists(cityName: string): boolean {
  return getCityByName(cityName) !== null;
}

// src/lib/cityCache.test.ts
import { describe, it, expect } from 'vitest';
import {
  lookupCityCoords,
  getCityLookupResult,
  normalizeCityForLookup,
  hasCityCoords,
  getKnownCities,
} from './cityCache';

describe('normalizeCityForLookup', () => {
  it('should convert to lowercase', () => {
    expect(normalizeCityForLookup('Paris')).toBe('paris');
    expect(normalizeCityForLookup('NEW YORK')).toBe('newyork');
  });

  it('should remove spaces', () => {
    expect(normalizeCityForLookup('New York')).toBe('newyork');
    expect(normalizeCityForLookup('San Francisco')).toBe('sanfrancisco');
  });

  it('should handle multiple spaces', () => {
    expect(normalizeCityForLookup('New   York')).toBe('newyork');
  });

  it('should handle empty string', () => {
    expect(normalizeCityForLookup('')).toBe('');
  });
});

describe('lookupCityCoords', () => {
  it('should find coordinates for known city (lowercase no spaces)', () => {
    const coords = lookupCityCoords('paris');
    expect(coords).not.toBeNull();
    expect(coords?.lat).toBe(48.8566);
    expect(coords?.lng).toBe(2.3522);
  });

  it('should find coordinates with case insensitive match', () => {
    const coords = lookupCityCoords('Paris');
    expect(coords).not.toBeNull();
    expect(coords?.lat).toBe(48.8566);
  });

  it('should find coordinates for city with spaces', () => {
    const coords = lookupCityCoords('New York');
    expect(coords).not.toBeNull();
    expect(coords?.lat).toBe(40.7127);
    expect(coords?.lng).toBe(-74.006);
  });

  it('should find coordinates with normalized lookup (no spaces)', () => {
    // cityCoords doesn't have 'newyork' as a key, only 'new york'
    // This test documents current behavior
    const coords = lookupCityCoords('newyork');
    expect(coords).toBeNull();
  });

  it('should return null for unknown city', () => {
    expect(lookupCityCoords('Unknown City')).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(lookupCityCoords('')).toBeNull();
  });

  it('should handle cities from cityCoords data', () => {
    expect(lookupCityCoords('tokyo')).not.toBeNull();
    expect(lookupCityCoords('london')).not.toBeNull();
    expect(lookupCityCoords('tallinn')).not.toBeNull();
  });
});

describe('getCityLookupResult', () => {
  it('should return found=true for known city', () => {
    const result = getCityLookupResult('paris');
    expect(result.found).toBe(true);
    if (result.found) {
      expect(result.coords.lat).toBe(48.8566);
      expect(result.coords.lng).toBe(2.3522);
      expect(result.source).toBe('static');
    }
  });

  it('should return found=false for unknown city', () => {
    const result = getCityLookupResult('Unknown City');
    expect(result.found).toBe(false);
    expect(result.coords).toBeNull();
    expect(result.source).toBe('none');
  });

  it('should handle city with spaces', () => {
    const result = getCityLookupResult('New York');
    expect(result.found).toBe(true);
  });
});

describe('hasCityCoords', () => {
  it('should return true for known cities', () => {
    expect(hasCityCoords('paris')).toBe(true);
    expect(hasCityCoords('Paris')).toBe(true);
    expect(hasCityCoords('new york')).toBe(true);
    expect(hasCityCoords('london')).toBe(true);
  });

  it('should return false for unknown cities', () => {
    expect(hasCityCoords('Unknown City')).toBe(false);
    expect(hasCityCoords('Mars')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(hasCityCoords('')).toBe(false);
  });
});

describe('getKnownCities', () => {
  it('should return array of city names', () => {
    const cities = getKnownCities();
    expect(Array.isArray(cities)).toBe(true);
    expect(cities.length).toBeGreaterThan(0);
  });

  it('should include known cities', () => {
    const cities = getKnownCities();
    expect(cities).toContain('paris');
    expect(cities).toContain('london');
    expect(cities).toContain('new york');
  });
});

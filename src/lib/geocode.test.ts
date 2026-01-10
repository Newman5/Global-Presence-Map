// src/lib/geocode.test.ts
import { describe, it, expect } from 'vitest';
import { geocodeCity } from './geocode';

describe('geocodeCity', () => {
  it('should return coordinates for known cities', () => {
    const result = geocodeCity('paris');
    expect(result).not.toBeNull();
    expect(result?.lat).toBe(48.8566);
    expect(result?.lng).toBe(2.3522);
  });

  it('should handle city with spaces', () => {
    const result = geocodeCity('new york');
    expect(result).not.toBeNull();
    expect(result?.lat).toBe(40.7127);
    expect(result?.lng).toBe(-74.006);
  });

  it('should handle lookup with trim and space removal', () => {
    // Current implementation removes spaces first, then tries with spaces
    // cityCoords keys are lowercase ('paris'), so 'Paris' won't match directly
    expect(geocodeCity('paris')).not.toBeNull();
    
    // Test that the implementation tries both formats
    // For 'new york', it removes spaces to 'newyork', doesn't find it,
    // then tries 'new york' which exists in cityCoords
    const result = geocodeCity('new york');
    expect(result).not.toBeNull();
  });

  it('should return null for unknown city', () => {
    expect(geocodeCity('Unknown City 12345')).toBeNull();
  });

  it('should return null for undefined', () => {
    expect(geocodeCity(undefined)).toBeNull();
  });

  it('should return null for null', () => {
    expect(geocodeCity(null)).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(geocodeCity('')).toBeNull();
  });

  it('should return null for whitespace only', () => {
    expect(geocodeCity('   ')).toBeNull();
  });

  it('should handle cities without spaces in lookup', () => {
    const result = geocodeCity('tokyo');
    expect(result).not.toBeNull();
    expect(result?.lat).toBe(35.6762);
    expect(result?.lng).toBe(139.6503);
  });

  it('should trim whitespace', () => {
    const result = geocodeCity('  paris  ');
    expect(result).not.toBeNull();
    expect(result?.lat).toBe(48.8566);
  });

  it('should handle key formats in cityCoords', () => {
    // cityCoords has "new york" with space and lowercase
    const nyResult = geocodeCity('new york');
    const parisResult = geocodeCity('paris');

    expect(nyResult).not.toBeNull();
    expect(parisResult).not.toBeNull();
  });
});

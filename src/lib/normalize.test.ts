// src/lib/normalize.test.ts
import { describe, it, expect } from 'vitest';
import { normalizeInput, normalizeMember } from './normalize';

describe('normalizeInput', () => {
  it('should trim whitespace', () => {
    expect(normalizeInput('  New York  ')).toBe('New York');
  });

  it('should capitalize first letter of each word', () => {
    expect(normalizeInput('new york')).toBe('New York');
  });

  it('should handle all lowercase', () => {
    expect(normalizeInput('london')).toBe('London');
  });

  it('should handle all uppercase', () => {
    expect(normalizeInput('PARIS')).toBe('Paris');
  });

  it('should handle mixed case', () => {
    expect(normalizeInput('sAn FrAnCiScO')).toBe('San Francisco');
  });

  it('should collapse multiple spaces', () => {
    expect(normalizeInput('new    york')).toBe('New York');
  });

  it('should handle tabs and newlines as spaces', () => {
    expect(normalizeInput('new\t\nyork')).toBe('New York');
  });

  it('should handle empty string', () => {
    expect(normalizeInput('')).toBe('');
  });

  it('should handle undefined', () => {
    expect(normalizeInput(undefined)).toBe('');
  });

  it('should handle string with only spaces', () => {
    expect(normalizeInput('   ')).toBe('');
  });

  it('should handle hyphenated names (capitalizes only first word)', () => {
    // Note: Current implementation only capitalizes words split by spaces
    expect(normalizeInput('saint-tropez')).toBe('Saint-tropez');
  });

  it('should handle single character', () => {
    expect(normalizeInput('a')).toBe('A');
  });
});

describe('normalizeMember', () => {
  it('should normalize both name and city', () => {
    const member = { name: '  john  ', city: '  new york  ' };
    const result = normalizeMember(member);
    expect(result).toEqual({
      name: 'John',
      city: 'New York',
    });
  });

  it('should handle empty strings', () => {
    const member = { name: '', city: '' };
    const result = normalizeMember(member);
    expect(result).toEqual({
      name: '',
      city: '',
    });
  });

  it('should capitalize properly', () => {
    const member = { name: 'alice', city: 'paris' };
    const result = normalizeMember(member);
    expect(result).toEqual({
      name: 'Alice',
      city: 'Paris',
    });
  });

  it('should handle multi-word names and cities', () => {
    const member = { name: 'mary jane', city: 'san francisco' };
    const result = normalizeMember(member);
    expect(result).toEqual({
      name: 'Mary Jane',
      city: 'San Francisco',
    });
  });
});

// src/lib/validation.test.ts
import { describe, it, expect } from 'vitest';
import {
  validateMember,
  validateMembers,
  safeValidateMembers,
  validateCityCoord,
  validateAddMemberInput,
} from './validation';
import { ZodError } from 'zod';

describe('validateMember', () => {
  it('should validate a valid member', () => {
    const member = {
      name: 'Alice',
      city: 'Paris',
      lat: 48.8566,
      lng: 2.3522,
    };
    expect(validateMember(member)).toEqual(member);
  });

  it('should validate member with optional id', () => {
    const member = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Bob',
      city: 'London',
      lat: 51.5072,
      lng: -0.1276,
    };
    expect(validateMember(member)).toEqual(member);
  });

  it('should validate member with null coordinates', () => {
    const member = {
      name: 'Charlie',
      city: 'Unknown City',
      lat: null,
      lng: null,
    };
    expect(validateMember(member)).toEqual(member);
  });

  it('should validate member with optional source', () => {
    const member = {
      name: 'Dave',
      city: 'Berlin',
      lat: 52.5174,
      lng: 13.3951,
      source: 'lookup' as const,
    };
    expect(validateMember(member)).toEqual(member);
  });

  it('should throw error for missing name', () => {
    const member = {
      city: 'Paris',
      lat: 48.8566,
      lng: 2.3522,
    };
    expect(() => validateMember(member)).toThrow(ZodError);
  });

  it('should throw error for missing city', () => {
    const member = {
      name: 'Alice',
      lat: 48.8566,
      lng: 2.3522,
    };
    expect(() => validateMember(member)).toThrow(ZodError);
  });

  it('should throw error for empty name', () => {
    const member = {
      name: '',
      city: 'Paris',
      lat: 48.8566,
      lng: 2.3522,
    };
    expect(() => validateMember(member)).toThrow(ZodError);
  });

  it('should accept any valid string as ID', () => {
    const member = {
      id: 'not-a-uuid-but-valid-string',
      name: 'Alice',
      city: 'Paris',
      lat: 48.8566,
      lng: 2.3522,
    };
    expect(() => validateMember(member)).not.toThrow();
  });

  it('should throw error for invalid source', () => {
    const member = {
      name: 'Alice',
      city: 'Paris',
      lat: 48.8566,
      lng: 2.3522,
      source: 'invalid',
    };
    expect(() => validateMember(member)).toThrow(ZodError);
  });

  it('should validate member with createdAt timestamp', () => {
    const member = {
      name: 'Alice',
      city: 'Paris',
      lat: 48.8566,
      lng: 2.3522,
      createdAt: '2025-01-01T00:00:00Z',
    };
    expect(validateMember(member)).toEqual(member);
  });
});

describe('validateMembers', () => {
  it('should validate an array of members', () => {
    const members = [
      { name: 'Alice', city: 'Paris', lat: 48.8566, lng: 2.3522 },
      { name: 'Bob', city: 'London', lat: 51.5072, lng: -0.1276 },
    ];
    expect(validateMembers(members)).toEqual(members);
  });

  it('should validate empty array', () => {
    expect(validateMembers([])).toEqual([]);
  });

  it('should throw error for invalid member in array', () => {
    const members = [
      { name: 'Alice', city: 'Paris', lat: 48.8566, lng: 2.3522 },
      { name: '', city: 'London', lat: 51.5072, lng: -0.1276 }, // Invalid
    ];
    expect(() => validateMembers(members)).toThrow(ZodError);
  });
});

describe('safeValidateMembers', () => {
  it('should return parsed data for valid members', () => {
    const members = [
      { name: 'Alice', city: 'Paris', lat: 48.8566, lng: 2.3522 },
    ];
    expect(safeValidateMembers(members)).toEqual(members);
  });

  it('should return null for invalid data', () => {
    const members = [
      { name: '', city: 'Paris', lat: 48.8566, lng: 2.3522 },
    ];
    expect(safeValidateMembers(members)).toBeNull();
  });

  it('should return null for non-array data', () => {
    expect(safeValidateMembers('not an array')).toBeNull();
  });
});

describe('validateCityCoord', () => {
  it('should validate valid coordinates', () => {
    const coord = { lat: 48.8566, lng: 2.3522 };
    expect(validateCityCoord(coord)).toEqual(coord);
  });

  it('should validate edge case coordinates', () => {
    expect(validateCityCoord({ lat: 90, lng: 180 })).toEqual({ lat: 90, lng: 180 });
    expect(validateCityCoord({ lat: -90, lng: -180 })).toEqual({ lat: -90, lng: -180 });
    expect(validateCityCoord({ lat: 0, lng: 0 })).toEqual({ lat: 0, lng: 0 });
  });

  it('should throw error for latitude out of range', () => {
    expect(() => validateCityCoord({ lat: 91, lng: 0 })).toThrow(ZodError);
    expect(() => validateCityCoord({ lat: -91, lng: 0 })).toThrow(ZodError);
  });

  it('should throw error for longitude out of range', () => {
    expect(() => validateCityCoord({ lat: 0, lng: 181 })).toThrow(ZodError);
    expect(() => validateCityCoord({ lat: 0, lng: -181 })).toThrow(ZodError);
  });

  it('should throw error for missing coordinates', () => {
    expect(() => validateCityCoord({ lat: 48.8566 })).toThrow(ZodError);
    expect(() => validateCityCoord({ lng: 2.3522 })).toThrow(ZodError);
  });
});

describe('validateAddMemberInput', () => {
  it('should validate valid input', () => {
    const input = { name: 'Alice', city: 'Paris' };
    expect(validateAddMemberInput(input)).toEqual(input);
  });

  it('should throw error for missing name', () => {
    expect(() => validateAddMemberInput({ city: 'Paris' })).toThrow(ZodError);
  });

  it('should throw error for missing city', () => {
    expect(() => validateAddMemberInput({ name: 'Alice' })).toThrow(ZodError);
  });

  it('should throw error for empty name', () => {
    expect(() => validateAddMemberInput({ name: '', city: 'Paris' })).toThrow(ZodError);
  });

  it('should throw error for empty city', () => {
    expect(() => validateAddMemberInput({ name: 'Alice', city: '' })).toThrow(ZodError);
  });
});

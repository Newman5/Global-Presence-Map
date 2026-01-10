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
      id: 'member-123',
      name: 'Alice',
      city: 'Paris',
      createdAt: '2026-01-10T00:00:00.000Z',
    };
    expect(validateMember(member)).toEqual(member);
  });

  it('should validate member with UUID', () => {
    const member = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Bob',
      city: 'London',
      createdAt: '2026-01-10T00:00:00.000Z',
    };
    expect(validateMember(member)).toEqual(member);
  });

  it('should accept any valid string as ID', () => {
    const member = {
      id: 'not-a-uuid-but-valid-string',
      name: 'Alice',
      city: 'Paris',
      createdAt: '2026-01-10T00:00:00.000Z',
    };
    expect(() => validateMember(member)).not.toThrow();
  });

  it('should throw error for missing name', () => {
    const member = {
      id: 'member-123',
      city: 'Paris',
      createdAt: '2026-01-10T00:00:00.000Z',
    };
    expect(() => validateMember(member)).toThrow(ZodError);
  });

  it('should throw error for missing city', () => {
    const member = {
      id: 'member-123',
      name: 'Alice',
      createdAt: '2026-01-10T00:00:00.000Z',
    };
    expect(() => validateMember(member)).toThrow(ZodError);
  });

  it('should throw error for empty name', () => {
    const member = {
      id: 'member-123',
      name: '',
      city: 'Paris',
      createdAt: '2026-01-10T00:00:00.000Z',
    };
    expect(() => validateMember(member)).toThrow(ZodError);
  });

  it('should throw error for missing ID', () => {
    const member = {
      name: 'Alice',
      city: 'Paris',
      createdAt: '2026-01-10T00:00:00.000Z',
    };
    expect(() => validateMember(member)).toThrow(ZodError);
  });

  it('should validate member with createdAt timestamp', () => {
    const member = {
      id: 'member-123',
      name: 'Alice',
      city: 'Paris',
      createdAt: '2025-01-01T00:00:00Z',
    };
    expect(validateMember(member)).toEqual(member);
  });
});

describe('validateMembers', () => {
  it('should validate an array of members', () => {
    const members = [
      { id: 'member-1', name: 'Alice', city: 'Paris', createdAt: '2026-01-10T00:00:00.000Z' },
      { id: 'member-2', name: 'Bob', city: 'London', createdAt: '2026-01-10T00:00:00.000Z' },
    ];
    expect(validateMembers(members)).toEqual(members);
  });

  it('should validate empty array', () => {
    expect(validateMembers([])).toEqual([]);
  });

  it('should throw error for invalid member in array', () => {
    const members = [
      { id: 'member-1', name: 'Alice', city: 'Paris', createdAt: '2026-01-10T00:00:00.000Z' },
      { id: 'member-2', name: '', city: 'London', createdAt: '2026-01-10T00:00:00.000Z' }, // Invalid
    ];
    expect(() => validateMembers(members)).toThrow(ZodError);
  });
});

describe('safeValidateMembers', () => {
  it('should return parsed data for valid members', () => {
    const members = [
      { id: 'member-1', name: 'Alice', city: 'Paris', createdAt: '2026-01-10T00:00:00.000Z' },
    ];
    expect(safeValidateMembers(members)).toEqual(members);
  });

  it('should return null for invalid data', () => {
    const members = [
      { name: '', city: 'Paris', createdAt: '2026-01-10T00:00:00.000Z' }, // Missing ID
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

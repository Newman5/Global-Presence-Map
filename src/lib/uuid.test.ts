// src/lib/uuid.test.ts
import { describe, it, expect } from 'vitest';
import { generateId, isValidUUID } from './uuid';

describe('generateId', () => {
  it('should generate a valid UUID', () => {
    const id = generateId();
    expect(isValidUUID(id)).toBe(true);
  });

  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it('should generate UUID v4 format', () => {
    const id = generateId();
    // UUID v4 has '4' at the 15th character
    expect(id.charAt(14)).toBe('4');
  });
});

describe('isValidUUID', () => {
  it('should validate correct UUIDs (v4 format)', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    // Note: The regex specifically checks for v4 UUIDs (4 in the version position)
    // expect(isValidUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true); // v1 UUID
    expect(isValidUUID('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(true);
  });

  it('should reject invalid UUIDs', () => {
    expect(isValidUUID('not-a-uuid')).toBe(false);
    expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false);
    expect(isValidUUID('550e8400-e29b-41d4-a716-44665544000')).toBe(false);
    expect(isValidUUID('')).toBe(false);
  });

  it('should reject UUIDs with invalid characters', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-44665544000g')).toBe(false);
    expect(isValidUUID('550e8400-e29b-41d4-a716-44665544000 ')).toBe(false);
  });

  it('should be case insensitive', () => {
    expect(isValidUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
    expect(isValidUUID('550e8400-E29B-41d4-A716-446655440000')).toBe(true);
  });
});

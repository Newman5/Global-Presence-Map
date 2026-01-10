// src/lib/uuid.ts
import crypto from 'crypto';

/**
 * Generates a random UUID v4
 * Uses crypto.randomUUID() which is available in Node.js 14.17.0+
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Validates if a string is a valid UUID
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

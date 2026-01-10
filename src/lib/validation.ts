// src/lib/validation.ts
import { z } from 'zod';

/**
 * Schema for Member entity
 * This represents a community member's identity and location preference
 */
export const MemberSchema = z.object({
  id: z.string().uuid().optional(), // Optional for backward compatibility
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  city: z.string().min(1, 'City is required').max(100, 'City too long'),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  source: z.enum(['lookup', 'fallback', 'manual']).optional(),
  createdAt: z.string().datetime().optional(),
});

export type Member = z.infer<typeof MemberSchema>;

/**
 * Schema for City coordinates
 * This represents geographic lookup data
 */
export const CityCoordSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export type CityCoord = z.infer<typeof CityCoordSchema>;

/**
 * Schema for the entire members array
 */
export const MembersArraySchema = z.array(MemberSchema);

/**
 * Schema for input when adding a new member
 */
export const AddMemberInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  city: z.string().min(1, 'City is required'),
});

export type AddMemberInput = z.infer<typeof AddMemberInputSchema>;

/**
 * Validates members data and returns parsed result
 * Throws ZodError if validation fails
 */
export function validateMembers(data: unknown): Member[] {
  return MembersArraySchema.parse(data);
}

/**
 * Validates a single member
 * Throws ZodError if validation fails
 */
export function validateMember(data: unknown): Member {
  return MemberSchema.parse(data);
}

/**
 * Safely validates members data
 * Returns parsed data on success, or null on failure with logged errors
 */
export function safeValidateMembers(data: unknown): Member[] | null {
  const result = MembersArraySchema.safeParse(data);
  if (!result.success) {
    console.error('❌ Member validation failed:', result.error.format());
    return null;
  }
  return result.data;
}

/**
 * Validates city coordinates
 * Throws ZodError if validation fails
 */
export function validateCityCoord(data: unknown): CityCoord {
  return CityCoordSchema.parse(data);
}

/**
 * Validates add member input
 * Throws ZodError if validation fails
 */
export function validateAddMemberInput(data: unknown): AddMemberInput {
  return AddMemberInputSchema.parse(data);
}

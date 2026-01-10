// src/lib/validation.ts
import { z } from 'zod';

/**
 * Schema for Member entity (Phase 3 - No coordinates stored)
 * This represents a community member's identity and location preference
 * Coordinates are computed at runtime from cities.json
 */
export const MemberSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  city: z.string().min(1, 'City is required').max(100, 'City too long'),
  createdAt: z.string().datetime(),
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
 * Schema for City entity (Phase 2)
 * Represents geographic data with metadata
 */
export const CitySchema = z.object({
  normalizedName: z.string().min(1),
  displayName: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  countryCode: z.string().optional(),
  lastUpdated: z.string().datetime().optional(),
});

export type City = z.infer<typeof CitySchema>;

/**
 * Schema for Meeting entity (Phase 2)
 * Represents a specific meeting/session event
 */
export const MeetingSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  date: z.string(), // ISO date string
  participantIds: z.array(z.string()),
  createdAt: z.string().datetime().optional(),
});

export type Meeting = z.infer<typeof MeetingSchema>;

/**
 * Schema for creating a new meeting
 */
export const CreateMeetingInputSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  participants: z.array(z.object({
    name: z.string().min(1, 'Name is required'),
    city: z.string().min(1, 'City is required'),
  })).min(1, 'At least one participant required'),
});

export type CreateMeetingInput = z.infer<typeof CreateMeetingInputSchema>;

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

/**
 * Validates meeting data
 * Throws ZodError if validation fails
 */
export function validateMeeting(data: unknown): Meeting {
  return MeetingSchema.parse(data);
}

/**
 * Validates create meeting input
 * Throws ZodError if validation fails
 */
export function validateCreateMeetingInput(data: unknown): CreateMeetingInput {
  return CreateMeetingInputSchema.parse(data);
}

/**
 * Validates city data
 * Throws ZodError if validation fails
 */
export function validateCity(data: unknown): City {
  return CitySchema.parse(data);
}

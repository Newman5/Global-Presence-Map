// src/lib/members.ts
/**
 * Member Management Service
 * 
 * This module manages the member registry - a persistent list of all community members
 * who have participated in meetings. Members store only identity and location preference;
 * actual coordinates are resolved at runtime from cities.json (single source of truth).
 * 
 * Data Model:
 * - Members are deduplicated by (name, city) pairs
 * - Each member gets a unique UUID for cross-referencing in meetings
 * - Coordinates are NOT stored (computed from cities.json when needed)
 * 
 * Storage: src/data/members.json
 */
import fs from 'fs';
import path from 'path';
import { generateId } from './uuid';
import { safeValidateMembers, validateMember, type Member } from './validation';
import { normalizeInput } from './normalize';
import { getCityLookupResult } from './cityCache';

const membersFilePath = path.join(process.cwd(), 'src', 'data', 'members.json');

// ===== File I/O Operations =====
// These functions handle reading/writing the members.json file

/**
 * Load all members from members.json
 * Validates data structure and handles missing/corrupted files gracefully
 * 
 * @returns Array of members, or empty array if file doesn't exist or is invalid
 */
export function loadMembers(): Member[] {
  if (!fs.existsSync(membersFilePath)) {
    return [];
  }

  try {
    const content = fs.readFileSync(membersFilePath, 'utf8');
    const data = JSON.parse(content) as Member[];
    const validated = safeValidateMembers(data);
    return validated ?? data; // Return raw data if validation fails
  } catch (error) {
    console.error('Error loading members:', error);
    return [];
  }
}

/**
 * Save members array to members.json
 * Writes formatted JSON with 2-space indentation for readability
 * 
 * @param members - Array of members to persist
 */
export function saveMembers(members: Member[]): void {
  fs.writeFileSync(membersFilePath, JSON.stringify(members, null, 2), 'utf8');
}

// ===== Member Lookup =====
// Functions to find existing members

/**
 * Find a member by name and city (case-insensitive match)
 * Used for deduplication - prevents creating duplicate members
 * 
 * Note: Ensures backward compatibility by auto-generating IDs for old members
 * 
 * @param name - Member name (will be normalized for comparison)
 * @param city - City name (will be normalized for comparison)
 * @returns Member object if found, null otherwise
 */
export function findMember(name: string, city: string): Member | null {
  const members = loadMembers();
  const normalizedName = name.toLowerCase();
  const normalizedCity = city.toLowerCase();

  const found = members.find(
    m => m.name.toLowerCase() === normalizedName && 
         m.city.toLowerCase() === normalizedCity
  ) ?? null;
  
  // Ensure member has an ID (backward compatibility)
  if (found && !found.id) {
    found.id = generateId();
    saveMembers(members); // Persist the ID
  }
  
  return found;
}

/**
 * Find a member by their unique ID
 * Used when resolving meeting participants
 * 
 * @param id - Member UUID
 * @returns Member object if found, null otherwise
 */
export function findMemberById(id: string): Member | null {
  const members = loadMembers();
  return members.find(m => m.id === id) ?? null;
}

// ===== Member Creation & Deduplication =====
// Core business logic for managing member lifecycle

/**
 * Find or create a member
 * 
 * This is the primary way to add members to the system. It implements automatic
 * deduplication by (name, city) pairs - if a member already exists, returns the
 * existing record instead of creating a duplicate.
 * 
 * Design Note (Phase 3):
 * - Members no longer store lat/lng coordinates (removed redundancy)
 * - Coordinates are resolved at runtime from cities.json
 * - This separates identity (stored) from geography (computed)
 * 
 * @param name - Member name (will be normalized: "john doe" -> "John Doe")
 * @param city - City name (will be normalized: "new york" -> "New York")
 * @returns Member object (existing or newly created)
 * @throws Error if name or city is empty after normalization
 */
export function findOrCreateMember(name: string, city: string): Member {
  const normalizedName = normalizeInput(name);
  const normalizedCity = normalizeInput(city);

  if (!normalizedName || !normalizedCity) {
    throw new Error('Name and city are required');
  }

  // Check if member already exists
  const existing = findMember(normalizedName, normalizedCity);
  if (existing) {
    return existing;
  }

  // Create new member (no coordinates stored)
  const newMember: Member = {
    id: generateId(),
    name: normalizedName,
    city: normalizedCity,
    createdAt: new Date().toISOString(),
  };

  // Save to file
  const members = loadMembers();
  members.push(newMember);
  saveMembers(members);

  return newMember;
}

// ===== Batch Operations =====
// Utilities for working with multiple members

/**
 * Get multiple members by their IDs
 * Used when loading meeting participants
 * 
 * @param ids - Array of member UUIDs
 * @returns Array of members (excludes IDs not found)
 */
export function getMembersByIds(ids: string[]): Member[] {
  const members = loadMembers();
  return ids.map(id => members.find(m => m.id === id)).filter((m): m is Member => m !== undefined && m.id !== undefined);
}

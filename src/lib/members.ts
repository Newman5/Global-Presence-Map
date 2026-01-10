// src/lib/members.ts
import fs from 'fs';
import path from 'path';
import { generateId } from './uuid';
import { safeValidateMembers, validateMember, type Member } from './validation';
import { normalizeInput } from './normalize';
import { getCityLookupResult } from './cityCache';

const membersFilePath = path.join(process.cwd(), 'src', 'data', 'members.json');

/**
 * Load all members from members.json
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
 * Save members to members.json
 */
export function saveMembers(members: Member[]): void {
  fs.writeFileSync(membersFilePath, JSON.stringify(members, null, 2), 'utf8');
}

/**
 * Find a member by name and city (case-insensitive)
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
 * Find a member by ID
 */
export function findMemberById(id: string): Member | null {
  const members = loadMembers();
  return members.find(m => m.id === id) ?? null;
}

/**
 * Create or find a member
 * If the member already exists, return the existing member
 * Otherwise, create a new member
 * 
 * Phase 3: Members no longer store coordinates
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

/**
 * Get members by IDs
 */
export function getMembersByIds(ids: string[]): Member[] {
  const members = loadMembers();
  return ids.map(id => members.find(m => m.id === id)).filter((m): m is Member => m !== undefined && m.id !== undefined);
}

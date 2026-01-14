// src/lib/meetings.ts
/**
 * Meeting Management Service
 * 
 * This module manages meeting sessions - discrete events where members gather.
 * Each meeting stores references to participants (member IDs), not the full member data.
 * This enables member data to be updated centrally without affecting historical meetings.
 * 
 * Data Model:
 * - Each meeting has a unique ID generated from title + date
 * - Meetings store only participant IDs (foreign keys to members.json)
 * - One meeting file per session: src/data/meetings/{meeting-id}.json
 * 
 * Key Design:
 * - Separation of concerns: meetings track "who attended when"
 * - Member details are resolved at render time
 * - Lightweight storage (IDs only, not full participant objects)
 */
import fs from 'fs';
import path from 'path';
import { validateMeeting, type Meeting } from './validation';

const meetingsDir = path.join(process.cwd(), 'src', 'data', 'meetings');

// ===== Directory Management =====

/**
 * Ensures the meetings directory exists
 * Creates it if missing (including parent directories)
 * Called automatically before any file operations
 */
function ensureMeetingsDir() {
  if (!fs.existsSync(meetingsDir)) {
    fs.mkdirSync(meetingsDir, { recursive: true });
  }
}

// ===== ID Generation =====

/**
 * Generates a unique, URL-friendly meeting ID
 * 
 * Format: {slug}-{date}
 * Example: "team-standup-2026-01-10"
 * 
 * @param title - Meeting title (will be slugified)
 * @param date - ISO date string (YYYY-MM-DD)
 * @returns Meeting ID suitable for filename and URLs
 */
function generateMeetingId(title: string, date: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug}-${date}`;
}

// ===== File I/O Operations =====

/**
 * Saves a meeting to disk as JSON
 * Creates the meetings directory if it doesn't exist
 * 
 * @param meeting - Meeting object to persist
 */
export function saveMeeting(meeting: Meeting): void {
  ensureMeetingsDir();
  const filePath = path.join(meetingsDir, `${meeting.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(meeting, null, 2), 'utf8');
}

/**
 * Loads a meeting from disk by ID
 * Validates the loaded data against the Meeting schema
 * 
 * @param meetingId - Unique meeting identifier
 * @returns Meeting object if found and valid, null otherwise
 */
export function loadMeeting(meetingId: string): Meeting | null {
  const filePath = path.join(meetingsDir, `${meetingId}.json`);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data: unknown = JSON.parse(content);
    return validateMeeting(data);
  } catch (error) {
    console.error(`Error loading meeting ${meetingId}:`, error);
    return null;
  }
}

// ===== Meeting Lifecycle =====

/**
 * Creates a new meeting and persists it to disk
 * 
 * This is the primary way to create meetings. It:
 * 1. Generates a unique ID from title + current date
 * 2. Records participant IDs (not full participant data)
 * 3. Saves to individual JSON file
 * 
 * @param title - Meeting title/name
 * @param participantIds - Array of member UUIDs who attended
 * @returns Created meeting object
 */
export function createMeeting(
  title: string,
  participantIds: string[]
): Meeting {
  const now = new Date();
  const date = now.toISOString().split('T')[0]!;
  const id = generateMeetingId(title, date);
  
  const meeting: Meeting = {
    id,
    title,
    date,
    participantIds,
    createdAt: now.toISOString(),
  };

  saveMeeting(meeting);
  return meeting;
}

// ===== Meeting Queries =====

/**
 * Lists all meetings, sorted by date (most recent first)
 * Reads from filesystem and validates each meeting file
 * 
 * @returns Array of meetings, filtered to exclude invalid files
 */
export function listMeetings(): Meeting[] {
  ensureMeetingsDir();
  
  const files = fs.readdirSync(meetingsDir).filter(f => f.endsWith('.json'));
  const meetings: Meeting[] = [];

  for (const file of files) {
    const meetingId = file.replace('.json', '');
    const meeting = loadMeeting(meetingId);
    if (meeting) {
      meetings.push(meeting);
    }
  }

  return meetings.sort((a, b) => {
    // Sort by date, most recent first
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

/**
 * Deletes a meeting from disk
 * 
 * @param meetingId - ID of meeting to delete
 * @returns true if deleted successfully, false if meeting didn't exist
 */
export function deleteMeeting(meetingId: string): boolean {
  const filePath = path.join(meetingsDir, `${meetingId}.json`);
  
  if (!fs.existsSync(filePath)) {
    return false;
  }

  fs.unlinkSync(filePath);
  return true;
}

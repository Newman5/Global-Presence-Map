// src/lib/meetings.ts
import fs from 'fs';
import path from 'path';
import { generateId } from './uuid';
import { validateMeeting, type Meeting } from './validation';

const meetingsDir = path.join(process.cwd(), 'src', 'data', 'meetings');

/**
 * Ensure meetings directory exists
 */
function ensureMeetingsDir() {
  if (!fs.existsSync(meetingsDir)) {
    fs.mkdirSync(meetingsDir, { recursive: true });
  }
}

/**
 * Generate a meeting ID from title and date
 */
function generateMeetingId(title: string, date: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug}-${date}`;
}

/**
 * Save a meeting to disk
 */
export function saveMeeting(meeting: Meeting): void {
  ensureMeetingsDir();
  const filePath = path.join(meetingsDir, `${meeting.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(meeting, null, 2), 'utf8');
}

/**
 * Load a meeting from disk
 */
export function loadMeeting(meetingId: string): Meeting | null {
  const filePath = path.join(meetingsDir, `${meetingId}.json`);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    return validateMeeting(data);
  } catch (error) {
    console.error(`Error loading meeting ${meetingId}:`, error);
    return null;
  }
}

/**
 * Create a new meeting
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

/**
 * List all meetings
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
 * Delete a meeting
 */
export function deleteMeeting(meetingId: string): boolean {
  const filePath = path.join(meetingsDir, `${meetingId}.json`);
  
  if (!fs.existsSync(filePath)) {
    return false;
  }

  fs.unlinkSync(filePath);
  return true;
}

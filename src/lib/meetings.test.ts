// src/lib/meetings.test.ts
import { describe, it, expect, afterEach } from 'vitest';
import { createMeeting, loadMeeting, listMeetings, deleteMeeting } from './meetings';
import fs from 'fs';
import path from 'path';

describe('meetings', () => {
  const meetingsDir = path.join(process.cwd(), 'src', 'data', 'meetings');

  afterEach(() => {
    // Clean up test meetings
    if (fs.existsSync(meetingsDir)) {
      const files = fs.readdirSync(meetingsDir);
      for (const file of files) {
        if (file.startsWith('test-')) {
          fs.unlinkSync(path.join(meetingsDir, file));
        }
      }
    }
  });

  describe('createMeeting', () => {
    it('should create a meeting with valid data', () => {
      const meeting = createMeeting('Test Meeting', ['member-1', 'member-2']);
      
      expect(meeting.id).toBeTruthy();
      expect(meeting.title).toBe('Test Meeting');
      expect(meeting.participantIds).toEqual(['member-1', 'member-2']);
      expect(meeting.date).toBeTruthy();
      expect(meeting.createdAt).toBeTruthy();
    });

    it('should generate slug from title', () => {
      const meeting = createMeeting('My Test Meeting!', ['member-1']);
      
      expect(meeting.id).toContain('my-test-meeting');
    });

    it('should include date in meeting ID', () => {
      const meeting = createMeeting('Meeting', ['member-1']);
      const today = new Date().toISOString().split('T')[0];
      
      expect(meeting.id).toContain(today);
    });
  });

  describe('loadMeeting', () => {
    it('should load an existing meeting', () => {
      const created = createMeeting('Test Load Meeting', ['member-1']);
      const loaded = loadMeeting(created.id);
      
      expect(loaded).not.toBeNull();
      expect(loaded?.id).toBe(created.id);
      expect(loaded?.title).toBe(created.title);
    });

    it('should return null for non-existent meeting', () => {
      const loaded = loadMeeting('non-existent-meeting');
      
      expect(loaded).toBeNull();
    });
  });

  describe('listMeetings', () => {
    it('should list all meetings', () => {
      createMeeting('Test Meeting 1', ['member-1']);
      createMeeting('Test Meeting 2', ['member-2']);
      
      const meetings = listMeetings();
      const testMeetings = meetings.filter(m => m.title.startsWith('Test Meeting'));
      
      expect(testMeetings.length).toBeGreaterThanOrEqual(2);
    });

    it('should sort meetings by date descending', () => {
      createMeeting('Test Older', ['member-1']);
      // Sleep to ensure different timestamps
      const now = Date.now();
      while (Date.now() - now < 10) {
        // busy wait
      }
      createMeeting('Test Newer', ['member-2']);
      
      const meetings = listMeetings();
      const testMeetings = meetings.filter(m => m.title.startsWith('Test'));
      
      if (testMeetings.length >= 2) {
        const dates = testMeetings.map(m => new Date(m.date).getTime());
        for (let i = 0; i < dates.length - 1; i++) {
          expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]!);
        }
      }
    });
  });

  describe('deleteMeeting', () => {
    it('should delete an existing meeting', () => {
      const meeting = createMeeting('Test Delete Meeting', ['member-1']);
      
      const deleted = deleteMeeting(meeting.id);
      expect(deleted).toBe(true);
      
      const loaded = loadMeeting(meeting.id);
      expect(loaded).toBeNull();
    });

    it('should return false for non-existent meeting', () => {
      const deleted = deleteMeeting('non-existent-meeting');
      
      expect(deleted).toBe(false);
    });
  });
});

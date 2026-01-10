# Global Presence Map - Architecture Guide

> **For Junior Developers**: This document explains how the application works, its data flow, and how to add features or troubleshoot issues.

## Table of Contents
1. [Quick Start](#quick-start)
2. [Application Overview](#application-overview)
3. [Data Flow](#data-flow)
4. [Architecture](#architecture)
5. [Key Concepts](#key-concepts)
6. [Adding Features](#adding-features)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Type check
npm run typecheck

# Build for production
npm run build
```

Visit `http://localhost:3000/globe` to see the application.

---

## Application Overview

The Global Presence Map visualizes community members' locations on an interactive 3D globe. Users can:

1. **Create meetings** by entering participant names and cities
2. **Visualize** connections between participants on a 3D globe
3. **Export** meetings as standalone HTML files

### Tech Stack
- **Next.js 15** (App Router) - React framework
- **TypeScript** - Type safety
- **react-globe.gl** - 3D globe visualization
- **Tailwind CSS** - Styling
- **Vitest** - Testing

---

## Data Flow

### Creating a Meeting

```
User Input (UI)
    ↓
Parse "Name, City" format
    ↓
POST /api/meetings
    ↓
┌─────────────────────────────┐
│ 1. Find or create members  │  ← src/lib/members.ts
│ 2. Get city coordinates    │  ← src/lib/cities.ts
│ 3. Create meeting record   │  ← src/lib/meetings.ts
└─────────────────────────────┘
    ↓
Save to disk:
  - members.json (if new members)
  - meetings/{meeting-id}.json
    ↓
Return meeting ID
    ↓
Render globe visualization
```

### Exporting a Meeting

```
User clicks "Export"
    ↓
Build HTML with:
  - Participant coordinates (from cities.json)
  - Globe.gl library
  - All-to-all arc connections
    ↓
Try: POST /api/save-meeting
  ↓ Success         ↓ Fail
Save to            Download
public/exports/    in browser
```

---

## Architecture

### Directory Structure

```
app/
├── globe/
│   └── page.tsx           # Main UI (React component)
├── api/
    ├── meetings/
    │   ├── route.ts       # POST /api/meetings - Create meeting
    │   └── [id]/
    │       └── visualization/
    │           └── route.ts  # GET /api/meetings/{id}/visualization
    └── save-meeting/
        └── route.ts       # POST /api/save-meeting - Export HTML

src/
├── lib/                   # Business logic (server-side)
│   ├── cities.ts         # City coordinate lookups
│   ├── members.ts        # Member CRUD operations
│   ├── meetings.ts       # Meeting CRUD operations
│   ├── geocode.ts        # Coordinate resolution
│   ├── validation.ts     # Zod schemas
│   └── normalize.ts      # Input normalization
├── components/
│   └── MeetingGlobe.tsx  # 3D globe React component
└── data/
    ├── cities.json       # City coordinates (single source of truth)
    ├── members.json      # Member registry
    └── meetings/         # Meeting files (one per meeting)
        └── {meeting-id}.json
```

### Data Models

#### Member
Stores identity and location preference (no coordinates):
```typescript
{
  id: string;          // UUID
  name: string;        // Display name/initials
  city: string;        // City name (not normalized)
  createdAt: string;   // ISO timestamp
}
```

#### City
Geographic coordinates (single source of truth):
```typescript
{
  normalizedName: string;  // "new york" (lowercase, used as key)
  displayName: string;     // "New York"
  lat: number;            // Latitude
  lng: number;            // Longitude
  countryCode?: string;   // "US"
}
```

#### Meeting
Session with participant references:
```typescript
{
  id: string;              // Slug from title + date
  title: string;           // "Team Standup"
  date: string;            // "2026-01-10"
  participantIds: string[]; // Member IDs
  createdAt: string;       // ISO timestamp
}
```

---

## Key Concepts

### 1. Single Source of Truth

**Coordinates are NEVER stored in members.json**. They're always computed at runtime from `cities.json`.

✅ **Good**: 
```typescript
const member = { id: '123', name: 'Alice', city: 'Paris', createdAt: '...' };
const coords = getCityCoordinates(member.city); // Lookup at runtime
```

❌ **Bad**:
```typescript
const member = { id: '123', name: 'Alice', city: 'Paris', lat: 48.8566, lng: 2.3522 }; // NO!
```

**Why?** If city coordinates change, we only update `cities.json` once, not every member record.

### 2. Member Deduplication

Members are deduplicated by `name + city` (case-insensitive):

```typescript
// These are considered the same member:
{ name: "Alice", city: "Paris" }
{ name: "alice", city: "PARIS" }

// If Alice from Paris is added twice, the same member ID is reused
```

### 3. Runtime Coordinate Resolution

When visualizing or exporting, coordinates are resolved on-demand:

```typescript
// In MeetingGlobe.tsx or handleExport()
participants.map(p => {
  const coords = geocodeCity(p.city); // Looks up in cities.json
  return { ...coords, label: `${p.name} (${p.city})` };
});
```

### 4. Export is Self-Contained

Exported HTML files embed:
- Coordinates (resolved at export time)
- Globe.gl library (from CDN)
- All visualization logic

The HTML file works standalone without the server.

---

## Adding Features

### Adding a New City

Edit `src/data/cities.json`:

```json
{
  "berlin": {
    "normalizedName": "berlin",
    "displayName": "Berlin",
    "lat": 52.5200,
    "lng": 13.4050,
    "countryCode": "DE"
  }
}
```

**Note**: The key must be lowercase with no spaces.

### Adding a New API Endpoint

1. Create file in `app/api/{endpoint}/route.ts`
2. Export `GET`, `POST`, `PUT`, or `DELETE` functions
3. Use service modules from `src/lib/` for business logic

Example:
```typescript
// app/api/members/route.ts
import { NextResponse } from 'next/server';
import { loadMembers } from '~/lib/members';

export async function GET() {
  const members = loadMembers();
  return NextResponse.json({ members });
}
```

### Modifying the Globe Visualization

Edit `src/components/MeetingGlobe.tsx`:

```typescript
// Change point color
pointColor="red"  // Instead of "orange"

// Change arc animation speed
arcDashAnimateTime(1500)  // Faster (default: 3000)

// Add custom point sizes
pointAltitude={d => d.size}  // Use size property
```

### Adding Validation

Use Zod schemas in `src/lib/validation.ts`:

```typescript
export const MyNewSchema = z.object({
  field: z.string().min(1),
  count: z.number().positive(),
});

export type MyNewType = z.infer<typeof MyNewSchema>;
```

Then use in API routes:
```typescript
const validated = MyNewSchema.parse(requestBody);
```

---

## Troubleshooting

### Globe Not Rendering

**Symptoms**: Blank space where globe should be, or console errors about WebGL

**Causes**:
1. Browser doesn't support WebGL
2. External resources (unpkg.com) blocked by ad blocker
3. Invalid coordinates in participant data

**Solutions**:
- Check browser console for errors
- Disable ad blockers for localhost
- Verify all cities exist in `cities.json`

### "Unknown cities" Warning

**Cause**: City name in input doesn't match any key in `cities.json`

**Solution**: 
1. Check city name spelling
2. Add city to `cities.json` if it's new
3. Use the normalized name (lowercase, no spaces)

```typescript
// cities.json uses keys like:
"new york"  // not "New York"
"san francisco"  // not "San Francisco"
```

### Export Fails

**Symptoms**: "Failed to save" error, or download doesn't start

**Causes**:
1. No participants in current meeting
2. Participants have unknown cities (no coordinates)
3. Server not running (for save-to-server)

**Solutions**:
- Ensure at least one participant with valid city
- Check `unknownCities` warning in UI
- For local dev, server saves to `public/exports/`

### Member Not Deduplicating

**Cause**: Case sensitivity or whitespace differences

**Debug**:
```typescript
// In src/lib/members.ts, add logging:
console.log('Looking for:', { name: normalizedName, city: normalizedCity });
console.log('Existing members:', members.map(m => ({ name: m.name, city: m.city })));
```

**Fix**: Ensure `normalizeInput()` is used consistently:
```typescript
import { normalizeInput } from '~/lib/normalize';
const normalized = normalizeInput(userInput); // Trims and lowercases
```

### Tests Failing

**Common issues**:
1. Missing required fields in test data
2. Zod validation failing due to schema changes
3. File system operations in tests (use temp directories)

**Debug**:
```bash
# Run specific test file
npm test -- src/lib/meetings.test.ts

# Run with verbose output
npm test -- --reporter=verbose

# Check type errors
npm run typecheck
```

---

## API Reference

### POST /api/meetings

Creates a new meeting with participants.

**Request**:
```json
{
  "title": "Team Standup",
  "participants": [
    { "name": "Alice", "city": "Paris" },
    { "name": "Bob", "city": "London" }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "meeting": {
    "id": "team-standup-2026-01-10",
    "title": "Team Standup",
    "date": "2026-01-10",
    "participantIds": ["uuid-1", "uuid-2"],
    "createdAt": "2026-01-10T12:00:00.000Z"
  },
  "warnings": ["City 'Atlantis' has no coordinates"]
}
```

### GET /api/meetings/{id}/visualization

Returns computed visualization data for a meeting.

**Response**:
```json
{
  "meeting": {
    "id": "team-standup-2026-01-10",
    "title": "Team Standup",
    "date": "2026-01-10"
  },
  "points": [
    {
      "memberId": "uuid-1",
      "memberName": "Alice",
      "cityName": "Paris",
      "lat": 48.8566,
      "lng": 2.3522
    }
  ],
  "arcs": [
    {
      "startLat": 48.8566,
      "startLng": 2.3522,
      "endLat": 51.5074,
      "endLng": -0.1278
    }
  ]
}
```

### POST /api/save-meeting

Saves exported HTML to server.

**Request**:
```json
{
  "html": "<!DOCTYPE html>...",
  "filename": "team-standup-2026-01-10.html"
}
```

**Response**:
```json
{
  "success": true,
  "path": "/exports/team-standup-2026-01-10.html"
}
```

---

## Best Practices

### Code Organization

1. **UI logic** → `app/globe/page.tsx`
2. **Business logic** → `src/lib/*.ts` (server-side only)
3. **API routes** → `app/api/*/route.ts`
4. **Validation** → `src/lib/validation.ts` (Zod schemas)
5. **Types** → Infer from Zod schemas, don't duplicate

### Error Handling

```typescript
// ✅ Good: Specific error messages
if (!member.id) {
  throw new Error(`Member ${member.name} has no ID`);
}

// ❌ Bad: Generic errors
if (!valid) {
  throw new Error('Invalid data');
}
```

### Testing

```typescript
// ✅ Good: Test business logic, not implementation
it('should deduplicate members by name and city', () => {
  const m1 = findOrCreateMember('Alice', 'Paris');
  const m2 = findOrCreateMember('alice', 'PARIS');
  expect(m1.id).toBe(m2.id);
});

// ❌ Bad: Testing internal implementation
it('should call normalizeInput twice', () => {
  const spy = vi.spyOn(normalize, 'normalizeInput');
  findOrCreateMember('Alice', 'Paris');
  expect(spy).toHaveBeenCalledTimes(2);
});
```

### Performance

- **Coordinates are cached** in memory after first load from `cities.json`
- **File I/O is synchronous** (acceptable for low volume, consider async for scale)
- **Globe rendering** is lazy-loaded to avoid SSR issues

---

## Questions?

- Check the [data-model-workflow-analysis.md](./docs/data-model-workflow-analysis.md) for design decisions
- Run `npm test` to see working examples
- Read the inline JSDoc comments in `src/lib/*.ts`

---

**Last Updated**: 2026-01-10

# 🌍 Global Presence Map

**Version:** v0.3.0 — Phase 2-3 Refactoring Complete
**Date:** 2026-01-10

Visualize community member locations on an interactive 3D globe. Create meeting sessions, see connections between participants, and export as standalone HTML files.

---

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Visit the application
open http://localhost:3000/globe
```

---

## Features

- **Create Meetings**: Enter participant names and cities in "Name, City" format
- **3D Visualization**: Interactive globe showing member locations and connections
- **Export**: Save meetings as standalone HTML files
- **Member Deduplication**: Automatically reuses members across meetings
- **Offline Support**: Exported files work without internet connection

---

## Project Structure

```
app/
├── globe/page.tsx           # Main UI
└── api/
    ├── meetings/            # Meeting creation & visualization
    └── save-meeting/        # Export functionality

src/
├── lib/                     # Business logic
│   ├── cities.ts           # City coordinates (single source of truth)
│   ├── members.ts          # Member management
│   ├── meetings.ts         # Meeting sessions
│   └── validation.ts       # Type-safe schemas
├── components/
│   └── MeetingGlobe.tsx    # 3D globe component
└── data/
    ├── cities.json         # City coordinates database
    ├── members.json        # Member registry
    └── meetings/           # Meeting files
```

---

## Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete guide for developers (data flow, adding features, troubleshooting)
- **[docs/data-model-workflow-analysis.md](./docs/data-model-workflow-analysis.md)** - Design decisions and refactoring history

---

## Tech Stack

- **Next.js 15** (App Router) - React framework
- **TypeScript** - Type safety
- **react-globe.gl** - 3D globe visualization
- **Tailwind CSS** - Styling
- **Vitest** - Testing
- **Zod** - Runtime validation

---

## Development

```bash
# Run tests
npm test

# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run format:write

# Build for production
npm run build
```

---

## Data Model

### Members
Identity and location preference (coordinates resolved at runtime):
```json
{
  "id": "uuid",
  "name": "Alice",
  "city": "Paris",
  "createdAt": "2026-01-10T00:00:00.000Z"
}
```

### Cities
Geographic coordinates (single source of truth):
```json
{
  "normalizedName": "paris",
  "displayName": "Paris",
  "lat": 48.8566,
  "lng": 2.3522,
  "countryCode": "FR"
}
```

### Meetings
Session with participant references:
```json
{
  "id": "team-standup-2026-01-10",
  "title": "Team Standup",
  "date": "2026-01-10",
  "participantIds": ["uuid-1", "uuid-2"],
  "createdAt": "2026-01-10T12:00:00.000Z"
}
```

---

## Usage

1. **Enter Meeting Name** (optional)
2. **Add Participants**: One per line in format: `Name, City`
   ```
   Alice, Paris
   Bob, London
   Charlie, Tokyo
   ```
3. **Click "Render Globe"** to visualize
4. **Click "Export Globe"** to save as HTML file
5. **Click "Clear"** to create another meeting

---

## Adding Cities

### Automated Method (Recommended)

The easiest way to add missing cities is to use the automated script:

```bash
# Automatically finds cities in members.json that aren't in cities.json
# and fetches their coordinates from OpenStreetMap
npm run fill-cities
```

This script will:
- Scan `members.json` for cities not in `cities.json`
- Fetch coordinates from OpenStreetMap Nominatim API
- Automatically detect country codes
- Add them to `cities.json` with proper formatting
- Create a backup before modifying files

**Options:**
- `--force-api`: Always use API instead of member-provided coordinates
- `--verify-member`: Verify member coordinates against API (default: true)

### Manual Method

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

**Note**: Keys must be lowercase with spaces preserved (e.g., "new york" not "newyork").

---

## Troubleshooting

### Globe Not Rendering
- Check browser console for errors
- Verify all cities exist in `cities.json`
- Run `npm run fill-cities` to add missing cities automatically
- Disable ad blockers (unpkg.com resources needed)

### Unknown Cities Warning
- City name doesn't match `cities.json`
- Run `npm run fill-cities` to automatically add missing cities
- Or manually add city to `cities.json`
- Use normalized name (lowercase, spaces preserved)

### Export Fails
- Ensure at least one participant with valid city
- Check for "Unknown cities" warning
- Server must be running for save-to-server

See [ARCHITECTURE.md](./ARCHITECTURE.md#troubleshooting) for detailed troubleshooting guide.

---

## License

MIT License © 2026 Global Presence Map contributors

---

## Credits

- [react-globe.gl](https://github.com/vasturiano/react-globe.gl) - 3D visualization
- [Three.js](https://threejs.org/) - 3D rendering engine
- [Globe.gl](https://globe.gl/) - Globe rendering

---

> Built to connect communities around the world 🌍

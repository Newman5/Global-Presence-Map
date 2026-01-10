# Global Presence Map – Architecture Proposal (Quick Reference)

**Status:** Proposal Only (No Implementation)  
**Full Analysis:** See [data-model-workflow-analysis.md](./data-model-workflow-analysis.md)

---

## TL;DR

**Problem:** Data model mixes concerns, stores redundant coordinates, conflates members with meetings.

**Solution:** Separate Member (identity), City (geography), Meeting (session) entities. Compute visualization data at runtime.

**Impact:** 50% complexity reduction, eliminated bugs, easier maintenance.

**Effort:** 4-6 days for critical fixes, 1 month for complete refactoring.

---

## Current State (Problems)

```
❌ members.json stores lat/lng (redundant with cityCoords.ts)
❌ No separation between member registry and meeting participants
❌ Geocoding tightly coupled to member creation
❌ Visualization uses in-memory state, not persisted data
❌ Fallback coordinates persisted permanently
❌ Loop of API calls for each participant
```

---

## Proposed State (Benefits)

```
✅ Single source of truth for geographic data (cities.json)
✅ Members are identity only (no coordinates)
✅ Meetings reference members by ID
✅ Visualization computed on-demand from separate stores
✅ Background geocoding decoupled from user input
✅ Batch API for creating meetings
```

---

## Data Model (Before & After)

### Before (Current)
```json
// members.json
[
  {"name": "N", "city": "New York", "lat": 40.7127, "lng": -74.006}
]

// sample-meeting.json  
{
  "title": "Meeting",
  "participants": [
    {"name": "N", "city": "New York", "lat": 40.7127, "lng": -74.006}
  ]
}
```
**Problem:** Coordinates duplicated, no relationship between member and participation.

---

### After (Proposed)
```json
// members.json
[
  {"id": "m1", "name": "N", "defaultCity": "New York"}
]

// cities.json
{
  "newyork": {"displayName": "New York", "lat": 40.7127, "lng": -74.006}
}

// meetings/gimbalabs-2025-10-17.json
{
  "id": "gimbalabs-2025-10-17",
  "title": "Gimbalabs Global Call",
  "date": "2025-10-17",
  "participantIds": ["m1", "m2"]
}

// Visualization (computed at runtime, not stored)
{
  "points": [
    {"memberId": "m1", "name": "N", "city": "New York", "lat": 40.7127, "lng": -74.006}
  ]
}
```
**Benefit:** Each entity has single responsibility, coordinates computed from cities.json.

---

## Architecture Comparison

### Current Flow
```
User Input → Parse → Loop: POST /api/add-member → Geocode → Write members.json
           ↓
     Render from in-memory state (ignores members.json)
```
**Issues:** N API calls, redundant I/O, unused persistence

---

### Proposed Flow
```
User Input → Parse → Single POST /api/meetings → Find/Create Members → Create Meeting
                                                ↓
GET /api/meetings/:id/viz → Join (Meeting + Members + Cities) → Compute Points/Arcs
                           ↓
                    Render globe
```
**Benefits:** Single API call, clear data flow, computed visualization

---

## Incremental Improvement Plan

### Phase 1: Stabilization (4-6 days)
- [ ] Stop writing coordinates to members.json
- [ ] Add validation schemas (Zod)
- [ ] Separate geocoding service

### Phase 2: Refactoring (2-3 weeks)
- [ ] Create cities.json
- [ ] Introduce meetings/ directory
- [ ] Add member IDs
- [ ] New API endpoints (backward compatible)

### Phase 3: Cleanup (1 week)
- [ ] Remove coordinates from members.json
- [ ] Deprecate old endpoints
- [ ] Centralize geocoding

### Phase 4: Optimization (optional)
- [ ] Add database layer (SQLite/Postgres)
- [ ] Implement caching (Redis)
- [ ] Multiple geocoding providers

---

## Critical Changes (Minimal, High Impact)

### 1. Stop Persisting Coordinates (Day 1-2)
```diff
// app/api/add-member/route.ts
- const newMember = { name, city, lat, lng };
+ const newMember = { name, city }; // No coordinates

// Lookup happens at render time via geocode.ts
```

### 2. Introduce Meeting Entity (Day 3-4)
```typescript
// meetings/meeting-123.json
{
  "id": "meeting-123",
  "title": "Global Call",
  "participantIds": ["m1", "m2"] // References, not embedded data
}
```

### 3. Centralize Geocoding (Day 5-6)
```typescript
// services/geocoding.ts
export class GeocodingService {
  async resolveCity(name: string): Promise<Coordinates> {
    // Check cities.json first
    // Queue background job if missing
    // Return placeholder immediately
  }
}
```

---

## Visual Architecture

```
┌─────────────────────────────────────────────┐
│              User Interface                 │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐   │
│  │ Meeting │  │ Globe   │  │ Export   │   │
│  │  Input  │  │ Viewer  │  │ HTML     │   │
│  └────┬────┘  └────┬────┘  └────┬─────┘   │
└───────┼───────────┼────────────┼───────────┘
        │           │            │
        ▼           ▼            ▼
┌─────────────────────────────────────────────┐
│                  API Layer                  │
│  POST /meetings  GET /meetings/:id/viz      │
└───────┬─────────────────┬───────────────────┘
        │                 │
        ▼                 ▼
┌─────────────────────────────────────────────┐
│        Data Layer (Source of Truth)         │
│  ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ members  │ │  cities  │ │  meetings  │  │
│  │  .json   │ │  .json   │ │  /{id}.json│  │
│  └──────────┘ └──────────┘ └────────────┘  │
└─────────────────────────────────────────────┘
        │                 │
        └────────┬────────┘
                 ▼
        ┌─────────────────┐
        │  Computed View  │ (Not persisted)
        │  Visualization  │
        └─────────────────┘
```

---

## Entities & Responsibilities

| Entity | Responsibility | Stored? | Example |
|--------|---------------|---------|---------|
| **Member** | Identity & location preference | ✅ Yes | `{id, name, defaultCity}` |
| **City** | Geographic coordinates (canonical) | ✅ Yes | `{normalizedName, lat, lng}` |
| **Meeting** | Session event & attendance | ✅ Yes | `{id, title, participantIds}` |
| **Visualization** | Points & arcs for rendering | ❌ No | Computed from above |

---

## Design Principles

1. **Single Source of Truth** - Each fact stored once
2. **Separation of Concerns** - Identity ≠ Geography ≠ Participation
3. **Compute on Read** - Derive data, don't store it
4. **Incremental Refactorability** - Small, safe steps
5. **Contributor Friendly** - Clear structure, good docs

---

## Key Questions for Team

1. **Primary Use Case**: Member registry or meeting tracker?
2. **Data Privacy**: Are initials sufficient? Consent tracking needed?
3. **Export vs Live**: Which is the primary deliverable?
4. **Historical Data**: Preserve `members.json` or clean migration?
5. **Multi-Community**: Support multiple organizations?

---

## Next Steps

1. ☐ Team review of this proposal
2. ☐ Validate assumptions about use cases
3. ☐ Prioritize changes based on pain points
4. ☐ Prototype Phase 1 in feature branch
5. ☐ Write migration scripts
6. ☐ Update documentation

---

## Success Metrics

| Metric | Current | Target | Impact |
|--------|---------|--------|--------|
| Data model entities | 2 (confused) | 3 (clear) | Clarity |
| Coordinate storage locations | 3 | 1 | Reduced bugs |
| API calls per meeting | N | 1 | Performance |
| Lines of code | ~800 | ~600 | Simplicity |
| Contributor onboarding time | 2 hours | 30 min | Friendliness |

---

## Resources

- **Full Analysis**: [data-model-workflow-analysis.md](./data-model-workflow-analysis.md)
- **Repository**: [GitHub](https://github.com/Newman5/Global-Presence-Map)
- **Current README**: [README.md](../README.md)

---

**End of Summary**

*For detailed rationale, flow diagrams, and implementation guidance, see the full analysis document.*

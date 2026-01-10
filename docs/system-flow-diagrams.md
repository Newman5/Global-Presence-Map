# Global Presence Map – Flow Diagrams

This document contains detailed Mermaid diagrams for visualizing the current and proposed system flows.

---

## 1. Current System Flow (As-Is)

### Sequence Diagram: User Input to Visualization

```mermaid
sequenceDiagram
    participant User
    participant UI as Globe UI<br/>(globe/page.tsx)
    participant API as /api/add-member
    participant FS as members.json<br/>(File System)
    participant Static as cityCoords.ts<br/>(Static Lookup)

    User->>UI: Paste participants<br/>"N, New York"
    UI->>UI: Parse input into array
    
    Note over UI,API: Loop executes N times (once per participant)
    
    loop For each participant
        UI->>API: POST {name: "N", city: "New York"}
        API->>API: normalizeInput(name, city)
        API->>Static: Lookup "New York" in cityCoords
        
        alt City found in cityCoords
            Static-->>API: {lat: 40.7127, lng: -74.006}
        else City not found
            API->>API: Use fallback coords (25, -71)<br/>Bermuda Triangle
        end
        
        API->>FS: Read entire members.json file
        API->>API: Check for duplicate<br/>(name + city)
        
        alt Not duplicate
            API->>API: Create member object<br/>{name, city, lat, lng}
            API->>FS: Write updated members.json
            API-->>UI: {success: true, member}
        else Duplicate exists
            API-->>UI: {error: "Already exists"}
        end
    end
    
    Note over UI: Visualization uses<br/>in-memory participant array<br/>(NOT members.json)
    
    UI->>UI: Generate points from participants
    UI->>UI: Generate arcs (all-to-all)
    UI->>UI: Render 3D globe

    Note over FS: members.json updated but<br/>NOT used for current session
```

**Key Problems Highlighted:**
1. **N API calls in sequence** - Poor performance
2. **File read/write in loop** - Concurrency risk
3. **Fallback coords persisted** - Bad data becomes permanent
4. **Disconnected persistence** - Stored data not used

---

## 2. Current System Architecture

### Component Diagram: System Structure (Current)

```mermaid
graph TB
    subgraph "Frontend Layer"
        Input[User Input Form<br/>globe/page.tsx]
        Globe[Globe Visualization<br/>MeetingGlobe.tsx]
        Export[Export to HTML]
    end
    
    subgraph "API Layer"
        AddMember[POST /api/add-member]
        SaveMeeting[POST /api/save-meeting]
    end
    
    subgraph "Business Logic"
        Normalize[normalizeInput<br/>normalize.ts]
        Geocode[geocodeCity<br/>geocode.ts]
    end
    
    subgraph "Data Storage"
        MembersJSON[members.json<br/>Name, City, Lat, Lng]
        CityCoords[cityCoords.ts<br/>Static Lookup Table]
    end
    
    subgraph "In-Memory State"
        ParticipantArray[participants: Array<br/>NOT persisted]
    end
    
    Input -->|Parse input| ParticipantArray
    Input -->|Loop: POST each| AddMember
    
    AddMember --> Normalize
    AddMember --> Geocode
    Geocode --> CityCoords
    AddMember -->|Read/Write| MembersJSON
    
    ParticipantArray -->|Direct use| Globe
    Globe --> Export
    
    Export --> SaveMeeting
    SaveMeeting -->|Write HTML| ExportFile[/public/exports/]
    
    style MembersJSON fill:#ffcccc
    style CityCoords fill:#ffcccc
    style ParticipantArray fill:#ffffcc
    
    Note1[❌ Redundant storage]
    Note2[❌ Unused for visualization]
    Note3[❌ Only used for current session]
    
    MembersJSON -.-> Note1
    MembersJSON -.-> Note2
    ParticipantArray -.-> Note3
```

**Architecture Issues:**
- Red boxes: Redundant coordinate storage
- Yellow box: Ephemeral state used for rendering
- Dotted lines: Problems

---

## 3. Proposed System Flow (To-Be)

### Sequence Diagram: Simplified Meeting Creation

```mermaid
sequenceDiagram
    participant User
    participant UI as Meeting UI
    participant API as /api/meetings
    participant MemberSvc as MemberService
    participant CitySvc as CityService
    participant MeetingSvc as MeetingService
    participant BG as Background Job

    User->>UI: Paste participants<br/>"N, New York\nT, Tallinn"
    UI->>UI: Parse input
    UI->>API: POST /api/meetings<br/>{title, participants: [{name, city}]}
    
    Note over API: Single batch operation
    
    API->>API: Extract unique cities
    
    loop For each unique city
        API->>CitySvc: Lookup normalized city name
        
        alt City exists in cities.json
            CitySvc-->>API: {lat, lng, displayName}
        else City not found
            CitySvc->>CitySvc: Mark as PENDING
            CitySvc->>BG: Queue geocoding task
            CitySvc-->>API: {status: "pending", placeholder}
        end
    end
    
    loop For each participant
        API->>MemberSvc: findOrCreateMember(name, city)
        
        alt Member exists
            MemberSvc-->>API: {id: "m1"}
        else New member
            MemberSvc->>MemberSvc: Generate UUID
            MemberSvc->>MemberSvc: Write to members.json
            MemberSvc-->>API: {id: "m-new-uuid"}
        end
    end
    
    API->>MeetingSvc: createMeeting(title, date, participantIds)
    MeetingSvc->>MeetingSvc: Write to meetings/{id}.json
    MeetingSvc-->>API: {meetingId: "mtg-123"}
    
    API-->>UI: {meetingId: "mtg-123",<br/>warnings: ["Tallinn pending geocoding"]}
    
    Note over BG: Async geocoding happens<br/>in background
    
    BG->>BG: Geocode pending cities
    BG->>CitySvc: Update cities.json
    
    Note over UI: User can view partial data<br/>immediately, full data when ready
    
    UI->>API: GET /api/meetings/mtg-123/viz
    API->>MeetingSvc: Load meeting data
    API->>MemberSvc: Load members by IDs
    API->>CitySvc: Load cities by names
    
    API->>API: Compute visualization:<br/>Join members + cities<br/>Generate points & arcs
    
    API-->>UI: {points: [...], arcs: [...]}
    UI->>UI: Render 3D globe
```

**Key Improvements:**
1. **Single API call** - Better UX, better performance
2. **Background geocoding** - Non-blocking workflow
3. **Clear service separation** - Easier to test and maintain
4. **Computed visualization** - Always fresh, no stale data

---

## 4. Proposed System Architecture

### Component Diagram: System Structure (Proposed)

```mermaid
graph TB
    subgraph "User Interface"
        InputForm[Meeting Input Form]
        GlobeViz[Globe Visualization]
        ExportTool[Export to HTML]
    end
    
    subgraph "API Layer"
        CreateMeeting[POST /api/meetings]
        GetMeeting[GET /api/meetings/:id]
        GetViz[GET /api/meetings/:id/viz]
        GetMembers[GET /api/members]
    end
    
    subgraph "Service Layer"
        MemberSvc[MemberService<br/>CRUD operations]
        CitySvc[CityService<br/>Geocoding & lookup]
        MeetingSvc[MeetingService<br/>Meeting management]
        VizSvc[VisualizationService<br/>Compute points/arcs]
    end
    
    subgraph "Data Layer - Single Source of Truth"
        Members[members.json<br/>{id, name, defaultCity}]
        Cities[cities.json<br/>{name, lat, lng}]
        Meetings[meetings/{id}.json<br/>{id, title, participantIds}]
    end
    
    subgraph "Background Jobs"
        GeocodeBG[Geocode Service<br/>Async city resolution]
    end
    
    subgraph "Computed (Not Stored)"
        VizData[Visualization Data<br/>points, arcs]
    end
    
    InputForm --> CreateMeeting
    CreateMeeting --> MemberSvc
    CreateMeeting --> CitySvc
    CreateMeeting --> MeetingSvc
    
    MemberSvc --> Members
    CitySvc --> Cities
    MeetingSvc --> Meetings
    
    GlobeViz --> GetViz
    GetViz --> MeetingSvc
    GetViz --> MemberSvc
    GetViz --> CitySvc
    GetViz --> VizSvc
    
    VizSvc --> VizData
    VizData --> GlobeViz
    
    ExportTool --> GetViz
    
    CitySvc -.Queue.-> GeocodeBG
    GeocodeBG -.Update.-> Cities
    
    style Members fill:#e1f5ff
    style Cities fill:#e1f5ff
    style Meetings fill:#e1f5ff
    style VizData fill:#ffe1e1
    
    Note1[✅ Single source<br/>of truth]
    Note2[✅ Computed<br/>on-demand]
    Note3[✅ Background<br/>processing]
    
    Cities -.-> Note1
    VizData -.-> Note2
    GeocodeBG -.-> Note3
```

**Architecture Benefits:**
- Blue boxes: Canonical data stores (one responsibility each)
- Pink box: Computed data (never stored)
- Service layer provides clean abstractions
- Background jobs decouple slow operations

---

## 5. Data Flow Comparison

### Side-by-Side: Current vs Proposed

```mermaid
graph LR
    subgraph "Current Flow (Problems)"
        A1[User Input] --> B1[Parse]
        B1 --> C1[Loop: N POSTs]
        C1 --> D1[Geocode Each]
        D1 --> E1[Write to members.json<br/>with lat/lng ❌]
        E1 --> F1[Render from<br/>in-memory array ❌]
    end
    
    subgraph "Proposed Flow (Benefits)"
        A2[User Input] --> B2[Parse]
        B2 --> C2[Single POST]
        C2 --> D2[Batch Process]
        D2 --> E2[Write to 3 stores<br/>separately ✅]
        E2 --> F2[Compute viz<br/>from stores ✅]
    end
    
    style E1 fill:#ffcccc
    style F1 fill:#ffcccc
    style E2 fill:#ccffcc
    style F2 fill:#ccffcc
```

---

## 6. State Diagram: Meeting Lifecycle

### Current State Machine (Implicit)

```mermaid
stateDiagram-v2
    [*] --> InputParsed: User pastes data
    InputParsed --> AddingMembers: Click "Render"
    AddingMembers --> AddingMembers: POST each member<br/>(loop)
    AddingMembers --> Rendered: Loop complete
    Rendered --> Exported: Click "Export"
    Exported --> [*]
    
    note right of AddingMembers
        ❌ No meeting entity
        ❌ Members added to global list
        ❌ No way to recreate session
    end note
```

### Proposed State Machine (Explicit)

```mermaid
stateDiagram-v2
    [*] --> Draft: User inputs data
    Draft --> Creating: Submit meeting
    Creating --> PendingGeocode: Some cities unknown
    Creating --> Ready: All cities known
    PendingGeocode --> Ready: Background job completes
    Ready --> Viewing: Render visualization
    Viewing --> Exported: Export to HTML
    Exported --> Archived: Save for later
    Archived --> [*]
    
    note right of Ready
        ✅ Meeting is persistent entity
        ✅ Can be viewed anytime
        ✅ Members reusable across meetings
    end note
```

---

## 7. Entity Relationship Diagram

### Current Model (Confused)

```mermaid
erDiagram
    MEMBERS {
        string name PK
        string city
        float lat
        float lng
    }
    
    CITY_COORDS {
        string cityName PK
        float lat
        float lng
    }
    
    SAMPLE_MEETING {
        string title
        string date
        json participants
    }
    
    MEMBERS ||--o{ CITY_COORDS : "duplicates?"
    SAMPLE_MEETING ||--o{ MEMBERS : "embeds?"
    
    note "❌ No clear relationships<br/>❌ Redundant coordinates<br/>❌ Can't track participation"
```

### Proposed Model (Clear)

```mermaid
erDiagram
    MEMBER {
        string id PK
        string name
        string defaultCity FK
        timestamp createdAt
    }
    
    CITY {
        string normalizedName PK
        string displayName
        float lat
        float lng
        string countryCode
        timestamp lastUpdated
    }
    
    MEETING {
        string id PK
        string title
        string date
        timestamp createdAt
    }
    
    PARTICIPATION {
        string meetingId FK
        string memberId FK
        int position
    }
    
    MEMBER ||--o{ PARTICIPATION : "attends"
    MEETING ||--o{ PARTICIPATION : "has"
    MEMBER }o--|| CITY : "located in"
    
    note "✅ Clear relationships<br/>✅ No redundancy<br/>✅ Participation tracked"
```

---

## 8. Deployment Architecture

### Proposed Deployment Flow

```mermaid
graph TB
    subgraph "Development"
        Dev[Local Development]
        Dev --> Git[Git Commit]
    end
    
    subgraph "CI/CD"
        Git --> GHA[GitHub Actions]
        GHA --> Build[npm run build]
        Build --> Test[npm test]
        Test --> Export[npm run export]
    end
    
    subgraph "Static Export"
        Export --> HTML[Static HTML]
        HTML --> GHPages[GitHub Pages]
    end
    
    subgraph "Production"
        GHPages --> CDN[Cloudflare CDN]
        CDN --> Users[End Users]
    end
    
    subgraph "Data Management"
        Script[fillMissingCoords.js]
        Script -.Update.-> Cities[cities.json]
        Cities --> Git
    end
    
    style GHPages fill:#90EE90
    style CDN fill:#90EE90
```

---

## 9. Migration Path

### Phased Migration Strategy

```mermaid
gantt
    title Migration Timeline (4-6 weeks)
    dateFormat  YYYY-MM-DD
    section Phase 1
    Stop persisting coords     :2025-01-01, 2d
    Add validation schemas     :2025-01-03, 2d
    Separate geocoding service :2025-01-05, 2d
    
    section Phase 2
    Create cities.json         :2025-01-08, 3d
    Introduce meetings dir     :2025-01-11, 4d
    Add member IDs             :2025-01-15, 3d
    New API endpoints          :2025-01-18, 4d
    
    section Phase 3
    Remove old coords          :2025-01-22, 2d
    Deprecate old endpoints    :2025-01-24, 2d
    Centralize geocoding       :2025-01-26, 2d
    
    section Phase 4
    Add caching                :2025-01-29, 3d
    Performance optimization   :2025-02-01, 4d
```

---

**End of Diagrams Document**

*These diagrams are referenced in the main analysis document and can be viewed in any Markdown viewer that supports Mermaid syntax.*

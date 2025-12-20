# Meeting Platform Plugin Feasibility Analysis

**Document Version:** 1.0  
**Date:** 2025-12-20  
**Status:** Feasibility Study & Architecture Proposal

---

## Executive Summary

The Global Presence Map can be adapted as a plugin/integration for popular online meeting platforms (Zoom, Google Meet, Microsoft Teams). This document analyzes technical feasibility, architectural approaches, and implementation paths for each platform.

**Quick Answer:**
- ✅ **Zoom Apps SDK** - Most feasible, best developer experience
- ⚠️ **Google Meet Add-ons** - Feasible but limited, requires Google Workspace
- ⚠️ **Microsoft Teams Apps** - Feasible, more complex platform
- ✅ **Generic Iframe Approach** - Universal fallback for all platforms

**Recommended Path:** Start with Zoom Apps SDK, then generic iframe solution for broader compatibility.

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Current System Analysis](#2-current-system-analysis)
3. [Integration Approaches](#3-integration-approaches)
4. [Platform-Specific Feasibility](#4-platform-specific-feasibility)
5. [Architecture Proposal](#5-architecture-proposal)
6. [Implementation Roadmap](#6-implementation-roadmap)
7. [Technical Challenges](#7-technical-challenges)
8. [Alternative Approaches](#8-alternative-approaches)
9. [Recommendations](#9-recommendations)

---

## 1. Platform Overview

### 1.1 Zoom Apps SDK

**Status:** ✅ Mature, well-documented platform

**Key Features:**
- In-meeting apps with dedicated UI panels
- Access to participant list, meeting context
- Real-time participant join/leave events
- WebSocket for live updates
- OAuth 2.0 authentication
- Can run as sidebar panel or overlay

**API Access:**
- Participant names (display names)
- User IDs (anonymized or real, based on permissions)
- Join/leave timestamps
- Meeting metadata (title, ID)
- **No direct location data** (privacy restriction)

**Distribution:**
- Zoom App Marketplace
- Private distribution to organization
- Requires Zoom account and app approval

**Documentation:** https://developers.zoom.us/docs/zoom-apps/

---

### 1.2 Google Meet Add-ons

**Status:** ⚠️ Limited, newer platform (launched 2023)

**Key Features:**
- Side panel add-ons
- Access to meeting ID and basic metadata
- OAuth 2.0 with Google Workspace
- Limited to Google Workspace customers (not free accounts)
- Uses Google Apps Script or standalone web apps

**API Access:**
- Meeting code/ID
- Participant count (aggregate only)
- Meeting title
- **Very limited participant information** (privacy restrictions)

**Distribution:**
- Google Workspace Marketplace
- Requires domain admin approval
- Must be deployed via Google Apps Script or Cloud Functions

**Documentation:** https://developers.google.com/meet/add-ons

---

### 1.3 Microsoft Teams Apps

**Status:** ⚠️ Complex but feature-rich

**Key Features:**
- In-meeting apps (tabs, bots, message extensions)
- Access to participant roster via Graph API
- Meeting events via webhooks
- Adaptive Cards for rich UI
- Integration with Microsoft 365

**API Access:**
- Participant list (with permissions)
- User profiles (via Graph API)
- Meeting chat context
- Join/leave events

**Distribution:**
- Microsoft Teams App Store
- Private distribution (org catalog)
- Requires Azure AD registration

**Documentation:** https://learn.microsoft.com/en-us/microsoftteams/platform/

---

### 1.4 Generic Iframe Approach

**Status:** ✅ Universal, no platform-specific code

**Key Features:**
- Works with any video platform
- Shared via meeting chat or screen share
- No installation required
- No API access to meeting data

**Limitations:**
- Manual participant input (paste into form)
- No automatic participant detection
- Requires URL sharing

**Distribution:**
- Direct URL sharing
- Browser bookmarklet
- Browser extension (optional)

---

## 2. Current System Analysis

### 2.1 Existing Architecture

The Global Presence Map is currently:
- **Next.js web application** (React 19, TypeScript)
- **Standalone deployment** (Vercel/GitHub Pages)
- **Manual data entry** (paste participant list)
- **Client-side rendering** (3D globe via react-globe.gl)
- **No authentication** required
- **No backend persistence** (optional file writes)

### 2.2 Core Functionality

**What the system does:**
1. Accept participant input (name, city)
2. Geocode cities to coordinates
3. Render 3D globe with points and arcs
4. Export to standalone HTML
5. Persist to members.json (optional)

**What a plugin would need:**
1. ✅ Accept participant list from meeting API
2. ✅ Collect location data (either API or self-reported)
3. ✅ Render globe in plugin panel
4. ✅ Update in real-time as participants join/leave
5. ❌ Cannot access participant location directly (privacy)

### 2.3 Key Dependencies

- **react-globe.gl** (2.36.0) - Works in iframe, may need adjustments
- **Three.js** (0.180.0) - WebGL required (supported in all platforms)
- **Next.js** (15.2.3) - May need to extract core component
- **TypeScript** - Fully compatible

**Compatibility:** ✅ All dependencies are browser-compatible and work in iframe contexts.

---

## 3. Integration Approaches

### 3.1 Approach A: Full Plugin Integration

**Description:** Native plugin using platform SDK

**Pros:**
- Best user experience (embedded in meeting)
- Access to participant list automatically
- Real-time updates on join/leave
- Professional appearance
- Can show to all participants simultaneously

**Cons:**
- Platform-specific code (Zoom ≠ Google Meet ≠ Teams)
- Requires app approval and marketplace listing
- Location data still requires user input (privacy)
- Ongoing maintenance for each platform

**Best For:** Organizations with enterprise accounts, high-polish product

---

### 3.2 Approach B: Iframe Embed

**Description:** Lightweight embed via iframe, shared URL

**Pros:**
- Platform-agnostic (works everywhere)
- No approval process required
- Quick to implement (minimal changes)
- No authentication complexity
- Works with existing codebase

**Cons:**
- Manual participant input still required
- No automatic participant detection
- Less polished UX
- Requires URL sharing via chat

**Best For:** MVP, quick deployment, broad compatibility

---

### 3.3 Approach C: Hybrid Solution

**Description:** Core web app + optional platform integrations

**Pros:**
- Supports both use cases
- Graceful degradation
- Start simple, add features incrementally
- Reuses core visualization logic

**Cons:**
- More complex architecture
- Two distribution channels
- Higher maintenance burden

**Best For:** Long-term product strategy with phased rollout

---

### 3.4 Approach D: Browser Extension

**Description:** Chrome/Firefox extension that detects meeting platforms

**Pros:**
- Works across platforms automatically
- Can extract participant names from DOM
- No per-platform approval needed
- User-controlled installation

**Cons:**
- Brittle (breaks when platforms change UI)
- Privacy concerns (DOM access)
- Limited to desktop browsers
- Requires separate extension store approval

**Best For:** Power users, experimental features

---

## 4. Platform-Specific Feasibility

### 4.1 Zoom Apps SDK Integration

#### Technical Feasibility: ✅ HIGH

**How it would work:**

1. **App Structure:**
   ```
   zoom-app/
   ├── manifest.json          # Zoom app configuration
   ├── index.html             # App entry point
   ├── client/                # React globe component
   ├── server/                # Optional backend for data
   └── assets/                # Globe textures, etc.
   ```

2. **Participant Data Flow:**
   ```javascript
   // Zoom Apps SDK provides:
   import zoomSdk from '@zoom/appssdk';
   
   // Get meeting participants
   const participants = await zoomSdk.getMeetingParticipants();
   // Returns: [{participantId, displayName, role, isHost}, ...]
   
   // Listen for join/leave
   zoomSdk.addEventListener('onParticipantChange', (event) => {
     // Update globe in real-time
   });
   ```

3. **Location Collection:**
   Since Zoom doesn't provide location data, use one of:
   - **Pre-registration form** (collect before meeting)
   - **In-app prompt** (ask users to select city on join)
   - **Profile integration** (store in Zoom user profile custom fields)

4. **Rendering:**
   - Globe renders in sidebar panel (320x600px default)
   - Can expand to full-screen overlay
   - WebGL (Three.js) fully supported

**Permissions Required:**
- `getMeetingParticipants` - Read participant list
- `onParticipantChange` - Listen to join/leave events
- `openUrl` - Open external links (optional)

**Challenges:**
- ⚠️ No direct access to location/IP
- ⚠️ Sidebar size constraints (may need simplified globe)
- ⚠️ Requires OAuth flow for data persistence

**Estimated Effort:** 2-3 weeks for MVP

---

### 4.2 Google Meet Add-ons Integration

#### Technical Feasibility: ⚠️ MEDIUM

**How it would work:**

1. **App Structure:**
   ```
   meet-addon/
   ├── manifest.json          # Google Workspace add-on config
   ├── Code.gs                # Apps Script backend
   ├── sidebar.html           # Side panel UI
   └── globe-widget.js        # Embedded globe component
   ```

2. **Participant Data Flow:**
   ```javascript
   // Google Meet provides very limited access:
   const meetingId = ConferenceDataService.getCurrentConferenceId();
   const participantCount = ConferenceDataService.getParticipantCount(); // Number only
   
   // NO access to participant names/identities via API
   ```

3. **Location Collection:**
   Must use manual input:
   - **Side panel form** (users enter their own location)
   - **Pre-meeting survey** (Google Forms integration)
   - **Google Sheets backend** (read from shared sheet)

4. **Rendering:**
   - Limited to side panel (300-400px width)
   - WebGL may have performance issues in iframe
   - Consider simplified 2D map as alternative

**Permissions Required:**
- `https://www.googleapis.com/auth/meetings.space.readonly`
- `https://www.googleapis.com/auth/drive` (if using Sheets)

**Challenges:**
- ❌ **Critical:** No participant list access via API
- ⚠️ Google Workspace only (excludes free users)
- ⚠️ Apps Script has execution time limits (30 seconds)
- ⚠️ Side panel width constraints

**Verdict:** Google Meet is the **least feasible** option due to API limitations.

**Estimated Effort:** 3-4 weeks (mostly workarounds for API gaps)

---

### 4.3 Microsoft Teams Apps Integration

#### Technical Feasibility: ⚠️ MEDIUM-HIGH

**How it would work:**

1. **App Structure:**
   ```
   teams-app/
   ├── manifest.json          # Teams app manifest
   ├── bot/                   # Bot for notifications (optional)
   ├── tab/                   # In-meeting tab app
   │   ├── config.html        # Configuration page
   │   └── content.html       # Globe visualization
   └── server/                # Backend API
   ```

2. **Participant Data Flow:**
   ```javascript
   // Teams provides good API access:
   import * as microsoftTeams from '@microsoft/teams-js';
   
   // Get meeting context
   microsoftTeams.meeting.getAppContentStageSharingCapabilities();
   
   // Get participant list via Graph API
   const participants = await fetch(
     `https://graph.microsoft.com/v1.0/me/onlineMeetings/${meetingId}/participants`
   );
   ```

3. **Location Collection:**
   - **User profile** (read from Azure AD profile)
   - **In-app form** (prompt on first join)
   - **SharePoint list** (organization directory)

4. **Rendering:**
   - In-meeting tab (full screen or side panel)
   - Stage view (large shared canvas)
   - WebGL fully supported

**Permissions Required:**
- `OnlineMeetings.Read` - Access meeting data
- `User.Read` - Read user profiles
- `Directory.Read.All` - Read org directory (optional)

**Challenges:**
- ⚠️ Requires Azure AD tenant registration
- ⚠️ Complex permission model
- ⚠️ Graph API rate limits
- ⚠️ Steeper learning curve than Zoom

**Estimated Effort:** 3-4 weeks for MVP

---

### 4.4 Generic Iframe Solution

#### Technical Feasibility: ✅ VERY HIGH

**How it would work:**

1. **Minimal Changes Required:**
   - Add iframe-friendly CSS (no fixed positioning)
   - Optimize for smaller viewports (300px width)
   - Add query parameter for pre-filled data
   - Optional: PostMessage API for parent communication

2. **Usage Flow:**
   ```
   Meeting Host:
   1. Opens globe webapp in browser
   2. Copies participants from meeting roster
   3. Pastes into globe input form
   4. Shares screen OR sends URL in meeting chat
   
   Participants:
   1. Click shared URL
   2. View globe in separate browser tab
   3. OR: See via screen share
   ```

3. **Enhanced Version (URL Parameters):**
   ```
   https://globalpresencemap.com/globe?
     participants=N,NewYork|T,Tallinn|L,London&
     meeting=Global-Call-2025-12-20&
     autorender=true
   ```

4. **Optional: PostMessage Bridge:**
   ```javascript
   // Allow parent window to send participant data
   window.addEventListener('message', (event) => {
     if (event.data.type === 'PARTICIPANTS_UPDATE') {
       updateGlobe(event.data.participants);
     }
   });
   ```

**Pros:**
- ✅ Works immediately with existing code
- ✅ No platform approval needed
- ✅ Universal compatibility
- ✅ Easy to share and demo

**Cons:**
- ⚠️ Manual participant input
- ⚠️ Not embedded in meeting UI
- ⚠️ Less polished experience

**Estimated Effort:** 1-2 days (minor UI adjustments)

---

## 5. Architecture Proposal

### 5.1 Recommended Hybrid Architecture

```
┌─────────────────────────────────────────────────────────┐
│                Core Globe Component                     │
│  (Reusable React component, platform-agnostic)         │
│                                                          │
│  ├─ GlobeVisualization (react-globe.gl wrapper)        │
│  ├─ ParticipantManager (state management)              │
│  ├─ GeocodeService (city → coordinates)                │
│  └─ DataSync (optional real-time updates)              │
└─────────────────┬───────────────────────────────────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
┌───────▼─────────┐  ┌──────▼────────────┐
│  Platform SDKs  │  │  Generic Webapp   │
│                 │  │                   │
├─ Zoom App      │  │  ├─ Standalone    │
├─ Teams Tab     │  │  ├─ Iframe embed  │
└─ (Future: Meet)│  │  └─ URL params    │
└─────────────────┘  └───────────────────┘
        │                    │
        └─────────┬──────────┘
                  │
        ┌─────────▼──────────┐
        │   Shared Backend   │
        │   (Optional)       │
        │                    │
        ├─ User profiles     │
        ├─ Meeting history   │
        └─ Location cache    │
        └────────────────────┘
```

### 5.2 Component Extraction

**Step 1: Extract Core Component**

```typescript
// packages/globe-core/src/GlobeWidget.tsx
export interface GlobeWidgetProps {
  participants: Participant[];
  onParticipantChange?: (participants: Participant[]) => void;
  width?: number;
  height?: number;
  autoRotate?: boolean;
}

export const GlobeWidget: React.FC<GlobeWidgetProps> = (props) => {
  // Current MeetingGlobe logic
  // Make it platform-agnostic
};
```

**Step 2: Create Platform Adapters**

```typescript
// packages/zoom-app/src/ZoomGlobeApp.tsx
import { GlobeWidget } from '@globe/core';
import zoomSdk from '@zoom/appssdk';

export const ZoomGlobeApp = () => {
  const participants = useZoomParticipants(); // Custom hook
  
  return <GlobeWidget participants={participants} />;
};

// Similar adapters for Teams, Meet, etc.
```

### 5.3 Data Flow Architecture

```
┌──────────────────┐
│ Meeting Platform │ (Zoom/Meet/Teams)
└────────┬─────────┘
         │ Provides: participant names, join/leave events
         │ Missing: location data
         ▼
┌────────────────────┐
│ Platform Adapter   │ (SDK wrapper)
├────────────────────┤
│ • Fetch participants
│ • Listen for events 
│ • Prompt for location (if missing)
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Location Service   │
├────────────────────┤
│ • Check user profile
│ • Prompt in-app
│ • Geocode city name
│ • Cache results
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Globe Widget       │ (Core visualization)
├────────────────────┤
│ • Render 3D globe
│ • Update on changes
│ • Handle interactions
└────────────────────┘
```

---

## 6. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Goal:** Extract core component, make it reusable

- [ ] Refactor `MeetingGlobe.tsx` into standalone package
- [ ] Add props for width/height constraints
- [ ] Make participant input flexible (array or stream)
- [ ] Add URL parameter support for pre-filling data
- [ ] Test in iframe contexts (300px, 600px, fullscreen)
- [ ] Optimize performance for constrained viewports

**Deliverable:** `@globe/core` package ready for integration

---

### Phase 2A: Generic Webapp (Week 2)

**Goal:** Enable iframe embedding immediately

- [ ] Add responsive CSS for small widths
- [ ] Implement URL parameter parsing
- [ ] Add PostMessage API for parent communication
- [ ] Create embeddable demo page
- [ ] Write integration guide for sharing in meetings

**Deliverable:** Embeddable version available at `/globe/embed`

---

### Phase 2B: Zoom App Prototype (Week 3-4)

**Goal:** Build Zoom Apps SDK integration

- [ ] Set up Zoom Apps project
- [ ] Implement participant list fetching
- [ ] Create location collection flow (in-app prompt)
- [ ] Integrate core globe component
- [ ] Handle sidebar size constraints (320px)
- [ ] Add real-time updates (join/leave)
- [ ] Test with Zoom Developer account

**Deliverable:** Zoom App MVP ready for testing

---

### Phase 3: Location Management (Week 5-6)

**Goal:** Solve the "how do we get locations?" problem

**Option A: Pre-registration**
- [ ] Create meeting registration form
- [ ] Store participant → location mapping
- [ ] Auto-populate on meeting join

**Option B: In-app Prompt**
- [ ] First-time prompt: "Where are you joining from?"
- [ ] Save to user profile
- [ ] Reuse for future meetings

**Option C: Integration**
- [ ] Integrate with Zoom user profile custom fields
- [ ] Read from company directory (LDAP/AD)
- [ ] Import from Google Contacts / Teams

**Deliverable:** At least 2 location collection methods working

---

### Phase 4: Teams/Meet Exploration (Week 7-8)

**Goal:** Evaluate feasibility of other platforms

- [ ] Build proof-of-concept for Microsoft Teams
- [ ] Investigate Google Meet workarounds
- [ ] Document API limitations and workarounds
- [ ] Decision: proceed or defer?

**Deliverable:** Go/no-go decision for each platform

---

### Phase 5: Polish & Distribution (Week 9-12)

**Goal:** Production-ready deployment

- [ ] Add error handling and edge cases
- [ ] Implement privacy controls (opt-in/opt-out)
- [ ] Create onboarding flow
- [ ] Write user documentation
- [ ] Submit to Zoom App Marketplace (approval: 2-4 weeks)
- [ ] Set up usage analytics (privacy-friendly)
- [ ] Launch beta program

**Deliverable:** Public launch

---

## 7. Technical Challenges

### 7.1 Location Data Privacy

**Problem:** Meeting platforms don't expose participant location (by design).

**Solutions:**
1. **Self-reported:** User enters city on first join
2. **Pre-registration:** Collect via form before meeting
3. **Profile integration:** Read from company directory
4. **IP geolocation:** Backend API (accuracy varies, privacy concerns)

**Recommendation:** Self-reported + optional profile integration

---

### 7.2 Size Constraints

**Problem:** Plugin sidebars are narrow (300-400px).

**Solutions:**
1. **Responsive globe:** Adjust detail level based on size
2. **Simplified view:** Show 2D map instead of 3D globe
3. **Pop-out option:** Open full-size in new window
4. **Stage view:** Use platform's large shared canvas (Zoom, Teams)

**Recommendation:** Start with responsive 3D, add 2D fallback

---

### 7.3 Real-time Updates

**Problem:** Globe must update as participants join/leave.

**Solutions:**
1. **Platform events:** Use SDK's participant change callbacks
2. **Polling:** Check participant list every N seconds
3. **WebSocket:** Maintain server connection (requires backend)
4. **Hybrid:** Events for immediate updates, polling as fallback

**Recommendation:** Platform events with polling fallback

---

### 7.4 Geocoding Rate Limits

**Problem:** Current system geocodes on-demand, could hit API limits.

**Solutions:**
1. **Caching:** Store city → coordinates in database
2. **Static fallback:** Expand `cityCoords.ts` with common cities
3. **Batch geocoding:** Pre-geocode during registration
4. **Multiple providers:** Fallback chain (Nominatim → OpenCage → Google)

**Recommendation:** Static cache + on-demand with fallback

---

### 7.5 Authentication & User Identity

**Problem:** Plugins need to know who's who across meetings.

**Solutions:**
1. **Platform OAuth:** Use Zoom/Google/Microsoft login
2. **Anonymous:** No login, location stored per-meeting only
3. **Email-based:** Link identity via email address
4. **Hybrid:** Anonymous for casual users, OAuth for organizations

**Recommendation:** Anonymous for MVP, OAuth for v2

---

## 8. Alternative Approaches

### 8.1 Shared Screen Approach

**Concept:** Host runs webapp and shares their screen

**Pros:**
- ✅ Zero integration effort
- ✅ Works on all platforms immediately
- ✅ No approval process

**Cons:**
- ⚠️ Requires one person to manage
- ⚠️ Not interactive for other participants
- ⚠️ Takes up screen share slot

**Use Case:** Quick demos, small meetings

---

### 8.2 Bot Integration

**Concept:** Chatbot collects locations, posts globe image

**Pros:**
- ✅ Works in meeting chat
- ✅ Async collection (before meeting starts)
- ✅ No UI constraints

**Cons:**
- ⚠️ Static image instead of interactive globe
- ⚠️ Limited visual appeal
- ⚠️ Requires bot approval

**Use Case:** Large meetings (>50 people), async collection

---

### 8.3 Companion Web App

**Concept:** Separate webapp, URL shared in meeting chat

**Pros:**
- ✅ Full control over UX
- ✅ No platform restrictions
- ✅ Can be more feature-rich

**Cons:**
- ⚠️ Not embedded in meeting UI
- ⚠️ Requires users to open external link
- ⚠️ Less convenient

**Use Case:** Current fallback, always available

---

## 9. Recommendations

### 9.1 Short-term (Next 3 Months)

**Priority 1: Generic Iframe Solution**
- Implement embeddable version with URL parameters
- Add responsive CSS for small viewports
- Create sharing guide for all platforms
- **Effort:** 1-2 weeks
- **Value:** High (works everywhere immediately)

**Priority 2: Zoom App MVP**
- Build Zoom Apps SDK integration
- Implement in-app location prompt
- Test with sidebar and stage view
- **Effort:** 3-4 weeks
- **Value:** High (best UX, large user base)

---

### 9.2 Medium-term (6 Months)

**Priority 3: Microsoft Teams App**
- Develop Teams tab application
- Integrate with Graph API
- Test with enterprise customers
- **Effort:** 4-6 weeks
- **Value:** Medium-High (enterprise market)

**Priority 4: Enhanced Location Management**
- Build pre-registration system
- Add profile integration options
- Implement caching layer
- **Effort:** 3-4 weeks
- **Value:** Medium (improves UX significantly)

---

### 9.3 Long-term (12+ Months)

**Priority 5: Google Meet Add-on**
- Wait for API improvements (if any)
- Explore workarounds (Forms integration)
- Consider deferring indefinitely
- **Effort:** 3-4 weeks (high uncertainty)
- **Value:** Low-Medium (limited by platform)

**Priority 6: Advanced Features**
- Time zone visualization
- Historical meeting data
- Multi-meeting comparison
- Custom branding for organizations
- **Effort:** Ongoing
- **Value:** Varies

---

## 10. Conclusion

### Is it Feasible? **YES** ✅

The Global Presence Map can absolutely be adapted as a meeting platform plugin, with varying degrees of integration:

1. **Zoom Apps SDK**: Most feasible, best developer experience, recommended starting point
2. **Generic Iframe**: Quick win, works everywhere, good fallback
3. **Microsoft Teams**: Feasible for enterprise, more complex
4. **Google Meet**: Least feasible due to API limitations

### Recommended Strategy

**Phase 1 (Immediate):**
- Build iframe-embeddable version
- Share via meeting chat (universal solution)
- **Timeline:** 1-2 weeks

**Phase 2 (Next):**
- Develop Zoom App with native integration
- Submit to Zoom App Marketplace
- **Timeline:** 4-6 weeks

**Phase 3 (Future):**
- Evaluate Teams based on demand
- Monitor Google Meet API improvements
- Add advanced features based on user feedback
- **Timeline:** 6-12 months

### Key Success Factors

1. **Solve location collection** - This is the biggest UX challenge
2. **Handle size constraints** - Globe must work in small panels
3. **Real-time updates** - Participants expect live data
4. **Privacy controls** - Users must feel safe sharing location
5. **Easy onboarding** - First-time experience is critical

### Next Steps

1. ☐ Review this document with team
2. ☐ Validate assumptions with user interviews
3. ☐ Build iframe prototype (Phase 1)
4. ☐ Test with real meetings
5. ☐ Gather feedback before Zoom SDK work
6. ☐ Create detailed implementation plan for chosen platforms

---

**Questions or Discussion?** Open a GitHub issue or Discussion thread.

**Want to help build this?** Check the implementation roadmap and pick a phase!

---

## Appendix: Technical Resources

### Zoom Apps SDK
- Developer Portal: https://developers.zoom.us/
- Apps SDK Reference: https://developers.zoom.us/docs/zoom-apps/reference/
- Sample Apps: https://github.com/zoom/apps

### Google Meet Add-ons
- Add-ons Overview: https://developers.google.com/meet/add-ons
- Apps Script: https://developers.google.com/apps-script
- Conference Data API: https://developers.google.com/workspace/add-ons/guides/conference-data

### Microsoft Teams Apps
- Teams Platform: https://learn.microsoft.com/en-us/microsoftteams/platform/
- Graph API: https://learn.microsoft.com/en-us/graph/api/resources/calendar
- Meetings API: https://learn.microsoft.com/en-us/graph/api/resources/onlinemeeting

### Related Libraries
- react-globe.gl: https://github.com/vasturiano/react-globe.gl
- Three.js: https://threejs.org/
- PostMessage API: https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage

---

**End of Document**

# Crisis Activation System — Full Implementation Plan

Bundle five related enhancements into one coordinated rollout: a global Crisis context, role-based activation, map + emergency-services intelligence, dashboard-wide UI changes, and a sidebar consistency pass.

---

## 1. Global Crisis Context

**New file:** `src/contexts/CrisisContext.tsx`

A single source of truth used by Admin/NGO/Volunteer/Public dashboards.

State exposed:
- `crisisMode: boolean`
- `activeIssue: Issue | null`
- `broadcast: { ngos: number; volunteers: number; services: EmergencyService[]; sentAt: string } | null`
- `requests: CrisisRequest[]` (NGO → Admin requests)
- `activateCrisis(issue, role)`, `deactivateCrisis()`, `requestActivation(issue, ngoName)`, `approveRequest(id)`, `rejectRequest(id)`

Persisted in `sessionStorage` so role switches keep state.

`<CrisisProvider>` mounted in `src/App.tsx` around the routes.

---

## 2. Mock Emergency Services + AI Selection

**New file:** `src/data/emergencyServices.ts`
- ~12 services across India (hospital, fire, police) with `lat`, `lng`, `name`, `city`, `phone`.

**New file:** `src/lib/crisis-utils.ts`
```ts
generateCrisisLink(issue)        // google.com/maps?q=lat,lng
getDistance(lat1,lng1,lat2,lng2) // simple Euclidean
getRequiredServices(category)    // Health→hospital, Disaster→fire+hospital, Safety→police+hospital, Infrastructure→fire+police, default→police
getNearbyServices(issue, radius=2.5°)
buildAlertMessage(issue)
copyCrisisLink(issue)            // navigator.clipboard + sonner toast
```

Reuses `coordsToLatLng` from `src/lib/map-utils.ts` so existing `coords` translate to lat/lng without changing `Issue` type.

---

## 3. Role-Based Activation Logic

| Role | UI |
|---|---|
| Admin | "Activate Crisis" / "Deactivate Crisis" + "Crisis Requests" inbox |
| NGO | "Request Crisis Activation" → toast "Request sent to admin" |
| Volunteer | No trigger. Banner "🚨 Crisis Alert Received" + "Join Emergency Now" button when active |
| Public | No trigger. Read-only crisis banner + view location |

Auto-trigger: when any issue in mock data has `aiPriorityScore > 90`, `CrisisProvider` calls `activateCrisis(issue, "system")` once and surfaces toast "⚡ Auto Crisis Activated due to high priority". Disabled after first manual deactivation in session.

---

## 4. New Components

All under `src/components/crisis/`:

1. **CrisisActivationDialog.tsx** — Admin picks an issue from a list, confirms; shows resulting broadcast summary card.
2. **CrisisBroadcastPanel.tsx** — "✅ Alerts sent to" card: counts of NGOs / Volunteers / Hospitals / Fire / Police, ETA chips, response status (Pending → Acknowledged → En Route, simulated with timers).
3. **EmergencyServicesList.tsx** — Cards per nearby service with icon (🏥/🚒/🚓), distance badge, phone, "Notify" button.
4. **CrisisRequestsInbox.tsx** — Admin-only. Approve / Reject pending NGO requests.
5. **CrisisRequestButton.tsx** — NGO-side button + status badge (pending/approved/rejected).
6. **CrisisCountdownTimer.tsx** — "Active for 02:34" since `sentAt`.
7. **CrisisMetricsPanel.tsx** — Active responders, time since activation, issues under crisis.
8. **VolunteerCrisisBanner.tsx** / **NGOCrisisBanner.tsx** / **PublicCrisisBanner.tsx** — Role-specific top banners with actions.
9. **AIExplanationCard.tsx** — "AI selected responders based on issue type + proximity" with the rule used.

---

## 5. Map Integration

Edit `src/components/dashboard/MapDashboard.tsx`:
- For each marker, popup gets:
  - Title, urgency badge
  - **📍 View Location** link → `generateCrisisLink(issue)` (opens Google Maps)
  - **📋 Copy Location Link** button → `copyCrisisLink(issue)` + sonner toast "Link copied"
  - When `crisisMode && issue.id === activeIssue.id` → red glow ring + "CRISIS" pill
- Add overlay markers for nearby emergency services (different colored dots: red=fire, blue=police, green=hospital) when crisis is active.
- Add a soft red CircleMarker around the active crisis issue.

---

## 6. Dashboard Wiring

**DashboardAdmin.tsx**
- Replace existing local `crisisMode` state with `useCrisis()`.
- Quick action "Activate Crisis" opens `CrisisActivationDialog`.
- New sidebar section "Crisis Center" containing: `CrisisBroadcastPanel`, `EmergencyServicesList`, `CrisisMetricsPanel`, `CrisisRequestsInbox`, `AIExplanationCard`.

**DashboardNGO.tsx**
- Remove direct activation. Replace with `CrisisRequestButton`.
- Show `NGOCrisisBanner` ("Emergency Request Received" + "Accept & Deploy") when `crisisMode`.
- AI suggestions panel: when crisis → "Deploy ALL nearby volunteers + notify emergency services".

**DashboardVolunteer.tsx**
- `VolunteerCrisisBanner` at top when `crisisMode` → "🚨 Join Emergency Now" button (sets availability + toast).
- New "Urgent Tasks" card pinned to top.

**DashboardPublic.tsx**
- Read-only `PublicCrisisBanner` with View Location link only.

---

## 7. System-Wide UI

`DashboardShell` already supports `crisisMode` banner — extend it:
- Read `crisisMode` from `useCrisis()` automatically (remove prop drilling but keep prop as override).
- When active: subtle red border ring (already present), red dot pulsing in header, optional reduced-motion respect.
- Sonner toast on activation: "🚨 All nearby responders have been notified".

---

## 8. Sidebar Smart Collapse Audit

`DashboardShell.handleSectionClick` already auto-collapses on non-overview and expands on overview (desktop). Action items:
- Verify all 4 dashboards use `overview` as the home section id (they do).
- Add tooltip on collapsed icons (Radix `Tooltip`) showing label.
- Keep manual toggle button visible — currently only mobile has it. Add a small chevron toggle in the sidebar footer for desktop so users can override auto-behavior.
- Mobile: convert sidebar to Sheet drawer with overlay (currently uses bottom nav — keep bottom nav, but ensure no stale auto-collapse on mobile).

---

## 9. Files Touched

**New (~14):** CrisisContext, emergencyServices data, crisis-utils, 9 crisis components, CrisisCountdownTimer.

**Edited (~7):** App.tsx, DashboardShell.tsx, MapDashboard.tsx, DashboardAdmin.tsx, DashboardNGO.tsx, DashboardVolunteer.tsx, DashboardPublic.tsx.

No backend changes. No DB migrations. Pure frontend on existing mock data.

---

## Out of Scope
- Real SMS/push notifications
- Real-time WebSocket broadcast (simulated with `setInterval` status updates)
- Persisting crisis history to Supabase (session-only)

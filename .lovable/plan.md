
# SahayogAI Production-Readiness Plan

The platform already has the core schema (issues, alerts, ngos, ngo_details, volunteers, volunteer_details, profiles, user_roles), RLS policies, Gemini-backed edge functions (`analyze-issue`, `chat`, `run-ai`), 4 dashboards, a CrisisContext, mock fallback in `data-source.ts`, and SPA routing via `vercel.json`. This plan closes the gaps to make every flow truly live, realtime, and demo-safe.

## Scope

### 1. Data layer hardening (`src/lib/supabase-service.ts`)
- Replace silent mock fallbacks with `fetchWithFallback` so each dashboard knows live vs demo state via `DataModeBadge`.
- Fix `getNGOs` / `getVolunteers` to return live arrays (currently fall back to mocks when Supabase returns `[]`).
- Add: `getProfiles()` (admin only — all past/present registrations of public, volunteer, ngo with `created_at`), `getUserRoles()`, `getCrisisRequests()`, `broadcastAlert()`, `assignVolunteer()`, `updateVolunteerLocation()`.
- Wire `createIssue` to set `reporter_id = auth.uid()` and run Gemini scoring via `analyze-issue` before insert.

### 2. Admin dashboard — full registration visibility
- New "User Registry" tab on `DashboardAdmin` showing 3 grouped tables: Public users, Volunteers (joined with `volunteer_details`), NGOs (joined with `ngo_details` + verification status). Sort by `created_at`, search, block/unblock, role filter.
- Live counts on the metric strip: total public / volunteers / NGOs / pending verifications.

### 3. Reported issues across ALL dashboards
- Single source: `getIssues()` from Supabase → fed into Admin / NGO / Volunteer / Public dashboards.
- Per-role views:
  - Admin: every issue + lifecycle controls.
  - NGO: assigned + unclaimed in their region; claim/assign volunteers.
  - Volunteer: nearby + tasks they've accepted.
  - Public: their own reports + public feed (anonymized when `is_anonymous`).

### 4. Realtime sync
- `useRealtimeTable('issues', refetch)` and `useRealtimeTable('alerts', refetch)` already exists — wire it into all 4 dashboards so inserts/updates propagate without refresh.
- Add realtime on `profiles` for the admin registry.

### 5. RLS verification (no schema change expected)
- Audit existing policies in `<supabase-tables>`: already correct for issues/alerts/profiles/user_roles. Document this; no migration needed unless a gap surfaces during implementation.

### 6. Gemini AI integration
- `analyze-issue` edge function (already deployed) called on issue create → returns priority score (0–100), recommended responders, action steps. Persist `ai_priority_score`, `required_resources`, `is_ai_verified`.
- Auto-crisis trigger when score > 90 (already wired via `useAutoCrisis`); ensure each dashboard mounts it.

### 7. Crisis & broadcast
- Admin: activate/deactivate (existing `CrisisCenter`).
- NGO: `CrisisRequestButton` already present — confirm it writes a record visible to admin via `CrisisRequestsInbox`. Promote requests from in-memory context to a lightweight table only if the user wants persistence (flagged as optional below).
- Broadcast panel: insert into `alerts` table with severity + photos + affected_area; realtime pushes to NGO/volunteer/public dashboards.

### 8. Mock fallback
- Keep `fetchWithFallback` everywhere; surface mode via `DataModeBadge` on every dashboard header so the demo never looks broken.

### 9. Routing
- `vercel.json` SPA rewrite already in place. Confirm `BrowserRouter` + catch-all `NotFound`. No further change.

### 10. Error sweep
- Run TS build, fix any type drift after service changes.
- Ensure all dashboards show `DashboardSkeleton` on loading and `EmptyState` when zero data.

## Out of scope (will ask before doing)
- New tables (e.g., persistent `crisis_requests`, `broadcasts`) — current in-memory + `alerts` table covers the demo.
- Real SMS/email broadcast — kept simulated as today.
- Hospital/Police real APIs — kept simulated via `emergencyServices.ts`.

## Technical notes
- No DB migration anticipated; if needed for `crisis_requests` persistence, will request approval separately.
- All edge functions already exist; only client wiring changes.
- Files touched (estimate): `src/lib/supabase-service.ts`, `src/lib/mappers.ts`, `src/pages/Dashboard{Admin,NGO,Volunteer,Public}.tsx`, `src/components/admin/*` (new UserRegistryPanel), `src/components/dashboard/IssueReportForm.tsx`.

## Deliverable
A live, realtime, role-aware SahayogAI where:
- Admin sees every past/present registration and every reported issue.
- NGO/Volunteer/Public each see the issues relevant to them, updated live.
- Gemini scores issues on submission and auto-escalates crises.
- Mock fallback keeps the demo alive if Supabase is unreachable.
- No 404 on refresh, no console errors, no broken flows.

## Root cause

The Supabase tables `issues` and `alerts` use **snake_case** columns (`reported_by`, `assigned_ngo`, `created_at`, `ai_priority_score`, `is_anonymous`, `affected_people`, `assigned_volunteers`, `response_time`, `is_fake`, `is_ai_verified`, `location_risk`, `required_resources`), while the entire UI (Issue type, IssueCard, IssueDetailDialog, dashboards) uses **camelCase**. Result:

- `getIssues()` / `getAlerts()` return rows whose fields are undefined when read in the UI → looks broken.
- `createIssue()` and the report form push camelCase keys → INSERT silently fails (or violates types) → the service catches and returns a fake local issue, so reports never persist and never appear in other dashboards.
- DB currently has 0 issues and 0 alerts → every dashboard is showing mock fallback. NGO/Volunteer signups *do* persist (those panels read snake_case directly), so they already appear on Admin once the right panels are opened, but Admin's NGO/Volunteer count cards still read the legacy `ngos`/`volunteers` tables which are empty.

Also: no realtime subscription wired to dashboards, so even when the data is fixed a new report from a Public user wouldn't show up live on Admin/NGO/Volunteer screens until refresh.

---

## What to build

### 1. Single source of truth for Issues & Alerts (camelCase ⇄ snake_case mapping)

Create `src/lib/mappers.ts` with `issueFromRow / issueToRow / alertFromRow / alertToRow`. Update `src/lib/supabase-service.ts` so every read maps rows to the camelCase `Issue`/`Alert` shape and every write maps the other way. Cover: `getIssues`, `getAlerts`, `createIssue`, `updateIssueStatus`, `claimIssue`, `upvoteIssue`. Set `reporter_id = auth.uid()` on insert (RLS requires it unless `is_anonymous`). Stop returning fake local issues on error — surface the real error so reports don't silently disappear.

### 2. Real reports visible everywhere

With mapping fixed, the existing `getIssues()` calls in all four dashboards will return the same real rows. Add a realtime subscription via the existing `useRealtimeTable` hook in each dashboard for `issues` and `alerts`, re-running the loader on change. This guarantees that when a Public user files a report it appears live on Admin, NGO and Volunteer dashboards.

### 3. Admin sees all past/present/future registrations

Admin already has dedicated panels (`NGOVerificationPanel`, `VolunteerManagementPanel`, `Public Accounts`) that read `ngo_details`, `volunteer_details`, and `profiles`. Improvements:

- Add a top-level "Registrations" overview showing live counts pulled from `ngo_details`, `volunteer_details`, and `profiles` (grouped by role) — not from the legacy `ngos`/`volunteers` mock tables.
- Wire `useRealtimeTable` for `ngo_details`, `volunteer_details`, and `profiles` so new signups appear without refresh.
- Show every NGO and every Volunteer (not only pending) with status filter (pending / verified / rejected / blocked) so historical entries are accessible.

### 4. Per-dashboard data audit (small fixes only)

- **Public**: already loads issues + alerts; will benefit from mapping + realtime.
- **Volunteer**: same; also ensure "Nearby Issues" no longer crashes when `coords` arrives as JSON string from Supabase (parse defensively in mapper).
- **NGO**: same; "Other NGOs" list should pull from `ngo_details` (verified) instead of legacy `ngos` table so NGOs see real peers AND ALSO REGISTERED VOLUNTEERS AND INVITED VOLUNTEERS OF NGO SHOULD APPEAR ON NGO DASHBOARD.
- **Admin**: overview metric cards switch to the real tables (`issues`, `ngo_details`, `volunteer_details`, `profiles`).

### 5. Cleanup / error sweep

- Remove unused imports flagged across the four dashboard files.
- `IssueReportForm` currently builds an `Issue` with a hand-rolled id; let the DB generate it. Pass payload to service, service returns the inserted row.
- `Profile.tsx`, `ResetPassword.tsx`: keep as-is (already approved last turn) — only verify they compile after type changes.
- Add an empty-state component when a dashboard has zero issues/alerts so the UI doesn't look broken when DB is genuinely empty.

---

## Technical details

**Files to edit**

- `src/lib/supabase-service.ts` — full rewrite of `getIssues/getAlerts/createIssue/updateIssueStatus/claimIssue/upvoteIssue` to use mapping + drop silent fake-success fallbacks.
- `src/lib/mappers.ts` *(new)* — pure functions converting between `Issue`/`Alert` and DB rows; defensive `coords` parsing.
- `src/pages/DashboardAdmin.tsx` — overview counts from real tables; add `useRealtimeTable("issues" | "alerts" | "ngo_details" | "volunteer_details" | "profiles", reload)`.
- `src/pages/DashboardNGO.tsx` — realtime for `issues`/`alerts`; "Other NGOs" reads `ngo_details` where `verification_status='verified'`.
- `src/pages/DashboardVolunteer.tsx` — realtime for `issues`/`alerts`.
- `src/pages/DashboardPublic.tsx` — realtime for `issues`/`alerts`.
- `src/components/dashboard/IssueReportForm.tsx` — let service assign id; pass `reporter_id` from `useAuth`.

**No DB migration needed.** RLS already permits the required reads/inserts.

**No business-logic redesign.** Existing UI components stay; only the data layer is corrected.

**Verification steps after implementation**

1. Submit an issue from Public → confirm it appears in Admin, NGO and Volunteer "Issues" lists within ~1s (realtime).
2. Sign up a new NGO and a new Volunteer → confirm both appear in Admin's Verification + Volunteers panels without refresh.
3. Confirm Admin overview counters reflect real DB rows, not mock seeds.
4. Run a typecheck / build pass and clear any unused-import warnings.
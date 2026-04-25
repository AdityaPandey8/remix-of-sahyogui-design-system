# Onboarding, Admin Control & Realtime/AI Fallback System

Three-part enhancement built on the existing Supabase backend (`profiles`, `ngo_details`, `volunteer_details`, `ngo_volunteer_relations`, `volunteer_join_requests`).

---

## Part A — Multi-step Signup Flows

Replace the single-form signup in `src/pages/Auth.tsx` with a stepper. Login flow stays unchanged.

### New components (`src/components/auth/`)
- `SignupStepper.tsx` — progress bar (Step X of N) + animated transitions
- `NGOSignupWizard.tsx` — orchestrates 6 NGO steps
- `VolunteerSignupWizard.tsx` — orchestrates 6 volunteer steps
- `steps/` — one file per step (FormField groups, Next/Back buttons, per-step validation with zod)

### NGO steps (6)
1. **Basics** — NGO name, registration number, type (Trust/Society/Section 8), year of establishment
2. **Contact** — email, phone, city, state, website
3. **Verification** — Darpan ID, PAN/Tax ID, certificate upload (file picker, stored as filename string for now — no storage bucket)
4. **Operations** — areas of work (multi-select chips, includes "Other" with text input), regions served
5. **Team & Resources** — volunteer count, available resources (multi-select), primary contact person
6. **Review & Submit** — read-only summary, submit

### Volunteer steps (6)
1. **Basics** — name, email, phone
2. **Location** — city + "Use my location" button (simulated GPS → fills lat/long with mock coords)
3. **Skills** — multi-select chips + Other
4. **Experience (optional)** — previous volunteering text, certifications text
5. **NGO Affiliation** — three options:
   - Independent (type=`basic`)
   - Request to join NGO (dropdown of verified NGOs → creates `volunteer_join_requests` row)
   - Invite code (text input → looked up against NGO; on match, type=`ngo_verified` and `ngo_volunteer_relations` row created)
6. **Review & Submit**

### Schema additions (migration)
Extend existing tables (no new tables needed):
- `ngo_details`: add `est_year int`, `phone text`, `address text`, `city text`, `state text`, `website text`, `areas_of_work text[]`, `regions_served text[]`, `volunteer_count int`, `available_resources text[]`, `primary_contact text`
- `volunteer_details`: add `phone text`, `city text`, `experience text`, `certifications text`, `invite_code_used text`
- New table `ngo_invite_codes` (id, ngo_id, code unique, active bool, created_at) with RLS: NGO owners + admins manage own; authenticated can SELECT active codes for validation.

### Submit logic
On final step submit: `supabase.auth.signUp` → insert role-specific details row → if invite code, insert `ngo_volunteer_relations` and set `type='ngo_verified'` → toast → redirect to dashboard.

---

## Part B — Admin Onboarding & Control System

Add new sections to `src/pages/DashboardAdmin.tsx` sidebar (existing pattern). Most needed sections already exist as IDs (`verification`, `volunteers`, `ngos`); we'll build out their content and add `teams`, `onboarding`, `moderation`, `invites`, `activity`.

### New admin sections (`src/components/admin/`)
1. **NGOVerificationPanel.tsx** — table of `ngo_details` rows with status filter; row shows name/reg#/Darpan/contact/docs; actions: Approve / Reject (with reason) / Keep Pending. "View Details" dialog + simulated document preview modal.
2. **VolunteerManagementPanel.tsx** — table with skills/location/availability/signup type (basic vs ngo_verified) + NGO affiliation; actions: Verify / Assign NGO (dropdown) / Block. Filters: skill, city.
3. **NGOTeamsPanel.tsx** — expandable NGO cards showing nested volunteer list (from `ngo_volunteer_relations`); add/remove/move volunteers between NGOs.
4. **OnboardingInsightsPanel.tsx** — metric cards (total NGOs, verified, pending, total volunteers, active) + small Recharts bar chart of signups over time.
5. **TrustScoreBadge.tsx** — reusable component computing scores frontend-side:
   - NGO: verified(40) + activity(30 normalized from issues handled) + success(30 normalized) → 0–100, badge High/Medium/Low
   - Volunteer: tasks_completed + reliability_score + availability → 0–100
6. **ModerationPanel.tsx** — flag fake NGO (sets a new `is_flagged` column), block volunteer, disable account (toggles `profiles.blocked`).
7. **InviteCodesPanel.tsx** — list all invite codes per NGO, deactivate, generate new.
8. **ActivityMonitorPanel.tsx** — timeline of recent signups + approval/rejection events read from `ngo_details.updated_at` and `volunteer_details.updated_at`.

### Schema additions
- `ngo_details`: add `is_flagged bool default false`
- `volunteer_details` already has `blocked` via profiles.

---

## Part C — Realtime + AI Edge Function + Mock Fallback

### 1. Realtime hook (`src/hooks/useRealtimeTable.ts`)
Generic hook subscribing to `postgres_changes` on a given table; on event, calls the provided refetch. Used in DashboardPublic/Admin/NGO for `issues`, `alerts`, `volunteer_details`, `ngo_details`.

### 2. Mock fallback wrapper (`src/lib/data-source.ts`)
```ts
export async function fetchWithFallback<T>(fetcher, mock): Promise<{data: T, mode: 'live'|'mock'}>
```
Wraps existing `supabase-service.ts` calls. If error or empty, returns mock + mode flag. Exposes a `useDataMode()` context hook so UI can show banner.

### 3. Data mode badge (`src/components/dashboard/DataModeBadge.tsx`)
Small pill in dashboard header: 🟢 Live Data / 🟡 Demo Mode. Driven by `useDataMode()`.

### 4. AI edge function (`supabase/functions/run-ai/index.ts`)
New function (deploys automatically). Accepts `{title, description, urgency, category, location}`, returns `{priority: 0-100, responders: string[], reasoning: string}`. Uses existing `LOVABLE_API_KEY` (Gemini already wired in `analyze-issue`) but with a deterministic fallback if key missing. Validates input with zod, handles CORS.

Frontend helper `src/lib/ai-runtime.ts`:
```ts
export async function runAI(issue) {
  try { return await supabase.functions.invoke('run-ai', {body: issue}) }
  catch { return localAIFallback(issue) }  // reuses src/lib/ai-insights.ts
}
```

### 5. Wiring
- `IssueReportForm` calls `runAI()` after submit, stores returned priority into `issues.ai_priority_score`.
- Public/Admin dashboards subscribe to realtime issues; on insert, toast "New issue reported nearby".
- All major data fetches go through `fetchWithFallback`; UI shows DataModeBadge.

---

## Files Summary

**Migrations (1):** add columns to `ngo_details` + `volunteer_details`, create `ngo_invite_codes`.

**Created (~18):**
- `src/components/auth/SignupStepper.tsx`, `NGOSignupWizard.tsx`, `VolunteerSignupWizard.tsx`, plus 12 step subcomponents
- `src/components/admin/` 8 panels listed above
- `src/components/dashboard/DataModeBadge.tsx`
- `src/hooks/useRealtimeTable.ts`
- `src/lib/data-source.ts`, `src/lib/ai-runtime.ts`
- `supabase/functions/run-ai/index.ts`

**Edited (~6):** `src/pages/Auth.tsx` (delegate signup to wizards), `src/pages/DashboardAdmin.tsx` (wire new sections), `src/pages/DashboardNGO.tsx` (Invite Volunteer button), `src/pages/DashboardPublic.tsx` (realtime + badge), `src/lib/supabase-service.ts` (wrap with fallback), `src/data/mockData.ts` (invite code mock).

---

## Out of Scope
- Actual document/file upload to storage (we store filename string only — no storage bucket created).
- Email delivery of invite codes (codes shown in NGO dashboard, copy-to-clipboard only).
- Realtime presence / typing indicators.

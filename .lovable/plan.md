
# Fix All Build Errors — Restore Smooth Preview

The build errors trace to **two root causes**:

1. **Schema mismatch** — `src/pages/Auth.tsx`, `DashboardAdmin.tsx`, `DashboardNGO.tsx` reference Supabase tables (`ngo_details`, `volunteer_details`, `ngo_volunteer_relations`, `volunteer_join_requests`) and columns (`verification_status`, `trust_score`, `ngo_type`, `ngo_id`, `volunteer_id`, etc.) that **don't exist** in the current connected Supabase project. The DB only has the simpler `ngos` / `volunteers` tables.
2. **Duplicate import in `DashboardNGO.tsx`** — `Activity` is imported both from `lucide-react` (line 38) and from `@/components/dashboard/ActivityLog` (line 23) — TS2300 duplicate identifier.

The codebase's UI flows (NGO verification, volunteer trust scoring, NGO-volunteer team management, join requests) were designed against the richer schema. Best fix is to **create the missing tables** (matches existing UI/types) rather than rip out features.

---

## Step 1 — Database migration: create the missing tables

Add these tables via migration to match `src/types/database.ts` exactly:

### `ngo_details`
- `id uuid PK` (references `auth.users.id`, cascades on delete)
- `ngo_name text NOT NULL`
- `registration_number text NOT NULL`
- `darpan_id text`, `pan_tax_id text NOT NULL`
- `ngo_type text DEFAULT 'Trust'`
- `document_url text`, `video_url text`
- `verification_status text DEFAULT 'pending'` (pending/verified/rejected)
- `verified_at timestamptz`, `verified_by uuid`, `rejection_reason text`
- `created_at`, `updated_at` (with `set_updated_at` trigger)

### `volunteer_details`
- `id uuid PK` (references `auth.users.id`)
- `full_name text NOT NULL`, `skills text[] DEFAULT '{}'`
- `type text DEFAULT 'basic'` (basic/verified/ngo_verified)
- `verification_status text DEFAULT 'pending'`
- `trust_score numeric DEFAULT 0`, `reliability_score numeric DEFAULT 0`
- `tasks_completed int DEFAULT 0`, `availability bool DEFAULT true`, `blocked bool DEFAULT false`
- `location_text text`, `latitude numeric`, `longitude numeric`
- `document_url text`
- `created_at`, `updated_at`

### `ngo_volunteer_relations`
- `id uuid PK DEFAULT gen_random_uuid()`
- `ngo_id uuid NOT NULL`, `volunteer_id uuid NOT NULL`
- `created_at`
- UNIQUE (`ngo_id`, `volunteer_id`)

### `volunteer_join_requests`
- `id uuid PK DEFAULT gen_random_uuid()`
- `volunteer_id uuid NOT NULL`, `ngo_id uuid NOT NULL`
- `status text DEFAULT 'pending'`, `message text`
- `created_at`, `updated_at`

### Add `blocked` column to `profiles`
Code reads `profiles.blocked` (e.g. in `supabase-service.ts` and admin "block user" action). Add `blocked boolean NOT NULL DEFAULT false` to `profiles`.

### RLS policies
- `ngo_details` / `volunteer_details`: SELECT for authenticated; INSERT for self (`id = auth.uid()`); UPDATE for self OR admin (via `has_role`).
- `ngo_volunteer_relations`: SELECT authenticated; INSERT/DELETE for the NGO owner (`ngo_id = auth.uid()`) or admin.
- `volunteer_join_requests`: SELECT for the related volunteer or NGO or admin; INSERT for the volunteer (`volunteer_id = auth.uid()`); UPDATE for the NGO (`ngo_id = auth.uid()`) or admin.
- `profiles.blocked`: existing UPDATE policy (`auth.uid() = id`) — extend with admin override so admins can block/unblock other users.

**Note:** Schema changes require regeneration of `src/integrations/supabase/types.ts` — Lovable does this automatically after the migration runs. After that, every typed `.from('ngo_details')` / `.from('volunteer_details')` / `.from('ngo_volunteer_relations')` / `.from('volunteer_join_requests')` call resolves correctly and the TS2769 "not assignable to never" errors vanish.

---

## Step 2 — Fix `src/pages/DashboardNGO.tsx` duplicate import

- Remove `Activity` from the `lucide-react` import on line 38 (it's only used as a *type* `Activity` from `@/components/dashboard/ActivityLog`, not as an icon in this file). Verified by reading lines 188–195 — only the type usage exists.
- This resolves both TS2300 duplicate identifier errors.

---

## Step 3 — Verify the rest of the cascading errors clear

After Steps 1 & 2:
- `Auth.tsx` lines 133, 142 (`ngo_details` / `volunteer_details` inserts) — resolved by Step 1.
- `DashboardAdmin.tsx` lines 96, 106, 133, 149, 163 (table queries / updates) — resolved by Step 1.
- `DashboardAdmin.tsx` line 581 (`ngo.ngo_type`) — resolved by adding `ngo_type` column in Step 1.
- `DashboardNGO.tsx` lines 99, 101, 104, 121–126, 134–138, 146–156 (relations and join requests) — resolved by Step 1.
- `DashboardNGO.tsx` line 23/38 duplicate `Activity` — resolved by Step 2.

No code changes needed in `supabase-service.ts` — its untyped client already works.

---

## Step 4 — Smoke test the preview

After regen, manually load `/`, `/auth`, and the four dashboards to confirm no runtime errors. The router fix from the previous turn is already in place, so the homepage should mount cleanly.

---

## Files Touched

| Action | Path |
|---|---|
| Migration | New tables: `ngo_details`, `volunteer_details`, `ngo_volunteer_relations`, `volunteer_join_requests` + `profiles.blocked` column + RLS + `set_updated_at` triggers |
| Edit | `src/pages/DashboardNGO.tsx` — drop `Activity` from lucide-react import (line 38) |
| Auto-regen | `src/integrations/supabase/types.ts` (regenerated by Supabase after migration) |

No other files need changes — all the application code is already written against the target schema.

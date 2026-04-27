# Implementation Plan

## 1. Public Dashboard — Collapsible Sidebar Behavior
The Admin/NGO/Volunteer dashboards already auto-collapse on feature navigation and re-open on Home/Overview (handled in `DashboardShell.handleSectionClick`). The Public Dashboard currently uses the same shell but the behavior should be made consistent.

- Verify `DashboardPublic.tsx` passes `sidebarOpen` + `onSidebarToggle` correctly so the shell's existing logic kicks in (auto-collapse on any non-`overview`/`home` item, re-open on `home`).
- Update `DashboardShell.handleSectionClick` to recognize both `overview` and `home` as "expand" triggers (currently only `overview`).
- Add a manual collapse toggle button (chevron) inside the sidebar header so the user can also toggle it explicitly.

## 2. Forgot Password (Admin / NGO / Volunteer / Public login)
The login form lives in `src/pages/Auth.tsx` and is shared across all roles.

- Add a "Forgot password?" link below the password field on the login form.
- Clicking opens a small inline panel (or dialog) collecting email → calls:
  ```ts
  supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  ```
- Create new public route `/reset-password` (`src/pages/ResetPassword.tsx`):
  - Detects `type=recovery` in URL hash.
  - Form to set + confirm new password → `supabase.auth.updateUser({ password })`.
  - Redirects to `/auth` on success.
- Register the route in `src/App.tsx` (outside `ProtectedRoute`).

## 3. Profile Card in Sidebar (all 4 dashboards)
Currently `DashboardShell` renders a hardcoded "Admin User / admin@sahyogai.org" block at the bottom.

- Replace hardcoded values: read the logged-in user via `useAuth()`, fetch display name from:
  - `volunteer_details.full_name` (volunteer)
  - `ngo_details.ngo_name` (ngo)
  - `profiles.email` fallback for admin/public
- Show user's name beside the logout icon. The whole row becomes a clickable button → navigates to `/profile`.
- Logout button stays as a small icon to the right (separate click target, `stopPropagation`).
- Create new page `src/pages/Profile.tsx` (protected route):
  - Shows avatar (initials), name, email, role badge.
  - Role-specific details (NGO info / volunteer skills / etc.).
  - "Edit Profile" button — opens an inline edit form to update name, phone, city (writes to the appropriate `*_details` table or `profiles`).
  - Sign Out button at the bottom.

## 4. NGO Dashboard — Volunteer Collaboration Enhancements
Inside `DashboardNGO.tsx` Volunteers section + Communication section:

### Invite Codes Panel (Volunteers tab)
- New component `src/components/ngo/InviteCodeManager.tsx`:
  - "Generate Invite Code" button → inserts row into `ngo_invite_codes` (random 8-char code, ngo_id = current user).
  - Lists all active codes with: copy-to-clipboard, deactivate, share button.
  - "Send Invite" dialog: collects volunteer email, generates a shareable link `/auth?mode=signup&role=volunteer&invite=CODE`, copies to clipboard and (optionally) opens mailto draft with prefilled subject/body.
  - Wire `VolunteerSignupWizard` to read `invite` query param and store it in `volunteer_details.invite_code_used` + auto-create `ngo_volunteer_relations` row when code matches.

### Other-NGO Collaboration (Other NGOs tab)
- New component `src/components/ngo/CollaborationPanel.tsx`:
  - Cards listing other verified NGOs with focus areas.
  - Actions per card: "Propose Joint Operation", "Share Resources", "Message".
  - Stored locally (mock state) for now — display as a feed of outgoing/incoming proposals with status (Pending / Accepted / Declined).
  - Filter by focus area + region.

### Broadcast to Volunteers (Communication tab)
- Enhance current `broadcastMsg` UI:
  - Channel selector chips: All Volunteers / My Volunteers / Crisis Responders / Specific Skill.
  - Priority selector: Info / Urgent / Critical (color-coded).
  - Optional location/region targeting dropdown.
  - "Schedule for later" toggle (mock).
  - On send: insert into `alerts` table with chosen severity + show preview card + history list of past broadcasts (session state).
  - Live "delivered to N volunteers" estimate computed from `myVols`/`globalPool`.

## 5. Track Issue Location (all dashboards)
On every issue card and the issue detail dialog, add a "Track Location" button.

- New helper `getIssueMapLink(issue)` in `src/lib/map-utils.ts`:
  - If `issue.coords` looks like real lat/lng → `https://www.google.com/maps?q=LAT,LNG`.
  - Else fall back to a query search: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(issue.location)}`.
- Add `<Button>` with `MapPin` icon labelled "Track Location" on:
  - `IssueCard.tsx` (compact pill at the bottom row).
  - `IssueDetailDialog.tsx` (next to location row, opens link in new tab + "Copy link" secondary action).
- Reuses existing crisis link pattern already present in `MapDashboard`.

---

## Technical Notes
- No schema changes required — all needed tables (`ngo_invite_codes`, `ngo_volunteer_relations`, `volunteer_details`, `ngo_details`, `profiles`) already exist.
- Reset-password route must be public (registered before/outside `ProtectedRoute`).
- `DashboardShell` becomes user-aware: lift name lookup into a small `useProfileSummary()` hook so it stays role-agnostic.
- All new "Track Location" links open with `target="_blank" rel="noopener noreferrer"`.
- Broadcast inserts use existing RLS policy (NGOs allowed to insert into `alerts`).

## Files Created
- `src/pages/ResetPassword.tsx`
- `src/pages/Profile.tsx`
- `src/components/ngo/InviteCodeManager.tsx`
- `src/components/ngo/CollaborationPanel.tsx`
- `src/components/auth/ForgotPasswordDialog.tsx`
- `src/hooks/useProfileSummary.ts`

## Files Edited
- `src/App.tsx` (routes)
- `src/pages/Auth.tsx` (forgot link + dialog hook)
- `src/pages/DashboardNGO.tsx` (wire new panels)
- `src/pages/DashboardPublic.tsx` (sidebar consistency)
- `src/components/dashboard/DashboardShell.tsx` (profile row, home/overview toggle, manual collapse)
- `src/components/IssueCard.tsx` (Track Location button)
- `src/components/dashboard/IssueDetailDialog.tsx` (Track Location button)
- `src/lib/map-utils.ts` (getIssueMapLink helper)
- `src/components/auth/VolunteerSignupWizard.tsx` (invite param handling)

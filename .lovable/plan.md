# Fix 404 on Refresh — SPA Routing

## Diagnosis

Reviewed the code. Routing setup is already correct:

- `src/App.tsx` uses `BrowserRouter` ✅
- All routes defined, including catch-all `<Route path="*" element={<NotFound />} />` ✅
- No `HashRouter`, no broken `basename` ✅

**Important note about hosting:**

This project is hosted on **Lovable**, not Vercel. Lovable's hosting layer already serves `index.html` for any unknown path automatically — no `vercel.json` or `_redirects` file is needed for `*.lovable.app` previews or published URLs. So a `vercel.json` will not change behavior on Lovable.

However, if you plan to **export the code and deploy to Vercel yourself**, then `vercel.json` is required. I'll add it so the project is portable.

**Second issue — wrong paths in your message:**

Your message refers to `/admin`, `/ngo`, `/volunteer`, `/public`. Those routes do **not** exist in the app. The actual routes are:

- `/dashboard/admin`
- `/dashboard/ngo`
- `/dashboard/volunteer`
- `/dashboard/public`

Refreshing `/admin` correctly shows the in-app `NotFound` page (that's the catch-all working, not a server 404). If you want short paths, I can add redirect routes.

## Plan

1. **Add `vercel.json`** at project root with SPA rewrite (for future Vercel deploys; no effect on Lovable hosting):
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```
   (Using `rewrites` rather than `routes` — modern Vercel syntax, preserves the original URL so React Router sees the correct path.)

2. **Add short-path redirects** in `src/App.tsx` so `/admin`, `/ngo`, `/volunteer`, `/public` redirect to their `/dashboard/...` equivalents. This matches the URLs in your spec and removes confusion:
   ```tsx
   <Route path="/admin" element={<Navigate to="/dashboard/admin" replace />} />
   <Route path="/ngo" element={<Navigate to="/dashboard/ngo" replace />} />
   <Route path="/volunteer" element={<Navigate to="/dashboard/volunteer" replace />} />
   <Route path="/public" element={<Navigate to="/dashboard/public" replace />} />
   ```

3. **Leave `BrowserRouter`, route definitions, and the `*` catch-all as-is** — already correct.

## Files to change

- **Create**: `vercel.json`
- **Edit**: `src/App.tsx` (add 4 `Navigate` redirect routes + import `Navigate`)

No other code changes. No backend or design changes.

## After deploy — testing

On Lovable preview/published URL and (if exported) Vercel:
- Refresh `/dashboard/admin` → loads ✅
- Visit `/admin` → redirects to `/dashboard/admin` ✅
- Unknown path like `/xyz` → in-app NotFound page ✅

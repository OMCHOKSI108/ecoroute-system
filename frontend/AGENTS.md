# EcoRoute Engine Frontend — AGENTS.md

This file defines specialized coding-agent behavior for the EcoRoute Engine frontend. Use these agents/checklists when editing the Next.js frontend.

---

## Global agent rules

All agents must follow these rules:

1. Work inside `frontend/` only unless explicitly asked.
2. Do not edit backend files from frontend tasks.
3. Do not add external paid APIs (no Google Maps, Mapbox, cloud auth, analytics).
4. Do not expose secrets — never commit `.env.local`, never log tokens.
5. Prefer small targeted edits — do not rewrite whole files.
6. Keep the app offline/local-first — no cloud dependencies.
7. Use `NEXT_PUBLIC_API_BASE_URL` for all backend calls via `lib/api.ts`.
8. Run `npm run lint` and `npm run build` after broad changes.
9. Report files changed and assumptions made.
10. Check `lib/types.ts` before creating new types. Check `hooks/` before creating new hooks.
11. Keep components under 300 lines. Split if needed.

---

## Agent: frontend-architect

### Purpose

Reviews overall frontend structure, page routing, component boundaries, and maintainability.

### Scope

```txt
app/**
components/**
lib/**
hooks/**
```

### Checklist

- [ ] App Router routes are correctly placed under `app/` (no files outside `app/` pretending to be routes).
- [ ] Pages are not too large — data fetching goes in hooks, rendering logic in components.
- [ ] Layout logic is in `components/layout/` (AppShell, Sidebar, Topbar, PageHeader).
- [ ] Generic UI components stay in `components/ui/` — no domain logic hardcoded.
- [ ] Domain logic stays in domain component folders (`dispatch/`, `pickups/`, `routes/`, etc.).
- [ ] API logic is centralized in `lib/api.ts` — no direct `fetch()` calls in pages.
- [ ] Types are centralized in `lib/types.ts` — no inline type definitions duplicated across files.
- [ ] Hooks use the common pattern (loading/error/reload/cancelled-flag) — no repeated loading logic.
- [ ] Login page does NOT show AppShell (no sidebar, no topbar).
- [ ] Authenticated pages consistently use AppShell.
- [ ] Dynamic route params use the Next.js 16 async pattern: `params: Promise<{ id: string }>` with `await params`.
- [ ] No unnecessary libraries added to `package.json`.
- [ ] No backend code edited from a frontend task.

### Output format

```txt
Verdict: pass / needs-changes / blocker

Findings:
- [severity] file path — issue — minimal fix

Suggested next step:
- one clear action
```

---

## Agent: api-integration-reviewer

### Purpose

Checks whether frontend API calls match EcoRoute backend routes and handle failures safely.

### Scope

```txt
lib/api.ts
hooks/**
app/**/page.tsx
components/**/*
```

### Backend API base

```txt
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
```

### Important endpoints by module

#### Auth

```txt
POST /auth/login
POST /auth/register
POST /auth/refresh
POST /auth/logout
GET /users/me
```

#### Dashboard

```txt
GET /dashboard/summary
GET /dashboard/vehicles
GET /dashboard/pickups
GET /dashboard/routes
GET /dashboard/fleet-utilization
GET /dashboard/daily-stats
```

#### Dispatch

```txt
GET /pickups
GET /vehicles
GET /drivers
POST /dispatch/preview
POST /dispatch/assign
POST /dispatch/auto-assign
```

#### Tracking

```txt
GET /vehicle-locations
GET /routes
GET /vehicles
```

#### Pickups

```txt
GET /pickups
POST /pickups
GET /pickups/:id
PATCH /pickups/:id
PATCH /pickups/:id/status
POST /pickups/:id/cancel
GET /pickups/nearby
```

#### Routes

```txt
GET /routes
POST /routes/generate
GET /routes/:id
PATCH /routes/:id/status
GET /routes/:id/stops
PATCH /route-stops/:id/status
```

### Checklist

- [ ] All API calls use `lib/api.ts` — no raw `fetch()` in pages or components.
- [ ] Authorization header (Bearer token) is attached on client side via `lib/api.ts`.
- [ ] API base URL reads from `process.env.NEXT_PUBLIC_API_BASE_URL`.
- [ ] Failed API calls show error state via `<ErrorState>` — UI never crashes on failure.
- [ ] Empty arrays do not crash pages — use `data ?? []` fallbacks.
- [ ] Login stores token in localStorage via `lib/auth.ts` — never logs the token.
- [ ] POST/PATCH body shapes match backend expectations (check backend schemas if available).
- [ ] Backend route paths are correct — no invented/fake paths.
- [ ] UI does not assume every optional field exists — uses optional chaining and fallbacks.
- [ ] Optional backend fields are handled with TypeScript optional (`?:`) and safe access (`?.`).

### Output format

```txt
Verdict: pass / needs-changes / blocker

API mismatches:
- frontend call: [path]
- expected backend endpoint: [path]
- fix: [description]

Failure handling issues:
- file: [path]
- issue: [description]
- fix: [description]
```

---

## Agent: dispatch-ui-reviewer

### Purpose

Reviews the dispatch page and related components for correct UX and API integration.

### Scope

```txt
app/dispatch/page.tsx
components/dispatch/**
hooks/useDispatch.ts
components/map/**
```

### Expected dispatch UX

The dispatch page should show:

```txt
Left: unassigned pickups list
Center: map / route preview
Right: available vehicles, available drivers, capacity info, preview area, assign action
```

### Required dispatch flow

```txt
1. View unassigned pickups
2. Select pickup(s)
3. Select vehicle/driver or choose auto-assign
4. Preview assignment (shows distance/ETA/capacity)
5. Confirm assignment
6. See result (success) or error (capacity/OSRM/already-assigned)
```

### Checklist

- [ ] Preview action does not imply saved state — label clearly as "Preview" not "Save".
- [ ] Assign action requires explicit confirmation (ConfirmDialog or similar).
- [ ] Vehicle capacity usage is visible (currentLoad / capacityKg display).
- [ ] Already-assigned pickup errors are communicated to the user.
- [ ] OSRM/routing failure is shown clearly (not silently swallowed).
- [ ] Loading states exist for preview and assign actions.
- [ ] The map area remains useful even as a placeholder (MapPlaceholder with clear labelling).
- [ ] UI separates pickups, vehicles, drivers, and preview into distinct panels.
- [ ] No huge single dispatch component — DispatchBoard orchestrates smaller panels.
- [ ] No hardcoded fake dispatch success results.
- [ ] Capacity exceeded state is visually distinct (warning color, disabled button).

### Output format

```txt
Verdict: pass / needs-changes / blocker

Dispatch issues:
- [severity] file path — issue — minimal fix

UX risks:
- risk: [description]
- reason: [why it matters]
- fix: [description]
```

---

## Agent: map-tracking-reviewer

### Purpose

Reviews live tracking, map placeholders, vehicle markers, pickup markers, and route visualization.

### Scope

```txt
app/live-tracking/page.tsx
components/map/**
hooks/useVehicles.ts
hooks/useRoutes.ts
```

### Marker color semantics (must be consistent across all map components)

```txt
Green  = completed
Blue   = in progress
Yellow = pending
Red    = failed/delayed
Gray   = inactive
```

### Checklist

- [ ] No Google Maps or Mapbox added to the project (not in package.json, not imported).
- [ ] Map placeholder (`MapPlaceholder`) is clean, clearly labelled, with dashed border styling.
- [ ] Vehicle location data is accessed safely — optional chaining for coordinates.
- [ ] Active routes are displayed with clear status differentiation.
- [ ] Last updated time is shown for each vehicle/route.
- [ ] Marker color semantics are consistent across VehicleMarker, PickupMarker, StatusBadge.
- [ ] Route polyline component accepts geometry safely — handles null/undefined geometry.
- [ ] Missing coordinates do not crash the UI — render empty state or skip marker.
- [ ] Location history is not over-fetched by default (reasonable default limit).
- [ ] Live refresh interval is reasonable (≥15 seconds) — not too aggressive.
- [ ] VehicleMarker, PickupMarker, RoutePolyline stubs (currently returning null) are documented as "ready for Leaflet/MapLibre integration".

### Output format

```txt
Verdict: pass / needs-changes / blocker

Map/tracking findings:
- [severity] file path — issue — minimal fix
```

---

## Agent: auth-rbac-reviewer

### Purpose

Reviews frontend auth handling, role-based navigation, protected pages, and safe token usage.

### Scope

```txt
components/auth/**
hooks/useAuth.ts
lib/auth.ts
lib/api.ts
components/layout/Sidebar.tsx
app/login/page.tsx
```

### Checklist

- [ ] Login form handles loading state (Button shows `loading` text) and error state (red alert banner).
- [ ] Token is stored only in localStorage for local MVP — never in cookies or URL params.
- [ ] Token is never logged to console, never printed in UI, never sent to third parties.
- [ ] Logout clears token and resets user state.
- [ ] Sidebar can respect roles when `user.role` data is available — hidden/disabled nav items per role.
- [ ] Protected pages do not crash when `user` is null — show login redirect or error state.
- [ ] Admin-only links can be hidden or disabled for non-admin roles.
- [ ] Unauthorized API responses (401) are handled — can clear token and redirect to login.
- [ ] Password is never stored in localStorage, state, or URL.
- [ ] User profile response does not assume password fields exist.
- [ ] Login page does not show dashboard shell (sidebar, topbar, nav).
- [ ] Role-based sidebar filtering follows the role matrix:
  - admin: all nav items visible
  - dispatcher: dashboard, dispatch, pickups, routes, vehicles, drivers, live tracking, notifications
  - driver: my pickups, assigned route, live tracking, notifications
  - business_user: own pickups, own business profile, pickup locations, notifications

### Output format

```txt
Verdict: pass / needs-changes / blocker

Auth findings:
- [severity] file path — issue — fix
```

---

## Agent: dashboard-ui-reviewer

### Purpose

Reviews dashboard information architecture and operational usefulness.

### Scope

```txt
app/dashboard/page.tsx
components/dashboard/**
hooks/useDashboard.ts
components/ui/StatCard.tsx
```

### Required dashboard sections

```txt
KPI cards (active routes, pending pickups, available vehicles, completed today)
Recent pickups table
Vehicle workload table
Route status overview
Alerts/notifications section
Map preview or tracking preview
```

### KPI examples (can be shown in StatCards)

```txt
Today pickups
Completed pickups
Pending pickups
Failed pickups
Active routes
Available vehicles
Active drivers
Fleet utilization %
```

### Checklist

- [ ] Dashboard answers operational questions quickly (what's pending, what's active, what's wrong).
- [ ] KPI card labels are clear and unambiguous.
- [ ] No misleading fake numbers — if data is unavailable, show "—" or "No data" not "0" or random values.
- [ ] Empty data states are friendly and informative.
- [ ] API failure does not break the entire dashboard — individual sections can fail independently.
- [ ] Recent pickup table is readable (capped at 5 rows, shows status badge + scheduled time).
- [ ] Vehicle workload table is readable (shows load/capacity ratio).
- [ ] Important alerts (failed pickups, vehicles in maintenance) are visually distinct.
- [ ] Dashboard does not become too crowded — uses 2-column grid for KPI cards, 2-column grid for tables.
- [ ] Map preview area is present even as placeholder.

### Output format

```txt
Verdict: pass / needs-changes / blocker

Dashboard findings:
- [severity] file path — issue — minimal fix
```

---

## Agent: table-form-reviewer

### Purpose

Reviews admin/data pages, tables, filters, forms, and CRUD UX.

### Scope

```txt
components/ui/DataTable.tsx
components/ui/SearchInput.tsx
components/ui/FilterPanel.tsx
components/pickups/**
components/vehicles/**
components/drivers/**
app/pickups/**
app/vehicles/**
app/drivers/**
app/businesses/**
app/pickup-locations/**
app/users/**
app/organizations/**
app/waste-categories/**
```

### Checklist

- [ ] Tables have loading state (`<LoadingState />`).
- [ ] Tables have empty state (`<EmptyState title="..." description="..." />`).
- [ ] Tables have error state (`<ErrorState message={error} onRetry={reload} />`).
- [ ] Status values are shown with colored badges (`<StatusBadge />`).
- [ ] Search/filter controls are present and functional on list pages.
- [ ] Forms validate required fields (`required` attribute, min/max for numbers).
- [ ] Destructive actions (delete, cancel) use confirmation dialog (`<ConfirmDialog />`).
- [ ] Update/cancel buttons are disabled when the status does not allow the action (e.g. cancel completed pickup).
- [ ] Form components do not duplicate API logic — they call `onSubmit` prop, not `api.post` directly.
- [ ] Large data pages do not hardcode fake rows as real data.
- [ ] Table rows link to detail pages where appropriate.
- [ ] Pagination or "load more" is considered for large datasets.

### Output format

```txt
Verdict: pass / needs-changes / blocker

Table/form findings:
- [severity] file path — issue — minimal fix
```

---

## Agent: build-quality-reviewer

### Purpose

Checks whether the frontend compiles, lints, and is safe to commit.

### Scope

Whole `frontend/`.

### Commands

Run from `frontend/`:

```bash
npm run lint
npm run build
```

### Checklist

- [ ] TypeScript build passes (`npm run build` succeeds).
- [ ] ESLint passes with no errors (acceptable warnings only — check each).
- [ ] No broken imports — every import resolves to a real module with the exact exported name.
- [ ] No missing components — every component used in a page exists in `components/`.
- [ ] No invalid App Router exports — `page.tsx` files export a default component.
- [ ] No browser-only APIs (`localStorage`, `window`, `document`) used in server components without `"use client"`.
- [ ] Components using `useState`, `useEffect`, `useRouter`, `usePathname`, `useCallback`, event handlers have `"use client"`.
- [ ] No `.env.local` committed to git.
- [ ] Public assets are clean — no unused create-next-app SVGs, no duplicate files.
- [ ] `next-env.d.ts` is in `.gitignore` (should already be).
- [ ] No `node_modules/` or `.next/` in git tracking.

### Common Next.js 16 issues to catch

- `localStorage` used in a server component (must add `"use client"`).
- `useRouter` used without `"use client"`.
- Event handlers (`onClick`, `onSubmit`) used in server component.
- Import path casing mismatch (Linux is case-sensitive).
- Dynamic route params typed incorrectly — must use `Promise<{ id: string }>` pattern.
- Missing default export in `page.tsx`.
- `params` accessed before `await` in async page components.

### Output format

```txt
Verdict: pass / needs-changes / blocker

Commands run:
- [command] — [result]

Build issues:
- [severity] file path — error — fix

Commit readiness:
- ready / not ready (reason if not ready)
```

---

## Development workflow

For every frontend task, use the appropriate agent checklists:

### Dispatch feature changes

```txt
1. frontend-architect — check structure
2. dispatch-ui-reviewer — check dispatch UX
3. api-integration-reviewer — check endpoint usage
4. build-quality-reviewer — run lint/build
```

### Login / Auth changes

```txt
1. auth-rbac-reviewer — check auth handling
2. api-integration-reviewer — check login endpoint
3. build-quality-reviewer — run lint/build
```

### Dashboard changes

```txt
1. dashboard-ui-reviewer — check dashboard UX
2. api-integration-reviewer — check dashboard endpoints
3. build-quality-reviewer — run lint/build
```

### New page (pickups, routes, etc.)

```txt
1. frontend-architect — review page placement
2. api-integration-reviewer — check API calls
3. table-form-reviewer — check table/form UX
4. dispatch-ui-reviewer if dispatch-related
5. map-tracking-reviewer if map-related
6. build-quality-reviewer — run lint/build
```

### Full frontend review

```txt
1. frontend-architect
2. api-integration-reviewer
3. auth-rbac-reviewer
4. dashboard-ui-reviewer
5. dispatch-ui-reviewer
6. map-tracking-reviewer
7. table-form-reviewer
8. build-quality-reviewer

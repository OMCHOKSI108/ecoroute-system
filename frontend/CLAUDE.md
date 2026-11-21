# EcoRoute Engine Frontend — CLAUDE.md

## Project identity

EcoRoute Engine Frontend is the Next.js dashboard UI for an offline-first geospatial fleet routing and dispatch platform for waste/recycling logistics.

The frontend supports:

* fleet dashboard
* dispatch board
* live vehicle tracking
* pickup management
* route management
* driver/vehicle management
* organization/user admin
* waste category management
* notifications
* audit logs
* settings

The UI should feel like:

```txt
Samsara-style fleet visibility
+
Onfleet-style dispatch workflow
+
Waste/recycling operations dashboard
```

Do not make this a generic admin panel. The most important screens are map-first and operations-first.

---

## Tech stack

This frontend uses:

* Next.js 16 App Router (pages under `app/`)
* TypeScript 5 (strict mode enabled)
* React 19
* Tailwind CSS v4 (`@import "tailwindcss"` in globals.css — NOT `@tailwind` directives)
* Backend API from `NEXT_PUBLIC_API_BASE_URL`
* Local/offline backend only

Key config:

* Path alias: `@/*` maps to project root (e.g. `import { api } from '@/lib/api'`)
* ESLint: flat config (`eslint.config.mjs`) with core-web-vitals + TypeScript plugins
* PostCSS: `@tailwindcss/postcss` plugin (Tailwind v4 PostCSS setup)
* No external map library installed yet
* No state management library — uses React hooks + fetch via `lib/api.ts`

Expected local services:

```txt
Frontend: http://localhost:3000
Backend:  http://localhost:5000/api/v1
Postgres/PostGIS: localhost:5432
OSRM: http://localhost:5001
```

---

## Environment variables

Use only public frontend variables with `NEXT_PUBLIC_`.

Required:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_APP_NAME=EcoRoute Engine
```

Do not put secrets in frontend env files.

Never expose:

* JWT secret
* database password
* OSRM internal secrets
* backend-only config
* service credentials

---

## Current folder structure

Main app routes live in `app/`:

```txt
app/
├── page.tsx                          # Home — still create-next-app default, needs redirect
├── layout.tsx                        # Root layout — metadata title says "Create Next App", needs update
├── globals.css                       # Tailwind v4 setup
├── login/page.tsx                    # Login page
├── dashboard/page.tsx                # Fleet dashboard
├── dispatch/page.tsx                 # Dispatch board (highest priority operational page)
├── live-tracking/page.tsx            # Live vehicle tracking
├── pickups/page.tsx                  # Pickup requests list
│   └── [id]/page.tsx                 # Pickup detail (needs implementation)
├── routes/page.tsx                   # Routes list
│   └── [id]/page.tsx                 # Route detail (basic, more needed)
├── vehicles/page.tsx                 # Vehicle fleet list
│   └── [id]/page.tsx                 # Vehicle detail (needs implementation)
├── drivers/page.tsx                  # Driver list
│   └── [id]/page.tsx                 # Driver detail (needs implementation)
├── businesses/page.tsx               # Businesses — placeholder/coming soon
│   └── [id]/page.tsx                 # Business detail (needs implementation)
├── pickup-locations/page.tsx         # Pickup locations — placeholder/coming soon
│   └── [id]/page.tsx                 # Pickup location detail (needs implementation)
├── users/page.tsx                    # Users — placeholder/coming soon
│   └── [id]/page.tsx                 # User detail (needs implementation)
├── organizations/page.tsx            # Organizations — placeholder/coming soon
│   └── [id]/page.tsx                 # Organization detail (needs implementation)
├── waste-categories/page.tsx         # Waste categories — placeholder/coming soon
├── notifications/page.tsx            # Notifications — placeholder/coming soon
├── audit-logs/page.tsx               # Audit logs — placeholder/coming soon
└── settings/page.tsx                 # Settings — placeholder/coming soon
```

Reusable components live in `components/`:

```txt
components/
├── layout/
│   ├── AppShell.tsx                  # Dashboard layout shell (Sidebar + Topbar + main)
│   ├── Sidebar.tsx                   # Client component — full nav, slate-900 sidebar with emerald brand
│   ├── Topbar.tsx                    # Client component — pathname-based header title
│   └── PageHeader.tsx                # Page title + description + optional action buttons
├── ui/                               # Generic reusable UI components
│   ├── Button.tsx                    # Client — primary/emerald, secondary, danger + loading state
│   ├── Card.tsx                      # White rounded bordered card
│   ├── StatCard.tsx                  # KPI metric card (label, value, optional description)
│   ├── StatusBadge.tsx               # Colored pill badge — color map for all domain statuses
│   ├── DataTable.tsx                 # Generic typed table (columns, rows, keyExtractor)
│   ├── LoadingState.tsx              # Centered loading message
│   ├── EmptyState.tsx                # Centered empty state with title + description
│   ├── ErrorState.tsx                # Client — error message + optional retry button
│   ├── Modal.tsx                     # Client — overlay modal wrapper
│   ├── ConfirmDialog.tsx             # Client — modal + cancel + danger confirm
│   ├── SearchInput.tsx               # Client — search text input
│   └── FilterPanel.tsx               # Filter bar container
├── auth/
│   └── LoginForm.tsx                 # Client — email/password form → useAuth → redirect
├── dashboard/
│   ├── DashboardStats.tsx            # Stats grid (StatCard × 4)
│   ├── RecentPickupsTable.tsx        # Recent pickup mini-table
│   └── VehicleWorkloadTable.tsx      # Vehicle workload mini-table
├── dispatch/
│   ├── DispatchBoard.tsx             # Client — orchestrates all dispatch panels + map
│   ├── UnassignedPickupsPanel.tsx    # Left panel — unassigned pickup list
│   ├── AvailableDriversPanel.tsx     # Right panel — available drivers list
│   ├── AvailableVehiclesPanel.tsx    # Right panel — available vehicles + capacity
│   └── DispatchPreviewPanel.tsx      # Right panel — assignment preview (stub — needs implementation)
├── map/
│   ├── MapPlaceholder.tsx            # Dashed-border placeholder — says "map library not yet integrated"
│   ├── VehicleMarker.tsx             # Stub — returns null
│   ├── PickupMarker.tsx              # Stub — returns null
│   └── RoutePolyline.tsx             # Stub — returns null
├── pickups/
│   ├── PickupTable.tsx               # Full pickup list table
│   ├── PickupForm.tsx                # Client — create pickup form
│   └── PickupStatusBadge.tsx         # Thin wrapper around StatusBadge for Pickup status union
├── routes/
│   ├── RouteTable.tsx                # Route list table
│   ├── RouteStopsTable.tsx           # Stub — "coming soon"
│   └── RouteTimeline.tsx             # Stub — "coming soon"
├── vehicles/
│   ├── VehicleTable.tsx              # Vehicle list table
│   └── VehicleForm.tsx               # Client — create vehicle form
├── drivers/
│   ├── DriverTable.tsx               # Driver list table
│   └── DriverForm.tsx                # Client — create driver form
└── notifications/
    └── NotificationDropdown.tsx       # Client — dropdown list NOT integrated into Topbar yet
```

Shared logic lives in `lib/` and `hooks/`:

```txt
lib/
├── api.ts          # Centralized API client: api.get/post/put/patch/delete — attaches Bearer token
├── auth.ts         # Token get/set/clear helpers (localStorage)
├── types.ts        # All domain types: User, Organization, Business, Driver, Vehicle, Pickup, Route, etc.
├── routes.ts       # ROUTES constant object — all page paths
├── constants.ts    # APP_NAME, TOKEN_KEY
└── utils.ts        # formatDate, formatDateTime, cn (classname join)

hooks/
├── useAuth.ts       # Client — login/logout, calls POST /auth/login, stores token
├── useDashboard.ts  # Client — fetches GET /dashboard/summary
├── useDispatch.ts   # Client — fetches GET /pickups?status=pending + /drivers?status=available + /vehicles?status=available
├── usePickups.ts    # Client — fetches GET /pickups, optional status filter, reload mechanism
├── useRoutes.ts     # Client — fetches GET /routes
├── useVehicles.ts   # Client — fetches GET /vehicles
├── useDrivers.ts    # Client — fetches GET /drivers
└── useNotifications.ts  # Client — fetches GET /notifications
```

---

## Core frontend principle

Build the UI around operational questions:

```txt
What pickups are pending?
Which drivers are available?
Which vehicles are available?
Where are the vehicles?
Which route is active?
Which stops are completed?
What needs dispatcher attention now?
```

Avoid screens that only show raw CRUD tables unless the module is admin-only.

---

## Page priorities

Build and polish in this order:

```txt
1. Login
2. Dashboard
3. Dispatch
4. Live Tracking
5. Pickups
6. Routes
7. Vehicles
8. Drivers
9. Pickup Locations
10. Businesses
11. Users / Organizations
12. Notifications
13. Audit Logs
14. Settings
```

Do not spend time on low-priority admin screens before the dispatch and tracking flow works.

---

## Main user roles

Support these frontend role assumptions:

```txt
admin
dispatcher
driver
business_user
```

### admin

Can access everything.

### dispatcher

Can access:
* dashboard, dispatch, pickups, routes, vehicles, drivers, live tracking, notifications

### driver

Can access:
* my pickups, assigned route, live tracking, route stop updates, vehicle location reporting, notifications

### business_user

Can access:
* own pickups, own business profile, pickup locations, notifications

If backend role data is not ready, keep the frontend role checks simple and non-blocking.

Sidebar currently shows all nav items regardless of role. Add role filtering when backend provides user role data.

---

## API base rules

All API calls must go through `lib/api.ts`.

Do not call `fetch()` directly inside pages unless there is a strong reason.

Use the exported `api` object:

```ts
import { api, ApiError } from '@/lib/api';

const data = await api.get<ResponseType>('/path');
const result = await api.post<ResponseType>('/path', body);
const patched = await api.patch<ResponseType>('/path', body);
const deleted = await api.delete<ResponseType>('/path');
```

`lib/api.ts` must:

* read `process.env.NEXT_PUBLIC_API_BASE_URL` (fallback: `http://localhost:5000/api/v1`)
* attach `Authorization: Bearer <token>` on client side from localStorage
* throw `ApiError` with status and message on non-ok responses
* never stringify undefined body
* use `Content-Type: application/json`

Every hook catches `ApiError` and sets a user-facing `error` string. The UI renders `<ErrorState message={error} onRetry={reload} />`.

---

## Authentication rules

Token storage: `localStorage` key `ecoroute_token` (defined in `lib/constants.ts`)

Required login flow:

```txt
POST /auth/login  →  { token, user }
→ store token to localStorage
→ redirect to /dashboard
```

Never store password.

Never print token in UI.

Never log token to console.

Logout: clear token from localStorage.

If backend auth is unavailable, show friendly error state, not a blank page.

Login page does NOT use AppShell — it's a standalone centered card.

---

## UI style rules

Use an operations SaaS style:

```txt
Primary: emerald / green
Secondary: slate / gray
Warning: amber
Danger: red
Background: light gray (bg-gray-50)
Cards: white, bordered, rounded-lg, shadow-sm
Sidebar: dark/slate (bg-slate-900)
Tables: bordered, gray-50 headers, white rows, divide-y
Map areas: large and central
Status badges: colored pill badges
```

The design should feel clean, serious, and logistics-focused.

Avoid:

* colorful toy UI
* unnecessary animations
* random gradients everywhere
* huge marketing sections inside dashboard
* excessive icons without data

---

## Layout rules

Root layout (`app/layout.tsx`):
* Sets `html` to `h-full antialiased`, uses Geist sans + mono font variables
* Body is `min-h-full flex flex-col`
* Currently imports `Geist` and `Geist_Mono` from `next/font/google`

AppShell (used by all authenticated pages):
* `flex h-screen overflow-hidden bg-gray-50`
* Sidebar (w-64, overflow-y-auto)
* Content area: `flex-1 flex-col overflow-hidden`
  * Topbar (h-16, border-b, white bg)
  * Main (flex-1 overflow-y-auto p-6)

Important pattern:
* Login page does NOT wrap in AppShell — it's full-screen centered
* All authenticated pages wrap in `<AppShell><PageHeader ... />{children}</AppShell>`
* PageHeader accepts `title`, `description`, `actions` (ReactNode for buttons)

---

## Component patterns and conventions

### Server vs Client Components

Next.js App Router defaults to server components. Use `"use client"` when:

* Using hooks: `useState`, `useEffect`, `useRouter`, `usePathname`
* Handling events: `onSubmit`, `onClick`, `onChange`
* Using browser APIs: `localStorage`, `window`, `document`
* Using context providers

Current patterns observed:
* All hooks are `'use client'`
* All UI interactive components (Button, SearchInput, Modal, ConfirmDialog, ErrorState, LoginForm, forms, Sidebar, Topbar) are `'use client'`
* Pure presentational components (Card, StatCard, StatusBadge, DataTable, LoadingState, EmptyState, PageHeader, DashboardStats, tables) are server-compatible
* "Coming soon" placeholder pages (businesses, users, etc.) are server components
* Data-fetching pages (dashboard, dispatch, pickups, routes, vehicles, drivers, live-tracking) are `'use client'` because they use hooks

### Dynamic Route Params

Next.js 16 uses async params:

```tsx
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // ...
}
```

Current route detail pages (routes/[id], drivers/[id], etc.) use this pattern.

### Data Fetching Pattern (Client Components)

All hooks follow the same pattern:

```ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';
import type { SomeType } from '@/lib/types';

export function useSomeData() {
  const [data, setData] = useState<SomeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.get<SomeType[]>('/endpoint')
      .then((result) => { if (!cancelled) setData(result); })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Fallback message');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reloadKey]);

  return { data, loading, error, reload };
}
```

All pages then render:
```tsx
{loading && <LoadingState message="..." />}
{error && <ErrorState message={error} onRetry={reload} />}
{!loading && !error && data.length === 0 && <EmptyState title="..." description="..." />}
{!loading && !error && data.length > 0 && <Component data={data} />}
```

---

## Important pages

### Home Page (`app/page.tsx`)

Currently the create-next-app default starter (Next.js logo, Vercel links). Needs to redirect to `/login` or `/dashboard` based on auth state.

### Login Page

Route: `/login`
* Standalone centered card (no AppShell)
* Card: max-w-sm, white bg, border, shadow, APP_NAME heading
* LoginForm: email + password inputs, submit button
* On success: stores token via `useAuth`, redirects to dashboard
* Error state: red alert banner above form

### Dashboard Page

Route: `/dashboard`
* Uses AppShell
* Calls: `useDashboard` (GET /dashboard/summary), `usePickups` (all), `useVehicles` (all)
* Sections:
  * PageHeader with title + description
  * KPI card grid (4 StatCards: activeRoutes, pendingPickups, availableVehicles, completedToday)
  * MapPlaceholder (240px)
  * Two-column grid: RecentPickupsTable (top 5) + VehicleWorkloadTable (top 5)

### Dispatch Page

Route: `/dispatch`
* Uses AppShell
* DispatchBoard orchestrates:
  * MapPlaceholder (300px)
  * 3-column grid:
    * Left: UnassignedPickupsPanel — lists pickups with status badges + weight
    * Center: stacked — AvailableDriversPanel + AvailableVehiclesPanel (shows currentLoad/capacity)
    * Right: DispatchPreviewPanel (stub — "Select pickups and a vehicle to preview")
* Need to implement: pickup selection, vehicle/driver selection, preview action, confirm assignment

### Live Tracking Page

Route: `/live-tracking`
* Uses AppShell
* MapPlaceholder (450px)
* Active routes card below map: filters `routes` to `status === 'active'`, shows count + ID + status + distance
* Marker components (VehicleMarker, PickupMarker, RoutePolyline) are all stubs returning null

### Pickups Page

Route: `/pickups`
* Uses AppShell
* Full PickupTable: ID, category, weight, status badge, scheduled datetime
* Handles loading / error / empty states

### Routes Page

Route: `/routes`
* Uses AppShell
* Full RouteTable: ID, status badge, distance, created datetime
* Route detail: `routes/[id]/page.tsx` — shows basic ID + "coming soon"
* RouteStopsTable and RouteTimeline are stubs

### Tables Pattern

All list tables follow the same structure:
* `overflow-x-auto rounded-lg border border-gray-200`
* `table min-w-full divide-y divide-gray-200 text-sm`
* `thead bg-gray-50` with `text-left text-xs font-medium uppercase tracking-wide text-gray-500`
* `tbody divide-y divide-gray-200 bg-white`
* IDs display as first 8 chars via `id.slice(0, 8)` monospace
* StatusBadge for status columns

---

## Error handling rules

Every data page must handle:

* **Loading**: `<LoadingState message="..." />` — centered gray text
* **Empty data**: `<EmptyState title="..." description="..." />` — centered, friendly
* **API error**: `<ErrorState message={error} onRetry={reload} />` — red text + retry button
* **Unauthorized**: handled by 401 in api.ts — can clear token

Never render a blank page because an API failed.

Never assume arrays exist. Use safe fallbacks:

```ts
const items = data?.items ?? [];
```

---

## Offline-first restrictions

The frontend must remain local/offline friendly.

Do not add:

* Google Maps
* Mapbox
* paid APIs
* cloud auth providers (Auth0, Clerk, Firebase Auth)
* external analytics
* external notification services

Allowed later:

* Leaflet with local or OpenStreetMap tiles
* MapLibre
* local OSRM route geometry from backend

---

## Public assets rules

Keep `public/` clean.

Current state:
```txt
public/
├── file.svg        # create-next-app default
├── globe.svg       # create-next-app default
├── next.svg        # create-next-app default
├── vercel.svg      # create-next-app default
├── window.svg      # create-next-app default
└── images/         # empty directory
```

Clean up by removing unused create-next-app SVG files. Keep `images/` for future use.

---

## Runtime patterns

### `"use client"` boundary

Components that MUST be client components:

* Any component using: `useState`, `useEffect`, `useRouter`, `usePathname`, `useCallback`, `useMemo`
* Any component handling: `onClick`, `onSubmit`, `onChange`, keydown/scroll events
* Any component accessing: `localStorage`, `window`, `document`, `navigator`
* Any component rendering interactive elements: buttons with handlers, inputs, forms, dropdowns, modals

Components that can be server components:

* Pure presentational: Card, StatCard, StatusBadge, PageHeader
* Data-display-only: tables that receive data as props (no client hooks needed)
* Placeholder/static: MapPlaceholder, "coming soon" pages

### Forms Pattern

All form components (PickupForm, VehicleForm, DriverForm):
* Declare a local form values interface (e.g. `PickupFormValues`)
* Accept `onSubmit: (data: FormValues) => Promise<void>` and `loading?: boolean`
* Use local `useState` for each field
* `handleSubmit` calls `e.preventDefault()` then `await onSubmit(values)`
* Button shows loading state

### Confirmation Pattern

Use `ConfirmDialog` for destructive actions:
* Wraps Modal + Button pair (Cancel secondary, Confirm danger)
* Controlled by `open` boolean + `onClose` + `onConfirm` callbacks

---

## Build / lint commands

Run from `frontend/`:

```bash
npm run dev        # Next.js dev server at localhost:3000
npm run lint       # ESLint flat config
npm run build      # Production build
```

Before considering frontend work complete, run:

```bash
npm run lint
npm run build
```

Fix actual errors only. Do not rewrite unrelated files.

---

## TypeScript rules

Strict mode is enabled.

Use types from `lib/types.ts`.

Keep backend response fields flexible because backend may evolve.

Prefer optional fields for uncertain backend fields:

```ts
type Vehicle = {
  id: string;
  plateNumber?: string;
  capacityKg?: number;
  status?: string;
};
```

Avoid `any` unless temporarily necessary. If using temporary `any`, add a short TODO.

All domain types are already defined in `lib/types.ts` — check before adding new types.

Current types defined: User, Organization, Business, Driver, Vehicle, PickupLocation, Pickup, Route, DashboardStats, AuditLog, Notification, WasteCategory.

---

## Before changing code

For any task:

1. Read the relevant page/component/hook first — understand existing patterns.
2. Check `lib/types.ts` for existing types — do not redefine.
3. Check `hooks/` for existing data hooks — do not duplicate.
4. Make the smallest correct change.
5. Avoid rewriting working files.
6. Run lint/build if the change is broad.
7. Report files changed.

---

## Do not do

Do not:

* rewrite whole frontend
* add unnecessary state management library (no Redux, Zustand, Jotai — hooks are sufficient)
* add map library (Leaflet/MapLibre) before placeholder UI is accepted
* add charts (Chart.js, Recharts) unless dashboard API and layout are stable
* hardcode fake data as if it is real
* expose secrets in env or code
* commit `.env.local`
* break existing route paths
* create components over 300 lines — refactor into smaller pieces
* add Google Maps or Mapbox
* add paid external APIs
* add cloud auth providers
* add `any` without a TODO comment
* write an `escapeHtml` function — the runtime handles HTML entities
* modify backend files from a frontend task
* use `fetch()` directly in pages — always use `lib/api.ts`
* add pages beyond the priority list above

---

## Good frontend milestone

The first frontend milestone is complete when:

```txt
/login works
/dashboard renders real or safe fallback data
/dispatch shows pickups/vehicles/drivers and can preview/assign
/live-tracking shows vehicle locations or empty state
/pickups lists pickup requests
npm run build passes
```

Focus on this before polishing every admin page.

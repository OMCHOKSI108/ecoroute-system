# AI-Powered Performance, Security & Architecture Review

Comprehensive review executed across the entire **EcoRoute System** (Backend, Frontend, Database, Routing & Integrations) using the `/performance-testing-review-ai-review` multi-layer audit framework.

---

## 1. Executive Summary & Health Scorecard

| Domain | Rating | Status | Summary |
| :--- | :---: | :---: | :--- |
| **Performance & Scalability** | **6.5 / 10** | ⚠️ **Needs Attention** | Network I/O occurs inside open DB row-level transaction locks; small connection pool (`max: 10`); potential pool exhaustion under routing load. |
| **Security & Authorization** | **7.5 / 10** | ⚠️ **Needs Attention** | Strong Zod input validation and RBAC in controllers; however, dynamic SQL column interpolation exists in user repo, TLS cert verification is disabled in prod, and JWT refresh tokens cannot be revoked. |
| **Architecture & Reliability**| **8.0 / 10** | ✅ **Good** | Clean modular layering (Route → Controller → Service → Repository). Clear separation of concerns, transactional dispatch integrity. |
| **Database & PostGIS** | **7.0 / 10** | ⚠️ **Needs Attention** | Great spatial indexes (GIST on `location`) and check constraints; **critical risk**: `migrations.js` runs `DROP TABLE ... CASCADE` every run. |
| **Frontend Architecture** | **8.0 / 10** | ✅ **Good** | Modern Next.js App Router structure with clean custom hooks (`useDispatch`, `useVehicles`, etc.), but relies on `localStorage` for JWT tokens. |
| **Testing & CI/CD** | **7.0 / 10** | ⚠️ **Needs Attention** | Good unit test suite for backend mocking external services; frontend has zero automated tests configured. |

---

## 2. Critical & High Severity Findings

---

### 🚨 [CRITICAL] Issue 1: External OSRM Network Call Inside Database Transaction Lock
* **File:** [`backend/src/services/routes.service.ts#L45-L66`](file:///home/omchoksi/workspace/projects/internship/ecoroute_system/backend/src/services/routes.service.ts#L45-L66)
* **Category:** `Performance / Scalability / Reliability`
* **Severity:** **CRITICAL** | **Effort:** Easy

#### Problem
In `generateRoute`, `withTransaction()` begins an exclusive database transaction and locks the vehicle row with `FOR UPDATE`. While holding this database lock and consuming one of only 10 available database connection pool slots, it executes an **asynchronous external HTTP request** to the OSRM engine (`await osrmTrip(...)` with up to 5,000 ms timeout).

```
[Request Start]
       │
       ├──> BEGIN TRANSACTION (Acquires Connection #1 & Vehicle Row Lock)
       │         │
       │         ├──> HTTP Request to OSRM (Network delay: 1s - 5s)  <-- DB Connection BLOCKED
       │         │
       │         ├──> INSERT INTO routes ...
       │
[COMMIT & RELEASE]
```
If 10 concurrent route generation requests are received or OSRM responds slowly, **all 10 database pool connections are blocked waiting for HTTP network sockets**, starving health checks, auth endpoints, and the rest of the application.

#### Remediation
Perform read validation and the external OSRM calculation **before** opening the database transaction, then open the transaction only for the atomic database writes.

```typescript
// ✅ FIX: Perform external OSRM calculation BEFORE opening the write transaction
export async function generateRoute(
  input: GenerateRouteInput,
  orgId: string,
  actorId?: string,
  actorRole?: string,
): Promise<RouteResponse> {
  // 1. Fetch read data without holding write locks
  const pickups = await routesRepo.findAssignedPickupsWithLocations(input.vehicleId, orgId);
  if (pickups.length === 0) {
    throw new ConflictError('No assigned pickups found for this vehicle — dispatch first');
  }

  // 2. Perform external network I/O OUTSIDE database transaction
  const tripResult = await osrmTrip(pickups.map((p) => ({ lat: p.lat, lng: p.lng })));
  const trip = tripResult.trips[0];
  if (!trip) {
    throw new Error('OSRM trip response did not include a route');
  }

  // 3. Atomically lock, persist route and transition pickups in short-lived transaction
  return withTransaction(async (client) => {
    const vehicle = await routesRepo.lockVehicleForRouteGeneration(client, input.vehicleId, orgId);
    if (!vehicle) throw new NotFoundError('Vehicle not found');
    if (vehicle.status !== 'dispatched') {
      throw new ConflictError(`Vehicle is not dispatched (status: '${vehicle.status}')`);
    }

    const activeRoute = await routesRepo.findActiveRouteForVehicle(client, input.vehicleId, orgId);
    if (activeRoute) throw new ConflictError('An active route already exists for this vehicle');

    const route = await routesRepo.createRoute(client, {
      organizationId: orgId,
      vehicleId: input.vehicleId,
      totalDistanceM: trip.distance,
      totalDurationS: trip.duration,
      geometry: trip.geometry,
      waypoints: tripResult.waypoints,
      pickupCount: pickups.length,
      osrmData: tripResult,
    });

    await routesRepo.setPickupsRouteId(client, pickups.map((p) => p.id), route.id);
    return toRouteResponse(route);
  });
}
```

---

### 🚨 [CRITICAL] Issue 2: `migrations.js` Destructively Drops All Tables on Every Run
* **File:** [`backend/migrations.js#L117-L154`](file:///home/omchoksi/workspace/projects/internship/ecoroute_system/backend/migrations.js#L117-L154)
* **Category:** `DevOps / Data Safety`
* **Severity:** **CRITICAL** | **Effort:** Easy

#### Problem
In [`backend/migrations.js`](file:///home/omchoksi/workspace/projects/internship/ecoroute_system/backend/migrations.js), the function `resetExistingDatabase()` executes:
```javascript
DROP TABLE IF EXISTS "notifications", "vehicle_location_latest", ..., "organizations" CASCADE
```
before running the SQL migration files. If an operator or CI pipeline runs `npm run dev` or `node migrations.js` against staging or production, **all operational records, user accounts, and audit logs are permanently wiped**.

#### Remediation
Split reset operations from schema migrations:
1. `migrations.js` should only apply pending migrations tracked in a `schema_migrations` table.
2. The drop logic should be moved to an explicit `db:reset` script guarded by `NODE_ENV !== 'production'`.

---

### ⚠️ [HIGH] Issue 3: Race Condition & Missing Row Locks in `autoAssign`
* **File:** [`backend/src/services/dispatch.service.ts#L72-L135`](file:///home/omchoksi/workspace/projects/internship/ecoroute_system/backend/src/services/dispatch.service.ts#L72-L135)
* **Category:** `Concurrency / Bug`
* **Severity:** **HIGH** | **Effort:** Medium

#### Problem
In `autoAssign`:
1. It queries unassigned pickups and available vehicles in memory:
   ```typescript
   const vehicles = await dispatchRepo.findAvailableVehicles(orgId);
   const pickups = await dispatchRepo.findUnassignedPendingPickups(orgId);
   ```
2. It packs batches in-memory and then runs an update in a separate transaction **without locking the vehicle or pickups first**.
3. If two dispatchers trigger auto-assign concurrently (or a manual assignment happens simultaneously), both will assign the same pickups or overload vehicle capacity. In contrast, `assignDispatch()` correctly uses `lockVehicle()` and `lockPickups()` (`SELECT ... FOR UPDATE`).

#### Remediation
Lock candidates inside the transaction or use atomic conditional status updates (`WHERE status = 'available' RETURNING *`).

---

### ⚠️ [HIGH] Issue 4: Undefined Variable Reference in Dead Repository Code
* **File:** [`backend/src/repositories/audit.repository.ts#L66-L75`](file:///home/omchoksi/workspace/projects/internship/ecoroute_system/backend/src/repositories/audit.repository.ts#L66-L75)
* **Category:** `Bug / Code Quality`
* **Severity:** **HIGH** | **Effort:** Trivial

#### Problem
In `audit.repository.ts`, there are duplicated OTP functions containing:
```typescript
WHERE user_id = $1 AND used_at IS NULL AND created_at >= NOW() - INTERVAL '${ExpiryMinutes} minutes'
```
* `ExpiryMinutes` is **not defined** (capital `E`, not passed in scope). Calling this function will throw an unhandled `ReferenceError: ExpiryMinutes is not defined`.
* This functionality belongs in [`auth.repository.ts`](file:///home/omchoksi/workspace/projects/internship/ecoroute_system/backend/src/repositories/auth.repository.ts).

#### Remediation
Remove lines 50–95 from [`backend/src/repositories/audit.repository.ts`](file:///home/omchoksi/workspace/projects/internship/ecoroute_system/backend/src/repositories/audit.repository.ts).

---

### ⚠️ [HIGH] Issue 5: Dynamic SQL Column Interpolation in `updateUser`
* **File:** [`backend/src/repositories/users.repository.ts#L62-L78`](file:///home/omchoksi/workspace/projects/internship/ecoroute_system/backend/src/repositories/users.repository.ts#L62-L78)
* **Category:** `Security (OWASP A03 Injection)`
* **Severity:** **HIGH** | **Effort:** Easy

#### Problem
`updateUser` dynamically constructs an SQL statement using `Object.keys(fields)`:
```typescript
const setClauses = keys.map((k, i) => `${k} = $${i + 2}`);
`UPDATE users SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $1`
```
1. Keys are not validated against an allowed column whitelist.
2. The query omits `organization_id = $x`, allowing cross-tenant user record modification if ever called with an arbitrary `id`.

#### Remediation
Validate against an allowed set of columns (e.g. `['first_name', 'last_name', 'phone']`) and always enforce `organization_id` in the `WHERE` clause.

---

### ⚠️ [HIGH] Issue 6: Production SSL Verification Disabled (`rejectUnauthorized: false`)
* **File:** [`backend/src/config/db.ts#L4-L6`](file:///home/omchoksi/workspace/projects/internship/ecoroute_system/backend/src/config/db.ts#L4-L6)
* **Category:** `Security (OWASP A02 Cryptographic Failures)`
* **Severity:** **HIGH** | **Effort:** Easy

#### Problem
```typescript
const sslConfig = config.nodeEnv === 'production'
  ? { rejectUnauthorized: false }
  : false;
```
Setting `rejectUnauthorized: false` completely disables TLS server certificate verification. Anyone on the local network path or cloud VPC can perform a Man-in-the-Middle (MitM) attack and intercept plaintext SQL credentials, user passwords, and customer data.

#### Remediation
Provide the CA root certificate for managed cloud databases (like Aiven or AWS RDS) or set `rejectUnauthorized: true`.

---

## 3. Medium & Low Severity Observations

### 🟡 [MEDIUM] Single Vehicle Truncation in `getDriverById`
* **File:** [`backend/src/services/drivers.service.ts#L64-L65`](file:///home/omchoksi/workspace/projects/internship/ecoroute_system/backend/src/services/drivers.service.ts#L64-L65)
* `vehicleRepo.findVehiclesByOrg(orgId, { page: 1, limit: 1 })` only checks the 1st vehicle in the organization. If the driver is assigned to vehicle #2 or #10, it falsely returns `assignedVehicle: null`.
* **Fix:** Query directly: `SELECT * FROM vehicles WHERE driver_id = $1 AND organization_id = $2`.

### 🟡 [MEDIUM] Token Invalidation & Stateless Refresh Tokens
* **File:** [`backend/src/services/auth.service.ts#L188-L195`](file:///home/omchoksi/workspace/projects/internship/ecoroute_system/backend/src/services/auth.service.ts#L188-L195)
* Refresh tokens are pure JWTs with 7-day lifespans and no database revocation table. When a user changes or resets their password, existing refresh tokens remain valid until expiration.
* **Fix:** Store a `token_version` column on `users` or a `refresh_tokens` session table.

### 🟡 [MEDIUM] Frontend Token Storage in `localStorage`
* **File:** [`frontend/lib/auth.ts#L9`](file:///home/omchoksi/workspace/projects/internship/ecoroute_system/frontend/lib/auth.ts#L9)
* JWTs stored in `localStorage` are accessible by JavaScript, making them vulnerable to XSS exfiltration.
* **Fix:** Store session tokens in `httpOnly`, `Secure`, `SameSite=Lax` cookies.

---

## 4. Performance & Scalability Benchmark Recommendations

| Area | Current Behavior | Target / Recommendation |
| :--- | :--- | :--- |
| **Connection Pool** | `max: 10` connections | Under 50+ concurrent requests, 10 connections will queue up. Increase to `20-30` and ensure all connections are short-lived. |
| **PostGIS Spatial Queries** | GIST indexes are present on `businesses.location` and `pickup_locations.location`. | Excellent index coverage. Use `ST_DWithin(location, ..., true)` with geography type for sphere distance calculations. |
| **External I/O Timeouts** | `OSRM_TIMEOUT_MS=5000` | Good defensive timeout. Make sure fallback stubs (`stubTripResult`) activate cleanly when offline mode is true. |

---

## 5. Next Steps

Would you like me to:
1. **Fix Issue 1 & 3**: Refactor `generateRoute` and `autoAssign` so OSRM calls and lock operations never hold database transactions hostage?
2. **Clean up Issue 4 & 5**: Remove the broken OTP code in `audit.repository.ts` and harden `users.repository.ts`?
3. **Run Backend Test Suite**: Run `npm install` and verify existing tests with `npm test`?
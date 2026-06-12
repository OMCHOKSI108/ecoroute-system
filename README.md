# EcoRoute Engine

EcoRoute Engine, also referred to as RouteForge or FleetFlow Engine, is a backend
infrastructure platform for geospatial fleet routing, pickup dispatch, and operational
analytics in waste collection and recycling logistics.

The system is designed for offline-first operation with local PostgreSQL/PostGIS and
local OSRM. It provides organization-scoped APIs for business locations, pickup requests,
vehicle capacity management, dispatch assignment, route generation, audit logging, and
dashboard metrics.

## System Overview

EcoRoute Engine automates the dispatch workflow for circular economy logistics fleets.
The backend receives pickup requests from client applications, validates organization and
role permissions, stores geospatial pickup data in PostgreSQL/PostGIS, selects eligible
vehicles under capacity and status constraints, and calls OSRM for distance, ETA, and
route geometry calculations.

The core dispatch path is transaction-oriented. Vehicle and pickup state transitions are
persisted under database transactions to prevent duplicate assignment, capacity overflow,
and inconsistent route state. OSRM is treated as a local routing dependency, not as a
public cloud API, so routing remains portable and suitable for offline deployments.

## High-Level Architecture

```mermaid
flowchart TB
  subgraph Clients["Client Applications"]
    AdminUI["Admin / Dispatcher UI"]
    DriverApp["Driver App"]
    OpsTools["Operations Tools"]
  end

  subgraph API["EcoRoute Backend - Node.js / Express / TypeScript"]
    Router["API Router / OpenAPI Surface"]
    Auth["JWT Authentication + RBAC"]
    Validation["Zod Request Validation"]
    Controllers["Controllers"]
    Services["Domain Services"]
    Dispatch["Dispatch Service"]
    RouteSvc["Route Service"]
    Audit["Audit Service"]
    Repositories["Repository Layer"]
    OSRMClient["OSRM Client"]
    Logging["Structured Logging / Error Handling"]
  end

  subgraph Data["PostgreSQL + PostGIS"]
    Tables["Organizations, Users, Businesses, Vehicles, Pickups, Routes, Audit Logs"]
    Spatial["Geography Columns + Spatial Indexes"]
    Locks["Transactions + Row Locks"]
  end

  subgraph Routing["Local OSRM Engine"]
    OSRM["OSRM over OpenStreetMap Data"]
    RouteAPI["route / nearest / table / trip"]
  end

  AdminUI --> Router
  DriverApp --> Router
  OpsTools --> Router
  Router --> Auth
  Auth --> Validation
  Validation --> Controllers
  Controllers --> Services
  Services --> Dispatch
  Services --> RouteSvc
  Services --> Audit
  Dispatch --> Repositories
  RouteSvc --> OSRMClient
  Repositories --> Tables
  Repositories --> Spatial
  Repositories --> Locks
  OSRMClient --> OSRM
  OSRM --> RouteAPI
  Services --> Logging
```

## Backend Swagger Page 

![Backend Swagger Documentation UI](docs/backend_swagger.png)

![EcoRoute Backend Running in Terminal](docs/backend_running.png)


## Core Technology Stack

- Runtime: Node.js with TypeScript
- HTTP framework: Express
- Validation: Zod schemas
- Authentication: JWT access and refresh tokens
- Authorization: Role-based access control for admin, dispatcher, and driver flows
- Database: PostgreSQL with PostGIS
- Database access: `pg` connection pool and repository modules
- Routing engine: Local OSRM using OpenStreetMap-derived road network data
- API documentation: Swagger UI / OpenAPI document
- Testing: Jest and Supertest
- Containerization: Docker and Docker Compose

## System Capabilities

### Routing and Dispatch

- Assign pickup requests to eligible vehicles.
- Prevent duplicate dispatch assignment through transactional state changes.
- Enforce vehicle capacity limits before assignment persistence.
- Generate route records with stop ordering, distance, ETA, and route geometry.
- Integrate with local OSRM for route computation.
- Handle OSRM failures as explicit operational errors instead of silently accepting
  incomplete route data.

### Geospatial Data Management

- Store pickup and business locations in PostgreSQL/PostGIS.
- Support radius-based and nearest-neighbor location queries.
- Use spatial indexes for location search performance.
- Maintain organization isolation for geospatial and operational records.
- Support service-area and proximity-driven dispatch workflows.

### Concurrency and Consistency

- Use ACID transactions for dispatch and route state changes.
- Lock vehicle and pickup rows during critical assignment paths.
- Keep pickup, vehicle, route, and audit-log state consistent.
- Reject capacity overflow and invalid status transitions.
- Preserve deterministic behavior under concurrent dispatcher activity.

### Security and Access Control

- Protect APIs with JWT authentication.
- Enforce RBAC through route middleware.
- Validate request bodies and query parameters before service execution.
- Rate-limit sensitive authentication endpoints.
- Keep secrets in environment variables and exclude local `.env` files from Git.
- Avoid logging passwords, tokens, and local secret values.

### Observability and Operations

- Emit structured request logs.
- Return consistent error bodies for client and server errors.
- Expose health-check APIs for database and OSRM readiness.
- Maintain audit logs for dispatch and operational activity.
- Provide dashboard APIs for fleet utilization and pickup statistics.

## Non-Functional SLAs

Target operational characteristics:

- Route generation latency: less than 2 seconds for normal dispatch workloads.
- Spatial query latency: less than 500 ms for indexed proximity searches.
- General API latency: less than 300 ms for non-routing endpoints under normal load.
- Availability target: 99 percent or higher for production deployments.
- Deployment model: portable local or cloud environment using Dockerized services.
- Scaling model: horizontally scalable API workers with future queue-backed job workers.

These values are engineering targets. Production enforcement requires load testing,
database index verification, OSRM dataset sizing, and runtime observability.

## Security Posture

EcoRoute Engine assumes a multi-organization operating model. Every protected operation
must be evaluated against both user identity and organization scope.

Security controls:

- JWT-based access tokens and refresh tokens.
- RBAC checks on privileged business, vehicle, dispatch, route, and audit operations.
- Zod-based input validation at the API boundary.
- Bcrypt password hashing.
- Authentication rate limiting.
- Environment-based secret configuration.
- No committed local `.env` files.
- Structured error handling that does not expose stack traces in production.

Production deployments should use high-entropy JWT secrets, restricted database users,
TLS termination, centralized logs, and managed secret storage.

## Proposed Project Structure

The current repository follows a modular backend layout. The structure below represents
the production-ready target layout for continued development.

```text
ecoroute-system/
  backend/
    src/
      app.ts
      server.ts
      config/
        db.ts
        env.ts
      clients/
        osrm.client.ts
      controllers/
        auth.controller.ts
        businesses.controller.ts
        pickups.controller.ts
        vehicles.controller.ts
        dispatch.controller.ts
        routes.controller.ts
        dashboard.controller.ts
        audit.controller.ts
        health.controller.ts
      services/
        auth.service.ts
        businesses.service.ts
        pickups.service.ts
        vehicles.service.ts
        dispatch.service.ts
        routes.service.ts
        dashboard.service.ts
        audit.service.ts
        notifications.service.ts
      repositories/
        auth.repository.ts
        businesses.repository.ts
        pickups.repository.ts
        vehicles.repository.ts
        dispatch.repository.ts
        routes.repository.ts
        dashboard.repository.ts
        audit.repository.ts
      routes/
        index.routes.ts
        auth.routes.ts
        businesses.routes.ts
        pickups.routes.ts
        vehicles.routes.ts
        dispatch.routes.ts
        routes.routes.ts
        dashboard.routes.ts
        audit.routes.ts
        health.routes.ts
      schemas/
        auth.schemas.ts
        businesses.schemas.ts
        pickups.schemas.ts
        vehicles.schemas.ts
        dispatch.schemas.ts
        routes.schemas.ts
      middlewares/
        authenticate.ts
        requireRole.ts
        requestLogger.ts
        errorHandler.ts
      docs/
        openapi.ts
      types/
        auth.ts
        errors.ts
        express.d.ts
    db/
      migrations/
        001_auth.sql
        002_businesses.sql
        003_vehicles.sql
        004_pickup_requests.sql
        005_routes.sql
        006_audit_logs.sql
    scripts/
      setup-db-admin.sql
    tests/
      auth.test.ts
      businesses.test.ts
      pickups.test.ts
      vehicles.test.ts
      dispatch.test.ts
      routes.test.ts
      dashboard.test.ts
      audit.test.ts
      health.test.ts
    migrations.js
    Dockerfile
    package.json
    tsconfig.json
    jest.config.js
  frontend/
    README.md
  docs/
    project.md
  docker-compose.yml
  .env.example
  README.md
```

Recommended future additions for larger production deployments:

- `backend/src/jobs/` for queue-backed asynchronous dispatch and notification workers.
- `backend/src/observability/` for metrics, tracing, and logger configuration.
- `backend/src/modules/` if domain modules become large enough to require stronger
  vertical boundaries.
- `infra/` for environment-specific deployment manifests.

## Development Guidelines

### Prerequisites

- Node.js compatible with the TypeScript toolchain used by the backend.
- npm.
- PostgreSQL with PostGIS.
- Local OSRM service for route generation workflows.
- Docker and Docker Compose for containerized development.

### Environment Setup

Copy the example environment file and update local values:

```bash
cp .env.example .env
```

Important variables:

```text
PORT=3000
API_PREFIX=/api/v1
DATABASE_URL=postgresql://ecoroute_user:change_me_in_production@localhost:5432/ecoroute_db
JWT_SECRET=change_me_to_a_long_random_secret
JWT_REFRESH_SECRET=change_me_to_another_long_random_secret
OSRM_BASE_URL=http://localhost:5000
OFFLINE_MODE=true
```

Never commit `.env` or any file containing live credentials.

### Backend Install and Run

```bash
cd backend
npm install
node migrations.js
npm run dev
```

Default API base:

```text
http://localhost:3000/api/v1
```

Health endpoint:

```text
GET /api/v1/health
```

API documentation endpoint:

```text
GET /api-docs
```

### Build and Test

```bash
cd backend
npm run build
npm test
```

The test suite should mock external routing dependencies. Unit and API tests should not
require live OSRM or public network access.

## Database and Migration Workflow

Initial PostgreSQL administration is performed with a privileged PostgreSQL role:

```bash
sudo -u postgres psql -f backend/scripts/setup-db-admin.sql
```

Application-level reset and migration:

```bash
cd backend
node migrations.js
```

The migration script is designed to operate as the application database user after the
database, schema, and PostGIS extension have been prepared by the admin setup script.

Database requirements:

- PostGIS extension enabled.
- Application schema owned by the application database user.
- Foreign keys and check constraints enforced by migrations.
- Spatial indexes present for geospatial lookup paths.
- Dispatch mutations executed in transactions.

## Docker Deployment

Start the local stack:

```bash
docker compose up --build
```

The Compose stack defines:

- `db`: PostgreSQL/PostGIS service.
- `backend`: EcoRoute Engine API service.
- `migrate`: optional one-shot migration runner under the `tools` profile.
- `osrm`: documented OSRM service template requiring preprocessed map data.

Run the migration helper:

```bash
docker compose --profile tools run --rm migrate
```

Production deployments should provide real secret values through the target platform's
secret manager instead of Compose defaults.

## OSRM Deployment Notes

OSRM requires preprocessed OpenStreetMap data before it can serve routing requests. A
typical production workflow is:

```text
1. Download region-specific .osm.pbf data.
2. Run OSRM extraction with the selected routing profile.
3. Partition and customize the dataset for MLD routing.
4. Run osrm-routed against the generated .osrm dataset.
5. Configure OSRM_BASE_URL for the backend.
```

The backend should be deployed with `OFFLINE_MODE=true` when route generation is expected
to rely only on local services.

## API Domains

Primary API domains:

- Authentication and organization registration.
- Business location management.
- Pickup request lifecycle management.
- Vehicle and driver assignment.
- Dispatch execution.
- Route generation and retrieval.
- Dashboard metrics.
- Audit log retrieval.
- Health checks.

Protected routes require a valid bearer token. Administrative and dispatcher operations
require appropriate RBAC permissions.

## Operational Requirements

Before production use, verify:

- PostgreSQL connection pool sizing under expected concurrency.
- PostGIS indexes using `EXPLAIN ANALYZE` for proximity queries.
- OSRM latency using the target map dataset.
- Transaction behavior under concurrent dispatch requests.
- JWT secret rotation strategy.
- Centralized logs and error monitoring.
- Database backup and restore procedure.
- Health checks wired into the orchestrator.

## Repository Hygiene

Tracked source should include application code, migrations, tests, Docker files, and
documentation. Generated output and local runtime files should remain untracked.

Ignored examples:

- `.env`
- `node_modules/`
- `dist/`
- coverage output
- local prompt or scratch exports

Current root remote:

```text
https://github.com/OMCHOKSI108/ecoroute-system
```

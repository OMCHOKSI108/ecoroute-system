# EcoRoute Engine Claude Guide

EcoRoute Engine is a geospatial fleet routing and dispatch optimization backend for waste collection, recycling logistics, and circular economy transport.

## Current Detected Layout

- `docs/project.md`: canonical product and functional requirements.
- `backend/package.json`: minimal CommonJS Node.js package named `backend`; no source files yet.
- `frontend/`: directory exists but no files were detected.
- No `README.md`, `tsconfig.json`, `docker-compose.yml`, Prisma schema, migrations, source, or test folders were detected.

## Architecture Direction

- Build the backend as layered modules: route/controller -> validation/DTO -> service -> repository/database/client.
- Keep controllers thin; put dispatch, routing, capacity, and state-transition logic in services.
- Isolate integrations: PostGIS access belongs in repositories/query modules; OSRM access belongs in a routing client/service.
- Treat `docs/project.md` as the product source of truth when adding domains, states, or constraints.
- Prefer clear modules for businesses, pickup requests, vehicles, drivers, dispatch assignments, routes, auth/RBAC, audit logs, notifications, and dashboard metrics.

## Commands

Detected from `backend/package.json`:

- `cd backend && npm test`: currently the default failing placeholder (`Error: no test specified`).

Before adding new tooling, update `backend/package.json` scripts so Claude can run `npm test`, and add `lint`, `format`, and `dev` when available.

## Required Rules

Before editing important areas, read the relevant rule files:

- Backend source: `.claude/rules/backend.md`
- Database, migrations, repositories, SQL, PostGIS: `.claude/rules/database-postgis.md`
- Dispatch, pickups, vehicles, routes, OSRM: `.claude/rules/dispatch-routing.md`
- Auth, RBAC, middleware, users, organizations: `.claude/rules/api-security.md`
- Tests: `.claude/rules/tests.md`
- Docker/deployment/env files: `.claude/rules/docker-deployment.md`

## Canonical Conventions

- Use explicit request validation for every write endpoint.
- Never trust raw request bodies or caller-supplied organization/user identifiers without auth context checks.
- Persist dispatch decisions transactionally.
- Prevent duplicate pickup assignment through constraints and transactional checks.
- Enforce vehicle capacity before assignment and before route finalization.
- Store route state consistently; avoid partial route persistence after failed OSRM calls.
- Keep external calls mockable and timeout-bound.
- Use parameterized SQL or ORM-safe query APIs.
- Add indexes for spatial lookup paths and foreign keys used in dashboard queries.
- Do not log passwords, tokens, secrets, raw authorization headers, or full sensitive payloads.

## Hard Guardrails

- Do not invent existing source paths; inspect the repo first.
- Do not commit secrets, tokens, database URLs, or real credentials.
- Do not use live OSRM or external network in unit tests.
- Do not add dispatch logic without tests for capacity limits and duplicate assignment prevention.
- Do not run destructive commands such as `rm -rf /`, `git reset --hard`, force pushes, production database drops, or broad Docker prune commands.
- If exact framework choices are still open, keep additions small and document the assumption.

## Before PR

- Run configured formatting, linting, and tests.
- Inspect the diff for accidental project-wide churn.
- Use reviewer agents relevant to changed areas.
- Confirm docs/API notes changed if behavior changed.
- Summarize behavior, tests run, risks, and follow-up work.

---
name: backend
description: Backend source rules for EcoRoute Engine modules, services, controllers, and validation.
globs:
  - "backend/src/**/*"
  - "backend/app/**/*"
  - "backend/server/**/*"
  - "backend/routes/**/*"
  - "backend/controllers/**/*"
  - "backend/services/**/*"
  - "backend/lib/**/*"
  - "backend/**/*.js"
  - "backend/**/*.ts"
---

# Backend Rules

- Inspect the actual backend structure before editing; the repo currently has only `backend/package.json`.
- Use a modular backend structure as code grows: routes/controllers, validation schemas or DTOs, services, repositories, clients, and shared domain types.
- Keep controllers thin: parse auth context, call validation, delegate to services, return responses.
- Put business rules in services, especially pickup lifecycle, dispatch, route state, and dashboard calculations.
- Centralize validation with the selected stack's schema/DTO tool; never trust raw request bodies.
- Use typed DTOs/schemas when TypeScript or a validation library is present.
- Keep integration clients injectable or easily mockable.
- Return consistent error shapes and avoid leaking internal stack traces to API clients.

## Mistakes To Avoid

- Mixing HTTP request handling with dispatch or database transaction logic.
- Duplicating validation rules across controllers.
- Reading `organizationId`, `role`, or `driverId` from the body when it should come from auth context.
- Hardcoding OSRM, database, JWT, or service URLs in source files.
- Adding a new framework pattern without checking existing conventions first.

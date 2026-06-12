---
name: tests
description: Testing rules for EcoRoute Engine behavior, dispatch, PostGIS, OSRM, auth, and state transitions.
globs:
  - "backend/test/**/*"
  - "backend/tests/**/*"
  - "backend/**/*.test.*"
  - "backend/**/*.spec.*"
  - "backend/**/__tests__/**/*"
---

# Test Rules

- Unit tests must not require live OSRM, external network, or production services.
- Use fakes/mocks for OSRM responses, timeouts, failures, and malformed responses.
- Database tests must use a test database, transaction rollback, containers, or a documented isolated strategy.
- Cover capacity constraints, duplicate assignment prevention, route state transitions, pickup status transitions, and RBAC.
- Include failure tests for OSRM downtime and database transaction rollback where dispatch state can be affected.
- Prefer small behavior-focused tests over broad implementation snapshots.

## Mistakes To Avoid

- Tests that pass only when a local OSRM instance is running.
- Tests that mutate shared development data.
- Only testing successful dispatch while skipping full-capacity and race-condition cases.
- Mocking the service under test instead of the external dependency.
- Leaving `npm test` as the default failing placeholder after adding real code.

---
name: dispatch-routing
description: Dispatch, assignment, pickup, vehicle, route, and OSRM rules.
globs:
  - "backend/**/*dispatch*"
  - "backend/**/*assignment*"
  - "backend/**/*pickup*"
  - "backend/**/*vehicle*"
  - "backend/**/*route*"
  - "backend/**/*routing*"
  - "backend/**/*osrm*"
  - "backend/services/**/*"
  - "backend/repositories/**/*"
---

# Dispatch And Routing Rules

- Capacity-aware vehicle assignment is mandatory for every dispatch path.
- Prevent double assignment with transactional checks plus database constraints where possible.
- Use row locking, optimistic concurrency, or another explicit transaction strategy for competing dispatch operations.
- Separate route generation from assignment persistence; persist only after the state strategy is clear.
- Wrap OSRM route, nearest, table, and trip calls in one client/service boundary.
- Normalize OSRM distance, duration, geometry, and waypoint order before returning to domain services.
- Never silently ignore OSRM failures; surface retryable/non-retryable errors and keep route state consistent.
- Emit audit-log entries for assignment, route generation, pickup completion, and route completion when audit logging exists.

## Mistakes To Avoid

- Assigning pickups based only on distance while ignoring vehicle capacity.
- Updating pickup status and vehicle load in separate non-transactional operations.
- Leaving pickups assigned after route generation fails without a documented recovery state.
- Calling OSRM directly from controllers.
- Treating OSRM optimized stop ordering as proof that capacity or business constraints are satisfied.

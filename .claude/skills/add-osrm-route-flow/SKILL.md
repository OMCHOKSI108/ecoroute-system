---
name: add-osrm-route-flow
description: Use when integrating OSRM or adding route distance, ETA, geometry, nearest, table, or trip optimization flows.
---

# Add OSRM Route Flow

Use this workflow when adding route generation or OSRM integration.

## Steps

1. Read `docs/project.md` and `.claude/rules/dispatch-routing.md`.
2. Inspect existing routing client/service modules.
3. Keep OSRM calls isolated in one client/service.
4. Choose the OSRM API intentionally: route, nearest, table, or trip.
5. Normalize distance, duration, geometry, waypoint order, and route metadata.
6. Add timeout and error handling for OSRM failures.
7. Avoid persisting partial route state without a transaction or recovery strategy.
8. Add tests with mocked OSRM success, failure, timeout, and malformed response cases.
9. Run the configured test command.
10. Summarize route behavior, failure handling, and test evidence.

## Guardrails

- Do not let unit tests depend on a live OSRM server.
- Do not silently fall back to straight-line distance without making that behavior explicit.
- Do not persist optimized stop order before validating domain constraints.

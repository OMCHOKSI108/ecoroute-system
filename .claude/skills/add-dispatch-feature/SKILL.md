---
name: add-dispatch-feature
description: Use when adding or changing EcoRoute dispatch, assignment, pickup, vehicle, or route-state logic.
---

# Add Dispatch Feature

Use this workflow when adding or changing dispatch logic.

## Steps

1. Read `docs/project.md` and `.claude/rules/dispatch-routing.md`.
2. Inspect current pickup, vehicle, route, assignment, dispatch, repository, and migration modules before editing.
3. Identify the current state model for pickups, vehicles, assignments, and routes.
4. Plan transaction boundaries before persistence changes.
5. Implement capacity-aware assignment logic.
6. Prevent duplicate assignment with application checks plus database constraints or locks where possible.
7. Keep OSRM route generation separate from assignment persistence unless wrapped in a clear transaction/recovery strategy.
8. Add or update tests for capacity limits, duplicate assignment prevention, state transitions, and failure paths.
9. Run the configured test command.
10. Summarize changed dispatch behavior, test evidence, and remaining risks.

## Guardrails

- Do not call OSRM directly from controllers.
- Do not update pickup status, vehicle load, and route state in unrelated transactions.
- Do not skip tests for full-capacity or already-assigned pickups.

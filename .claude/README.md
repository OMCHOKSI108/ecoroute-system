# EcoRoute Engine Claude Code Setup

This folder gives Claude Code project-specific guidance for building EcoRoute Engine, a geospatial fleet routing and dispatch backend for recycling and waste logistics.

## Folders

- `CLAUDE.md`: short project guide Claude should read first.
- `rules/`: path-scoped rules for backend, PostGIS, dispatch/routing, security, tests, and deployment.
- `agents/`: focused read-only reviewers for architecture, dispatch logic, PostGIS, API security, and tests.
- `skills/`: repeatable workflows for common EcoRoute development tasks.
- `hooks/`: safe local hooks for dangerous-command gating and optional formatting.
- `settings.json`: conservative Claude Code hook wiring.
- `.mcp.json`: minimal MCP placeholders for filesystem, Postgres/PostGIS, GitHub, and browser search.

## How Claude Should Use This

Claude should read `CLAUDE.md` first, then read the relevant rule files before editing important areas. For example, dispatch changes should use `rules/dispatch-routing.md`; spatial query changes should use `rules/database-postgis.md`; protected endpoints should use `rules/api-security.md`.

Reviewer agents should be used before PRs or after meaningful changes. They are intentionally narrow and read-only so they focus on risks instead of broad refactors.

## How You Can Use This

Ask Claude Code to use the relevant skill by name:

- "Use the add-dispatch-feature skill to implement capacity-aware dispatch."
- "Use the add-postgis-query skill to add nearby pickup search."
- "Use the add-osrm-route-flow skill to integrate OSRM route geometry."
- "Use the add-api-endpoint skill to add pickup request creation."
- "Use the add-test-suite skill for dispatch status transitions."
- "Use the claude-pr-checklist skill before committing."

## Notes

The current repository has `docs/project.md` and a minimal `backend/package.json`; no backend source folders were detected yet. The rules describe the intended structure clearly but tell Claude to inspect actual paths before editing.

Claude Code hook schemas can vary by version. If hooks do not run in your local Claude Code version, keep the scripts and adjust `settings.json` to the schema expected by your installed version.

The MCP config uses environment variable placeholders only. Do not commit real credentials.

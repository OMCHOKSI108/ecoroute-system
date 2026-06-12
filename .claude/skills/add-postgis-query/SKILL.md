---
name: add-postgis-query
description: Use when adding nearby search, radius search, clustering, service-area validation, or other spatial queries.
---

# Add PostGIS Query

Use this workflow for location search and spatial behavior.

## Steps

1. Read `docs/project.md` and `.claude/rules/database-postgis.md`.
2. Inspect schema, migrations, repositories, and existing query helpers.
3. Confirm coordinate type, SRID, and coordinate order.
4. Use parameterized SQL, ORM-safe query APIs, or query-builder bindings.
5. Add or verify a spatial index for the query path.
6. Enforce organization/service-area scope in the query.
7. Add tests or documented manual verification with representative coordinates.
8. Include example query usage in API docs or implementation notes when helpful.

## Guardrails

- Do not swap latitude and longitude.
- Do not introduce unsafe raw SQL.
- Do not add production-scale radius search without an index strategy.

---
name: database-postgis
description: Database, migration, repository, SQL, and PostGIS rules.
globs:
  - "backend/db/**/*"
  - "backend/database/**/*"
  - "backend/repositories/**/*"
  - "backend/migrations/**/*"
  - "backend/prisma/**/*"
  - "backend/schema/**/*"
  - "backend/**/*.sql"
  - "backend/**/schema.prisma"
---

# Database And PostGIS Rules

- Use PostgreSQL with PostGIS for pickup locations, service areas, nearby search, radius search, clustering, and nearest-neighbor lookup.
- Choose `geography` or `geometry` deliberately and use it consistently for comparable columns and queries.
- Use SRID 4326 for latitude/longitude unless the project documents another standard.
- Store coordinates in a clear order; PostGIS point construction usually expects longitude, latitude.
- Add spatial indexes such as GiST/SP-GiST for location queries.
- Add foreign keys, unique constraints, check constraints, and state constraints to protect dispatch integrity.
- Use transactions for pickup assignment, vehicle capacity changes, route state changes, and audit writes.
- Parameterize raw SQL or use the ORM/query builder's safe parameter APIs.
- Keep migrations reversible when the selected migration tool supports it.

## Mistakes To Avoid

- Swapping latitude and longitude.
- Running distance queries without a spatial index on production-scale tables.
- Using unsafe string interpolation in SQL.
- Relying only on application checks to prevent duplicate assignment.
- Mixing geometry/geography types without explicit conversion and reason.

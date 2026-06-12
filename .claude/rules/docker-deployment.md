---
name: docker-deployment
description: Docker, compose, deployment, environment, and local reproducibility rules.
globs:
  - "Dockerfile"
  - "**/Dockerfile"
  - "docker-compose*.yml"
  - "docker-compose*.yaml"
  - ".env.example"
  - "**/.env.example"
  - "deploy/**/*"
  - "deployment/**/*"
  - "infra/**/*"
---

# Docker And Deployment Rules

- Local development should be reproducible with documented commands.
- Include a PostgreSQL/PostGIS service when Docker Compose is introduced.
- Include an OSRM service placeholder or documented external OSRM URL when route generation is implemented.
- Add health checks for backend, database, and OSRM services where possible.
- Use environment variable placeholders in examples; do not commit real secrets.
- Keep production credentials out of images, compose files, and logs.
- Prefer explicit image versions over unpinned `latest` for database and infrastructure services.

## Mistakes To Avoid

- Committing `.env` files with real credentials.
- Making app startup depend on services without readiness checks.
- Running migrations against production by default from local compose commands.
- Baking secrets into Docker images.
- Adding broad cleanup commands such as `docker system prune -a` to hooks or scripts.

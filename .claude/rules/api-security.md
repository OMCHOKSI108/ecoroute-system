---
name: api-security
description: Authentication, authorization, validation, middleware, user, organization, and route security rules.
globs:
  - "backend/**/*auth*"
  - "backend/**/*user*"
  - "backend/**/*organization*"
  - "backend/**/*role*"
  - "backend/**/*middleware*"
  - "backend/routes/**/*"
  - "backend/controllers/**/*"
  - "backend/**/*.js"
  - "backend/**/*.ts"
---

# API Security Rules

- Require JWT authentication for protected APIs.
- Enforce RBAC for admin, dispatcher, driver, and organization-scoped flows.
- Validate all path params, query params, and request bodies.
- Rate-limit sensitive endpoints such as login, token refresh, dispatch creation, and bulk imports.
- Use environment variables for secrets, tokens, database URLs, and third-party endpoints.
- Never log secrets, passwords, tokens, raw authorization headers, or credential-bearing URLs.
- Scope organization data using authenticated context, not caller-supplied body fields.
- Return authorization failures without revealing whether another organization's resource exists.

## Mistakes To Avoid

- Adding public write endpoints by default.
- Trusting client-provided role, user, driver, or organization values.
- Reusing JWT secrets across local, test, and production environments.
- Returning full database records with password hashes or internal audit fields.
- Logging complete request bodies on auth or dispatch endpoints.

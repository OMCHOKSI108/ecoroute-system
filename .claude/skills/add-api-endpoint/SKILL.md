---
name: add-api-endpoint
description: Use when adding a new EcoRoute API endpoint or changing an existing route/controller.
---

# Add API Endpoint

Use this workflow for new or changed HTTP APIs.

## Steps

1. Read `.claude/rules/backend.md` and `.claude/rules/api-security.md`.
2. Identify the route, controller, service, validation, auth/RBAC, and repository layers used by the current stack.
3. Define request params, query params, body schema, and response shape.
4. Validate input before service calls.
5. Enforce JWT auth and RBAC for protected flows.
6. Keep the controller thin and move business logic to services.
7. Add tests for success, validation failure, unauthorized, forbidden, and relevant domain failures.
8. Update API docs if present.
9. Run the configured test command.
10. Summarize endpoint behavior and security checks.

## Guardrails

- Do not add public write endpoints by default.
- Do not trust organization, role, user, or driver IDs from the body when auth context should provide them.
- Do not return sensitive internal fields.

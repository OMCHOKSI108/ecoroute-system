---
name: add-test-suite
description: Use when adding tests for new or existing EcoRoute Engine behavior.
---

# Add Test Suite

Use this workflow to add focused tests.

## Steps

1. Read `.claude/rules/tests.md`.
2. Identify the behavior to test and the public boundary to exercise.
3. Prefer unit tests with fakes for OSRM and other external services.
4. Add integration tests only when database behavior, constraints, transactions, or PostGIS queries matter.
5. Cover success, failure, edge, permission, and state-transition cases.
6. Keep fixtures minimal and organization-scoped.
7. Ensure the configured test command runs the new tests.
8. Run tests and summarize coverage plus remaining gaps.

## Guardrails

- Do not require live OSRM or external network in unit tests.
- Do not mutate shared development or production data.
- Do not leave the package test script as the default failing placeholder once tests exist.

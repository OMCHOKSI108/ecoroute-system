---
name: claude-pr-checklist
description: Use before opening a PR or asking Claude Code to review readiness.
---

# Claude PR Checklist

Use this workflow before opening a PR.

## Steps

1. Run formatting if configured.
2. Run linting if configured.
3. Run tests.
4. Inspect the git diff.
5. Invoke relevant reviewer agents for changed areas.
6. Verify `docs/project.md`, README, API docs, or environment examples are updated if behavior changed.
7. Produce a PR summary with behavior changes, test evidence, risks, and follow-up notes.

## Guardrails

- Do not ignore a failing test command unless the failure is the known default placeholder and no tests exist yet.
- Do not include unrelated refactors in the PR summary as if they were required.
- Do not claim reviewer agents passed unless they were actually used.

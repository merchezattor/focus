---
name: run-gates
description: Run the merge gates before committing, pushing, or opening a PR (/commit-push-pr) in Focus. Use when a change is ready to ship.
---

# Run the gates

CI runs these same gates on every PR and on `main`. Run them locally first. The gates are done when every step below meets its criterion.

1. `pnpm lint`. Done when it exits 0.
2. `pnpm typecheck`. Done when it exits 0.
3. `pnpm test`. Done when it exits 0.
4. Changed anything under `apps/web/src/routes/`? Run `pnpm --filter @focus/web build`, then `git diff --exit-code apps/web/src/routeTree.gen.ts`. Done when the diff is empty: commit the regenerated tree with the route change.

A red gate gets fixed at its cause before you ship. Pre-commit already runs Biome on staged files, so the slow gates (typecheck, test) are the ones this skill exists for.

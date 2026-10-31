# 0002. Reliability gates: CI, pre-commit, and agent hooks

## Status

Accepted, 2026-10-31.

## Context

Focus has no automated gate between a change and `main`. The only workflow is `.github/workflows/jules-weekly-scanner.yml`, which is a scheduled scanner and not a check. `pnpm lint` (Biome), `pnpm typecheck`, and `pnpm test` (Vitest in `packages/core`, `apps/api`, `apps/web`) exist as scripts, but nothing runs them. There is no pre-commit hook. Playwright e2e exists (`pnpm test:e2e`) and is out of scope here.

The agent setup has problems of its own:

- `.claude/settings.json` has SessionStart and PostToolUse hooks that call `code-review-graph` with the hardcoded path `/Users/mikhailukhin/Documents/repos/focus`. They do nothing on any other machine. `.mcp.json` hardcodes the same path as `cwd`.
- Nothing stops an agent from running `git push --force`, `git reset --hard`, `git clean -fd`, `git branch -D`, or discarding the whole working tree.
- The four skills in `.claude/skills/` (debug-issue, explore-codebase, review-changes, refactor-safely) are named `skill.md`, not `SKILL.md`, and only describe code-review-graph tools. They did not load in a Linux session.

Two facts about the repo shape the decision:

- `apps/web/src/main.tsx` imports `./routeTree.gen`, but that file is gitignored. A clean checkout cannot pass `pnpm typecheck`. The TanStack Router FAQ answers "Should I commit my routeTree.gen.ts?" with "Yes".
- The only Node version in the repo is the Dockerfile's `ARG NODE_VERSION=24.13.0-slim`. Unit tests mock the database, so CI needs no Postgres.

## Decision

1. **CI.** Add `.github/workflows/ci.yml`, triggered on `pull_request` and on `push` to `main`. It has one job, `ci`, with `permissions: contents: read` and a `concurrency` group that cancels superseded runs. Steps, in order: `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, then `pnpm --filter @focus/web build` followed by `git diff --exit-code apps/web/src/routeTree.gen.ts`. The Jules workflow is not touched.
2. **Route tree is committed.** Remove `routeTree.gen.ts` from `.gitignore`, generate and commit it, and add `!**/routeTree.gen.ts` to the Biome `files.includes` list so Biome does not reformat it. The CI diff step fails a PR that changes routes without committing the regenerated tree.
3. **Node pin.** Add `.nvmrc` containing `24.13.0`. CI uses `actions/setup-node` with `node-version-file: .nvmrc` and `cache: pnpm`, and `pnpm/action-setup` (which reads `packageManager`). Add a Dockerfile comment saying `NODE_VERSION` must match `.nvmrc`.
4. **Pre-commit with Lefthook.** Add the `lefthook` devDependency, a `prepare` script that installs the hooks, and a `lefthook.yml` whose `pre-commit` runs `pnpm exec biome check --write --no-errors-on-unmatched --files-ignore-unknown=true {staged_files}` with `stage_fixed: true`. This is the config from Biome's git-hooks recipe. Pre-commit does not run typecheck, Vitest, or Playwright. The `prepare` script must not fail when there is no `.git` directory, because the Dockerfile's `pnpm install` runs without one.
5. **Two Claude Code hooks, project scope only.**
   - PreToolUse on Bash runs `.claude/hooks/block-dangerous-git.sh` (needs `jq`). It exits 2 with a reason for: force-push (`--force`, `-f`, `--force-with-lease`, `+refspec`), `reset --hard`, `clean -f`/`-fd`, `branch -D`, and `checkout .`/`restore .` of the whole tree. A plain `git push` is allowed, so `/commit-push-pr` on a feature branch keeps working.
   - PostToolUse on Edit|Write runs `biome check --write` on the edited file only. If errors remain, it exits 2 with Biome's output so the agent sees them.
   - There is no Stop hook. Pre-commit and CI already run the gates, and a Stop hook that runs typecheck is slow and can loop.
6. **code-review-graph becomes optional.** Delete both hooks from `.claude/settings.json` and drop `cwd` from `.mcp.json`. `.claude/settings.local.json` already disables the MCP for people who don't use it. The four `skill.md` skills are left as they are. See Consequences.
7. **Skills.** Recommend, and do not install in this change:
   - Add a project-written `.claude/skills/run-gates/SKILL.md`, authored with the plugin's `writing-for-agents` skill. It tells the agent to run `pnpm lint`, `pnpm typecheck`, and `pnpm test` before `/commit-push-pr`, and to regenerate `routeTree.gen.ts` when routes change.
   - Add Microsoft's official `playwright-cli` skill (`microsoft/playwright-cli`, `skills/playwright-cli/SKILL.md`) together with the Playwright e2e follow-up, not before.
8. **Branch protection is a human step.** Once `ci` has run green on `main`, a maintainer creates a GitHub ruleset on `main` that requires the `ci` status check. The implementing agent does not apply it.

## Consequences

- Every PR and every push to `main` runs lint, typecheck, and unit tests. A broken `main` is caught within one CI run.
- Committing `routeTree.gen.ts` adds a generated file to diffs. Route changes need the regenerated tree in the same PR, and CI enforces that.
- Pre-commit is fast because it only touches staged files. It can miss type errors and test failures, which CI catches. A partially staged file is handled by Lefthook's stash and `stage_fixed`, so the commit and the working tree can differ after Biome rewrites a file.
- Agents can still push normally, and they can no longer force-push or discard the whole tree. The guardrail is a pattern match on the command string, so it is a safety net and not a security boundary.
- The four graph skills stay broken on Linux (lowercase `skill.md`, and they need the code-review-graph MCP). This is a known gap, left for later work.
- Playwright e2e is not a required check yet. A UI regression that only e2e would catch can merge.
- `.nvmrc` and the Dockerfile `NODE_VERSION` can drift. The comment and review are the only guard.

- `main` had 31 Biome errors, so `ci` would have failed at the lint step on its first run. This change clears them: `biome check --write` fixed import order and formatting, and four errors were fixed by hand with no behaviour change (three in `apps/web/src/components/niko-table`, one component renamed from `Map` to `MapPage` in `apps/web/src/routes/_main/map.tsx`). No directory is excluded from Biome. 45 warnings remain, including global `isNaN` calls in `niko-table`; those are left because `Number.isNaN` does not coerce its argument, so the rewrite is not mechanical.
- `packages/core` had no `typescript` devDependency, so `pnpm typecheck` could not pass on a clean install. This change adds `typescript@^5` to it. Core then typechecks clean.

## Alternatives rejected

- **Husky + lint-staged**: two devDependencies where Lefthook needs one, and lint-staged adds nothing Lefthook's `{staged_files}` doesn't do.
- **mattpocock `setup-pre-commit`**: installs Prettier, which conflicts with Biome as the only formatter, and runs the full typecheck and test suite on every commit. Replaced by Lefthook + Biome.
- **mattpocock `git-guardrails-claude-code` as written**: its pattern list includes `git push`, which would block `/commit-push-pr`. Its idea is kept, with plain push allowed.
- **Generate the route tree in CI** (`@tanstack/router-cli`, gitignored file): leaves local `pnpm typecheck` broken on a fresh clone, and adds a dependency.
- **Three parallel CI jobs**: clearer red/green per gate, but three installs and three required-check names.
- **Stop hook running lint and typecheck**: slow, with loop risk, and duplicates pre-commit and CI.
- **Remove code-review-graph entirely**: takes the tool away from anyone using it. Making it optional costs less.
- **anthropics `webapp-testing`**: Python Playwright scripts, and this repo's e2e is TypeScript.
- **anthropics `skill-creator`**: `writing-for-agents` already covers authoring skills here.
- **Vendoring the mattpocock catalog into the repo**: the plugin installs automatically.
- **Community Playwright skills** (for example `lackeyjb/playwright-skill`): not first-party. Microsoft's skill is.

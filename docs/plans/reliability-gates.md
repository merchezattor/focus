# Plan: reliability gates

Decision record: `docs/adr/0002-reliability-gates.md`. This file is the order of work. Nothing here is implemented yet.

## Goal

Every change to `main` passes Biome, typecheck, and unit tests. Agents can't force-push or wipe the working tree. Commits are formatted before they land.

## Steps

Do them in this order. Each step is a good commit boundary.

1. **Route tree and Node pin**
   - Generate `apps/web/src/routeTree.gen.ts` (run `pnpm --filter @focus/web build`) and commit it.
   - Remove it from `.gitignore`. Add `!**/routeTree.gen.ts` to `biome.json` `files.includes`.
   - Add `.nvmrc` with `24.13.0`. Add a comment above `ARG NODE_VERSION` in `Dockerfile`: keep in sync with `.nvmrc`.
   - Check: on a fresh clone, `pnpm install && pnpm typecheck` passes.

2. **CI** (`.github/workflows/ci.yml`)
   - Triggers: `pull_request`, and `push` to `main`. One job, `ci`. `permissions: contents: read`. `concurrency` cancels superseded runs.
   - Steps: checkout, `pnpm/action-setup`, `actions/setup-node` (`node-version-file: .nvmrc`, `cache: pnpm`), `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm --filter @focus/web build`, `git diff --exit-code apps/web/src/routeTree.gen.ts`.
   - Leave `jules-weekly-scanner.yml` alone.
   - Check: open a PR and confirm `ci` runs green. Then push a stale route tree on a throwaway branch and confirm it goes red.

3. **Pre-commit (Lefthook)**
   - Add `lefthook` as a devDependency. Add a `prepare` script that runs `lefthook install` and does not fail when there's no `.git` (the Dockerfile `pnpm install` has none).
   - `lefthook.yml`: `pre-commit` → `biome check --write --no-errors-on-unmatched --files-ignore-unknown=true {staged_files}`, `stage_fixed: true`, glob `*.{js,ts,cjs,mjs,d.cts,d.mts,jsx,tsx,json,jsonc,css}`.
   - No Prettier, lint-staged, Vitest, or Playwright.
   - Check: stage a badly formatted file and commit. It gets fixed and committed. Then run `docker build --target api .` and confirm the install stage still passes.

4. **Agent hooks** (`.claude/settings.json`, project scope)
   - Add `.claude/hooks/block-dangerous-git.sh` (PreToolUse, Bash). Block: `--force`, `-f`, `--force-with-lease`, `+refspec` on push; `reset --hard`; `clean -f*`; `branch -D`; `checkout .`; `restore .`. Allow plain `git push`. Exit 2 with a reason.
   - Add a PostToolUse hook (Edit|Write) that runs Biome on `tool_input.file_path` only and exits 2 with the output if errors remain.
   - Delete the two code-review-graph hooks. Drop `cwd` from `.mcp.json`.
   - Check: feed the guardrail sample commands (a table of allowed and blocked ones) and confirm exit codes. Confirm `git push origin <branch>` is allowed.

5. **Skills**
   - Write `.claude/skills/run-gates/SKILL.md` using `writing-for-agents`: run `pnpm lint`, `pnpm typecheck`, `pnpm test` before `/commit-push-pr`, and regenerate the route tree when routes change.
   - Do not install anything else. See the recommendation below.

6. **Human step: branch protection.** After `ci` has run green on `main`, create a GitHub ruleset on `main` that requires the `ci` check. Not done by the agent.

## Skills recommendation

| Skill | Source | Verdict | Why |
|---|---|---|---|
| `run-gates` | written in this repo | Add (step 5) | States the gates once, so the agent runs them before opening a PR |
| `playwright-cli` | `microsoft/playwright-cli`, `skills/playwright-cli/SKILL.md` | Add with the e2e follow-up | First-party, and fits the TypeScript Playwright setup, but e2e is not in this change |
| `webapp-testing` | `anthropics/skills` | Reject | Python Playwright, and this repo uses TS |
| `skill-creator` | `anthropics/skills` | Reject | `writing-for-agents` covers it |
| `setup-pre-commit` | `mattpocock/skills` | Reject as written | Installs Prettier and runs the full suite on every commit. Replaced by Lefthook + Biome |
| `git-guardrails-claude-code` | `mattpocock/skills` | Adapt into a hook, don't install | Blocks every `git push`, which breaks `/commit-push-pr` |
| mattpocock catalog | `mattpocock/skills` | Don't vendor | The plugin auto-installs |
| community Playwright skills | various | Reject | Not first-party |

## Known gaps (left for later)

- Playwright e2e is not a required check.
- The four `.claude/skills/*/skill.md` graph skills use a lowercase filename and need the code-review-graph MCP, so they don't load on Linux.
- `.nvmrc` and the Dockerfile `NODE_VERSION` can drift.

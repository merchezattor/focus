## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues for merchezattor/focus, using the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary: needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Code review

Used by the Claude PR review workflow (`.github/workflows/claude-review.yml`). Flag these as [P1] or higher:

- **Floating runtime deps.** Every runtime dependency of `apps/api` and `packages/core` must be pinned to an exact version (no `^`/`~`) and mirrored in the root `pnpm.overrides`. The API image is built with `pnpm --prod deploy`, which ignores `pnpm-lock.yaml`, so a range can silently float on rebuild. See `docs/deployment.md`.
- **Auth/schema drift.** `better-auth` is pinned to match the DB schema; any version bump must come with a matching migration.
- **Schema changes without migrations.** A change under `packages/core/src/db` that alters the schema needs a generated migration in `packages/core/drizzle`.
- **Authorization gaps.** API routes in `apps/api/src/routes` must scope reads and writes to the authenticated user; flag any query that can return or modify another user's data.
- **Domain terms.** New code should use the vocabulary in `GLOSSARY.md` and respect decisions in `docs/adr/`.

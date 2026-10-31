# Plan: MCP honest task reads

Decision record: `docs/adr/0003-mcp-honest-task-reads.md`. This file is the order of work. Nothing here is implemented yet.

## Goal

An agent can list every task status, knows when a page is not the whole result, can continue past 100, and does not pay for comment bodies in lists.

## Steps

Each step is a good commit boundary. Write the test first.

1. **`searchTasks`** (`packages/core/src/lib/storage.ts`)
   - Accept all six statuses. Treat `"all"` as no status condition. Keep the no-status default (hides cold and archived).
   - Add `offset`. Add `id` as the final sort key.
   - Add a count of matches using the same conditions, without limit and offset. Return it with the tasks, keeping the current return shape for existing callers.
   - Add `comments: "full" | "count"`, default `"full"`. In count mode, run one grouped COUNT over the matched task ids and set `commentCount`, with no `comments`.
   - Check: `apps/api/src/routes/tasks.ts` behaves the same.

2. **List tools** (`packages/core/src/lib/mcp/tools/tasks.ts`)
   - `listTasksSchema` and `listInboxSchema`: widen `status` to `"all" | Status[]`, add `offset`.
   - Handlers pass `comments: "count"` and return `page: {total, offset, limit, hasMore}`.
   - Update descriptions as listed in the ADR, including the create default (cold) and complete = done.

3. **list_actions** (`packages/core/src/lib/mcp/tools/actions.ts`)
   - Add `includeOwn` and `isRead` to the schema and pass them to `getActions`. Update the description.

4. **Tests** (`packages/core/src/lib/mcp/tools/__tests__/`)
   - `status: "all"` returns review, cold and archived tasks.
   - Page two with no overlap or gaps when tasks tie on priority and created_at.
   - `hasMore` is false on the last page, true otherwise. `total` ignores limit and offset.
   - Listed tasks have `commentCount` and no `comments`. `focus_get_task` still returns comments.
   - `includeOwn: true` returns the owner's own user actions. The default does not.

5. Run `/run-gates` before committing.

## Out of scope

See the ADR.

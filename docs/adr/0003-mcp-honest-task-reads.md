# 0003. MCP task reads are complete, honest and cheap

## Status

Accepted, 2026-10-31.

## Context

An agent reading tasks through Focus MCP (`packages/core/src/lib/mcp/tools/tasks.ts`, `actions.ts`, and `searchTasks` in `packages/core/src/lib/storage.ts`) gets results that look complete when they are not.

- A task has six stored statuses: todo, in_progress, review, done, cold, archived. The list `status` filter accepts only todo, in_progress, done and cold, so Review cannot be requested. With no status, `searchTasks` hides cold and archived. No single call returns every status.
- `focus_list_tasks` and `focus_list_inbox` default to 10 results, with a schema max of 100. The response is `{success, data}` with no total and no hasMore, so a short page looks complete. Ordering is priority then created_at, which is not unique, so tied tasks can move between pages.
- Every listed task embeds all of its comment bodies.
- `focus_create_task` defaults status to cold, but its description says todo.
- `focus_list_actions` calls `getActions` without `includeOwn`. The default is false, which hides the owner's own user actions. `isRead` exists on `getActions` and is not exposed.

`searchTasks` is also called by `apps/api/src/routes/tasks.ts`, so its defaults must not change for the web app.

## Decision

1. **Status filter.** On `focus_list_tasks` and `focus_list_inbox`, `status` is `"all"` or an array of any stored status. `"all"` means all six, archived included. With no status, the Default listing is unchanged and hides cold and archived.
2. **Pagination.** Add `offset` (default 0). `limit` keeps default 10 and max 100. Sort by priority, created_at descending, then id, so pages do not overlap or skip.
3. **Envelope.** `{success, data: Task[], page: {total, offset, limit, hasMore}}`. `data` stays an array. `total` counts matches using the same filters, ignoring limit and offset. `hasMore = offset + data.length < total`.
4. **Comments.** `searchTasks` takes `comments: "full" | "count"`, default `"full"`, so the API is unchanged. The two MCP list tools pass `"count"`, using a grouped COUNT query. Each listed task has `commentCount: number` and no `comments` key. `focus_get_task` still returns full comments.
5. **list_actions.** Expose `includeOwn` (default false) and `isRead`, passed straight to `getActions`. Defaults do not change.
6. **Descriptions.** Tool descriptions state the traps that remain:
   - the Default listing hides cold and archived; use `status: "all"` for everything
   - `focus_create_task` defaults to cold
   - completing a task means status done
   - `focus_list_actions` hides the owner's own user actions unless `includeOwn: true`
   - lists return `commentCount`; use `focus_get_task` for comment bodies
   - check `page.hasMore` and continue with `offset`

## Consequences

- Existing callers keep working: `data` is still an array, the default listing and `searchTasks` defaults are unchanged.
- `focus_list_tasks` runs one extra COUNT query per call.
- Offset paging can still shift if tasks change between calls. This is accepted for a single user's task list.
- Task status words are added to `GLOSSARY.md`.

## Alternatives rejected

- Change the default listing to return every status: breaks current callers.
- Opaque keyset cursor: more work than one person's task list needs.
- Nest results as `data: {tasks, total, hasMore}`: breaks current readers.
- Strip comments in the MCP layer: bodies are still loaded.
- Default `includeOwn` to true: changes behaviour silently.

## Out of scope

Mark-read ownership, comment ownership, silent update/delete success, re-parenting projects, search-in-comments, and the list tools for projects, goals and milestones.

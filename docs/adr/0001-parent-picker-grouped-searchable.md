# 0001. Parent picker is a searchable, grouped combobox

## Status

Accepted, 2026-10-31.

## Context

The Parent field on Add/Edit Project (`apps/web/src/components/features/projects/AddProjectDialog.tsx`, also used by `GlobalAddProjectDialog` and `GlobalEditProjectDialog`) is a plain Select with two flat sections, Goals and Projects. It only hides the project being edited. It is hard to scan with many projects, and nothing stops a user from choosing one of the project's own Descendants as its Parent, which creates a cycle. Neither the API (`apps/api/src/routes/projects.ts`) nor storage (`packages/core/src/lib/storage.ts`) checks for cycles.

The create-task dropdown (`TaskProjectSelectItems`) already groups by status, but it hides groups, and groups are valid Parents here.

## Decision

1. The Parent field becomes a searchable combobox built from the existing `command.tsx` and `popover.tsx`. Typing filters the list.
2. Sections, in this order: No Parent, Goals, Groups, Working projects, Frozen projects, Complete, Archived. Each section is sorted by name. An empty section is left out.
3. Every group goes in Groups, whatever its status. The four status sections hold only `kind = project`. Each item appears in exactly one section.
4. Nothing is hidden because of status or kind.
5. Cycle prevention: the project being edited and all of its Descendants are hidden from the picker. This is client-side only.
6. The value encoding stays `none` / `goal:<uuid>` / `project:<uuid>`. Parent stays exclusive: a Goal or a project, never both.
7. The current Parent is shown in the trigger when the dialog opens, even when it sits in a lower section.
8. Scope is this field only. No change to the create-task dropdown, the map, the API, or the schema.

## Consequences

- `TaskProjectSelectItems` is not reused, because it hides groups.
- The API still accepts cycles from other callers (MCP tools, direct API calls). This is a known gap, left for later work.
- Section labels use the app's words: Working, Frozen, Complete, Archived. See `GLOSSARY.md`.

## Alternatives rejected

- Reuse `TaskProjectSelectItems`: it hides groups.
- Hide non-working projects or groups: they are valid Parents.
- Server-side cycle check: out of scope for this change.

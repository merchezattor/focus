# 0004. Projects page uses the backlog table

## Status

Accepted, 2026-10-31.

## Context

The Projects page (`apps/web/src/components/features/projects/ProjectsPageClient.tsx`, `ProjectList.tsx`, `ProjectItem.tsx`) lists projects in sections titled Working, Frozen, Complete and Archived, with a trailing Groups section. Items with `kind = group` are left out of the status sections. Each row shows a color dot, name, a priority flag when not p4, a favorite star, the description on one line, a view type badge and an edit pencil. The page is wrapped in `max-w-4xl`.

The backlog (`apps/web/src/components/features/tasks/BacklogTable.tsx`) uses the niko DataTable: search, view menu, faceted filters, sort, filter menu and pagination. It hides the description behind the expand chevron. The two pages look and behave differently for the same kind of list.

## Decision

1. The Projects page renders one niko DataTable built like `BacklogTable`. The status sections and the trailing Groups section go away.
2. Projects and Groups are rows in the same table. Kind is a column and a filter. Status is a column and a filter. Every status shows by default, Archived included.
3. Columns, in order: Expand, Name, Kind, Status, Priority, Favorite, View type, Actions. There is no Parent column.
   - Expand uses `SYSTEM_COLUMN_IDS.EXPAND` with `meta.expandedContent`. It shows the description, or "No description". The description is no longer shown under the name.
   - Name shows the color dot and name. Clicking it navigates to `/?project=<id>`.
   - Priority is a P1 to P4 badge on every row, like the backlog.
   - Favorite shows the star.
   - Actions is a menu with Open and Edit. Edit sets `projectToEditAtom`. No task actions (To work, For Today, Archive, Delete) are added.
4. Default sort is Status, then Name. Status sorts by rank: Working, Frozen, Complete, Archived. It never sorts alphabetically, which would put Archived first. Groups mix in with Projects by their own status.
5. Archived rows are not dimmed. The Status column and filter show it.
6. The toolbar copies `BacklogTable`: a "Search projects..." search on Name, the view menu, faceted filters for Status, Kind and Priority (none pre-selected), the sort menu and the filter menu.
7. The "All Projects" heading and the Add Project button stay above the table. With zero Projects and Groups, the existing "No projects yet" card replaces the table. When filters or search match nothing, the table shows its own empty row.
8. The `max-w-4xl` wrapper is dropped so the table has the same width as the backlog.
9. Files: add `ProjectsTable.tsx` and `__tests__/ProjectsTable.test.tsx`. Delete `ProjectList.tsx`, `ProjectItem.tsx` and `__tests__/ProjectList.test.tsx`. The empty card moves into `ProjectsPageClient`.
10. Scope is the Projects page only. No change to the Goals page, the `BacklogTable` behavior, MCP or the data model.

## Consequences

- The page no longer separates Groups from Projects. Use the Kind filter to see one or the other.
- Status needs a custom rank sorting function, because the stored values do not sort in the wanted order.
- The tests no longer require Working or Groups headings. They check rows, navigation, edit, expand and default order.
- The priority flag for non-p4 rows becomes a badge on every row, so p4 rows now show "P4".
- ADR 0001 is unaffected. It covers the Parent picker only.

## Alternatives rejected

- Keep the status sections: this is the behavior being replaced.
- Keep Groups as a trailing section: Kind is a column, so Groups are ordinary rows.
- Dim Archived rows: the backlog has no per-row dimming, and the Status column and filter already show it.
- Add a Parent column: the current page does not show Parent.
- Share a column factory with `BacklogTable`: the columns differ, and `BacklogTable` must not change.

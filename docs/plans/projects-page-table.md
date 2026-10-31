# Plan: Projects page uses the backlog table

Decision record: `docs/adr/0004-projects-page-uses-backlog-table.md`. Terms: `GLOSSARY.md`.

## Settled decisions

- One niko DataTable, built like `tasks/BacklogTable.tsx`. Projects and Groups are rows. Kind and Status are columns and filters. All statuses show by default, Archived included.
- Columns: Expand (description), Name (color dot, click opens `/?project=<id>`), Kind, Status, Priority (P1 to P4 badge on every row), Favorite, View type, Actions (Open, Edit). No Parent column.
- Default sort: Status by rank (Working, Frozen, Complete, Archived), then Name.
- No Archived dimming.
- Toolbar: "Search projects..." on Name, view menu, faceted Status, Kind and Priority filters, sort menu, filter menu.
- Keep the "All Projects" heading and Add Project button. Zero items shows the "No projects yet" card. No matches shows the table's empty row.
- Drop `max-w-4xl`.
- No task actions on projects. No change to Goals, `BacklogTable`, MCP or the data model.

## Files

- Add `apps/web/src/components/features/projects/ProjectsTable.tsx`.
- Add `apps/web/src/components/features/projects/__tests__/ProjectsTable.test.tsx`.
- Edit `ProjectsPageClient.tsx`: render the table, hold the empty card, drop `max-w-4xl`.
- Delete `ProjectList.tsx`, `ProjectItem.tsx` and `__tests__/ProjectList.test.tsx`.

## Verification

- `ProjectsTable.test.tsx` covers:
  - a Group and an Archived project render as rows
  - clicking Name pushes `/?project=<id>`
  - Edit sets `projectToEditAtom`
  - the description shows only after expanding the row
  - rows default to status-rank order
  - no test requires Working or Groups headings
- Run the repo gates (run-gates skill).
- Open `/projects` in the app next to the backlog and compare width, toolbar and expand behavior.

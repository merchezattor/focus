# Glossary

Shared vocabulary for Focus. Use these words in code, UI, and docs.

**Goal**
A top-level objective. It can be the Parent of a project or group. It has no status.

**Project**
An item with `kind = project`. It holds tasks and has a status.

**Group**
An item with `kind = group`. It organises projects and is a valid Parent. It has a status like any project.
_Avoid_: folder, category

**Parent**
The single thing a project or group sits under: one Goal, or one project or group, or nothing ("No Parent"). It is exclusive: never a Goal and a project at once.

**Descendant**
Any project or group reachable from a project by following its children down, at any depth. A project's Descendants can never be its Parent, because that would create a cycle.

**Working**
Status of a project that is in progress.
_Avoid_: active, In Progress

**Frozen**
Status of a project that is paused.

**Complete**
Status of a project that is finished.

**Archived**
Status of a project that is put away.
_Avoid_: Other (as a catch-all section name)

## Task statuses

These describe a task, not a project. A task is stored with exactly one of six statuses.

**Todo**
Status of a task that is ready to be worked on.

**In progress**
Status of a task being worked on now.

**Review**
Status of a task that is waiting to be checked. It can be set on create and update, and is listed with `status: "all"` or by name.

**Done**
Status of a task that is finished. "Complete a task" means set its status to Done.
_Avoid_: Complete (that is a project status)

**Cold**
Status of a task in the backlog. A task created through MCP without a status starts Cold. The Default listing hides it.

**Archived (task)**
Status of a task that is put away. The Default listing hides it.

**Default listing**
A task list call with no status filter. It hides Cold and Archived tasks. `status: "all"` is the one way to list every status.

**Page**
One response from a task list call: `{total, offset, limit, hasMore}`. `total` counts every matching task, ignoring limit and offset. `hasMore` is true when more tasks remain after this page.

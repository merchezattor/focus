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

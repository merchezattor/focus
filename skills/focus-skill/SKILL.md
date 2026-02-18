---
name: focus-skill 
description: MCP-enabled skill for Focus task management. Provides 16 tools for tasks, projects, goals, and activity tracking via Model Context Protocol.
---

# Focus MCP Skill

AI-native task management through Model Context Protocol (MCP).

**Protocol**: MCP 2024-11-05  
**Transport**: Streamable HTTP  
**Endpoint**: `POST /api/mcp`

---

## Shared Reference: Enums & Formats

These values are used across multiple tools. Refer back here when constructing arguments.

### Priority

Used by: tasks, goals.

| Value | Meaning |
|-------|---------|
| `"p1"` | High (red) |
| `"p2"` | Medium (orange) |
| `"p3"` | Low (blue) |
| `"p4"` | None / default (gray) |

### Task Status

Used by: `focus_list_tasks`, `focus_list_inbox`, `focus_create_task`, `focus_update_task`.

| Value | Meaning |
|-------|---------|
| `"todo"` | Not started |
| `"in_progress"` | Currently being worked on |
| `"review"` | Pending review |
| `"done"` | Completed |

> [!IMPORTANT]
> **Filter vs. Create/Update mismatch**: When **filtering** tasks (`focus_list_tasks`, `focus_list_inbox`), the `status` filter only accepts `["todo", "in_progress", "done"]`. The value `"review"` is **not valid** in filter queries. However, `"review"` **is valid** when creating or updating a task.

### Date Format

All dates must be **ISO 8601 UTC** strings with a `Z` suffix:
```
2026-02-20T17:00:00Z
```
Always convert to user's local timezone for display.

### Date Filter Keywords

Used by: `dueDate` and `planDate` in `focus_list_tasks` and `focus_list_inbox`.

| Value | Behavior |
|-------|----------|
| `"today"` | Tasks where the date falls within today (00:00–23:59 server time) |
| `"overdue"` | Tasks where the date is **before** today AND the task is **not completed** |
| `"upcoming"` | Tasks where the date is **after** today |
| Any ISO date string (e.g. `"2026-02-20"`) | Tasks on that exact calendar day (00:00–23:59) |

### Color

Hex color code matching the pattern `#RRGGBB`. Examples: `"#E44332"`, `"#4F46E5"`, `"#10B981"`.

### Actor Type

Used by: `focus_list_actions`.

| Value | Meaning |
|-------|---------|
| `"user"` | Actions performed by the human user |
| `"agent"` | Actions performed by an AI agent |

---

## Tools

### 1. `focus_list_tasks`

List and search tasks. All filters are optional and combined with AND logic. Within array filters (`priority`, `status`), values are OR'd.

**Arguments:**

| Field | Type | Required | Values / Format | Description |
|-------|------|----------|-----------------|-------------|
| `priority` | `string[]` | No | `["p1", "p2", "p3", "p4"]` | Filter by one or more priority levels |
| `status` | `string[]` | No | `["todo", "in_progress", "done"]` | Filter by one or more statuses. **`"review"` is NOT valid here** |
| `completed` | `boolean` | No | `true` or `false` | Filter by completion flag |
| `projectId` | `string` | No | UUID (e.g. `"a1b2c3d4-..."`) | Filter to a specific project |
| `dueDate` | `string` | No | `"today"`, `"overdue"`, `"upcoming"`, or ISO date | Filter by due date (see Date Filter Keywords) |
| `planDate` | `string` | No | `"today"`, `"overdue"`, `"upcoming"`, or ISO date | Filter by plan date (see Date Filter Keywords) |
| `search` | `string` | No | Any text | Case-insensitive search in task title and description |

**Example — High priority tasks due today that are not done:**
```json
{
  "name": "focus_list_tasks",
  "arguments": {
    "priority": ["p1", "p2"],
    "status": ["todo", "in_progress"],
    "dueDate": "today"
  }
}
```

**Example — Search for tasks containing "report":**
```json
{
  "name": "focus_list_tasks",
  "arguments": {
    "search": "report"
  }
}
```

**Example — Overdue tasks in a specific project:**
```json
{
  "name": "focus_list_tasks",
  "arguments": {
    "projectId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "dueDate": "overdue"
  }
}
```

---

### 2. `focus_list_inbox`

List tasks that have **no project** (inbox). Supports the same filters as `focus_list_tasks` except `projectId` (it's always null/inbox).

**Arguments:**

| Field | Type | Required | Values / Format | Description |
|-------|------|----------|-----------------|-------------|
| `priority` | `string[]` | No | `["p1", "p2", "p3", "p4"]` | Filter by priority |
| `status` | `string[]` | No | `["todo", "in_progress", "done"]` | Filter by status. **`"review"` is NOT valid here** |
| `completed` | `boolean` | No | `true` or `false` | Filter by completion flag |
| `dueDate` | `string` | No | `"today"`, `"overdue"`, `"upcoming"`, or ISO date | Filter by due date |
| `planDate` | `string` | No | `"today"`, `"overdue"`, `"upcoming"`, or ISO date | Filter by plan date |
| `search` | `string` | No | Any text | Case-insensitive search in title/description |

**Example — Inbox tasks that are high priority and not done:**
```json
{
  "name": "focus_list_inbox",
  "arguments": {
    "status": ["todo"],
    "priority": ["p1", "p2"]
  }
}
```

---

### 3. `focus_create_task`

Create a new task.

**Arguments:**

| Field | Type | Required | Values / Format | Description |
|-------|------|----------|-----------------|-------------|
| `title` | `string` | **Yes** | 1–200 characters | Task title |
| `priority` | `string` | **Yes** | `"p1"`, `"p2"`, `"p3"`, `"p4"` | Priority level |
| `description` | `string` | No | Max 1000 characters | Task description |
| `projectId` | `string` | No | UUID | Assign to a project. Omit for inbox |
| `dueDate` | `string` | No | ISO 8601 UTC (e.g. `"2026-02-20T17:00:00Z"`) | Deadline |
| `planDate` | `string` | No | ISO 8601 UTC | When you plan to work on it |
| `status` | `string` | No | `"todo"`, `"in_progress"`, `"review"`, `"done"` | Defaults to `"todo"` if omitted |

**Example:**
```json
{
  "name": "focus_create_task",
  "arguments": {
    "title": "Review quarterly report",
    "priority": "p1",
    "description": "Detailed review of Q1 financials needed",
    "dueDate": "2026-02-20T17:00:00Z",
    "planDate": "2026-02-19T09:00:00Z",
    "status": "todo"
  }
}
```

---

### 4. `focus_update_task`

Update an existing task by ID. Only include fields you want to change. Set a field to `null` to clear it.

**Arguments:**

| Field | Type | Required | Values / Format | Description |
|-------|------|----------|-----------------|-------------|
| `id` | `string` | **Yes** | UUID | The task ID to update |
| `title` | `string` | No | 1–200 characters | New title |
| `priority` | `string` | No | `"p1"`, `"p2"`, `"p3"`, `"p4"` | New priority |
| `description` | `string` | No | Max 1000 characters | New description |
| `completed` | `boolean` | No | `true` or `false` | Mark as completed/uncompleted |
| `status` | `string` | No | `"todo"`, `"in_progress"`, `"review"`, `"done"` | New status |
| `projectId` | `string \| null` | No | UUID or `null` | Move to project, or `null` to move to inbox |
| `dueDate` | `string \| null` | No | ISO 8601 UTC or `null` | Set/clear due date |
| `planDate` | `string \| null` | No | ISO 8601 UTC or `null` | Set/clear plan date |

**Example — Change priority and set due date:**
```json
{
  "name": "focus_update_task",
  "arguments": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "priority": "p1",
    "dueDate": "2026-03-01T12:00:00Z"
  }
}
```

**Example — Move task to inbox (clear project) and clear due date:**
```json
{
  "name": "focus_update_task",
  "arguments": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "projectId": null,
    "dueDate": null
  }
}
```

---

### 5. `focus_delete_task`

Delete a task by ID.

**Arguments:**

| Field | Type | Required | Values / Format | Description |
|-------|------|----------|-----------------|-------------|
| `id` | `string` | **Yes** | UUID | The task ID to delete |

**Example:**
```json
{
  "name": "focus_delete_task",
  "arguments": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

---

### 6. `focus_add_task_comment`

Add a comment to a task.

**Arguments:**

| Field | Type | Required | Values / Format | Description |
|-------|------|----------|-----------------|-------------|
| `taskId` | `string` | **Yes** | UUID | The task to comment on |
| `content` | `string` | **Yes** | Min 1 character | Comment text |

**Example:**
```json
{
  "name": "focus_add_task_comment",
  "arguments": {
    "taskId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "content": "Discussed with team — moving deadline to next Friday"
  }
}
```

---

### 7. `focus_list_projects`

List all projects. Takes no arguments.

**Arguments:** None.

**Example:**
```json
{
  "name": "focus_list_projects",
  "arguments": {}
}
```

---

### 8. `focus_create_project`

Create a new project.

**Arguments:**

| Field | Type | Required | Values / Format | Description |
|-------|------|----------|-----------------|-------------|
| `name` | `string` | **Yes** | 1–100 characters | Project name |
| `color` | `string` | **Yes** | Hex `#RRGGBB` (e.g. `"#E44332"`) | Project color |
| `description` | `string` | No | Any string | Project description |
| `isFavorite` | `boolean` | No | `true` or `false` | Pin as favorite. Defaults to `false` |
| `parentId` | `string` | No | UUID | ID of a parent goal or project |
| `parentType` | `string` | No | `"goal"` or `"project"` | Type of the parent entity. Required if `parentId` is set |
| `viewType` | `string` | No | `"list"` or `"board"` | Display mode. Defaults to `"list"` |

**Example:**
```json
{
  "name": "focus_create_project",
  "arguments": {
    "name": "Q1 Goals",
    "color": "#E44332",
    "isFavorite": true,
    "parentId": "goal-uuid-here",
    "parentType": "goal",
    "viewType": "board"
  }
}
```

---

### 9. `focus_update_project`

Update a project by ID. Only include fields you want to change.

**Arguments:**

| Field | Type | Required | Values / Format | Description |
|-------|------|----------|-----------------|-------------|
| `id` | `string` | **Yes** | UUID | Project ID to update |
| `name` | `string` | No | 1–100 characters | New name |
| `color` | `string` | No | Hex `#RRGGBB` | New color |
| `description` | `string` | No | Any string | New description |
| `isFavorite` | `boolean` | No | `true` or `false` | Pin/unpin as favorite |
| `viewType` | `string` | No | `"list"` or `"board"` | Change display mode |

**Example:**
```json
{
  "name": "focus_update_project",
  "arguments": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Q1 Goals — Updated",
    "color": "#10B981"
  }
}
```

---

### 10. `focus_delete_project`

Delete a project by ID.

**Arguments:**

| Field | Type | Required | Values / Format | Description |
|-------|------|----------|-----------------|-------------|
| `id` | `string` | **Yes** | UUID | Project ID to delete |

**Example:**
```json
{
  "name": "focus_delete_project",
  "arguments": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

---

### 11. `focus_list_goals`

List all goals. Takes no arguments.

**Arguments:** None.

**Example:**
```json
{
  "name": "focus_list_goals",
  "arguments": {}
}
```

---

### 12. `focus_create_goal`

Create a new goal.

**Arguments:**

| Field | Type | Required | Values / Format | Description |
|-------|------|----------|-----------------|-------------|
| `name` | `string` | **Yes** | 1–100 characters | Goal name |
| `priority` | `string` | **Yes** | `"p1"`, `"p2"`, `"p3"`, `"p4"` | Priority level |
| `color` | `string` | **Yes** | Hex `#RRGGBB` (e.g. `"#4F46E5"`) | Goal color |
| `description` | `string` | No | Any string | Goal description |
| `dueDate` | `string` | No | ISO 8601 UTC (e.g. `"2026-03-31T23:59:59Z"`) | Goal deadline |

**Example:**
```json
{
  "name": "focus_create_goal",
  "arguments": {
    "name": "Launch Product",
    "priority": "p1",
    "color": "#4F46E5",
    "description": "Ship v1.0 to production",
    "dueDate": "2026-03-31T23:59:59Z"
  }
}
```

---

### 13. `focus_update_goal`

Update a goal by ID. Only include fields you want to change. Set `dueDate` to `null` to clear it.

**Arguments:**

| Field | Type | Required | Values / Format | Description |
|-------|------|----------|-----------------|-------------|
| `id` | `string` | **Yes** | UUID | Goal ID to update |
| `name` | `string` | No | 1–100 characters | New name |
| `priority` | `string` | No | `"p1"`, `"p2"`, `"p3"`, `"p4"` | New priority |
| `color` | `string` | No | Hex `#RRGGBB` | New color |
| `description` | `string` | No | Any string | New description |
| `dueDate` | `string \| null` | No | ISO 8601 UTC or `null` | Set/clear deadline |

**Example:**
```json
{
  "name": "focus_update_goal",
  "arguments": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "priority": "p2",
    "dueDate": null
  }
}
```

---

### 14. `focus_delete_goal`

Delete a goal by ID.

**Arguments:**

| Field | Type | Required | Values / Format | Description |
|-------|------|----------|-----------------|-------------|
| `id` | `string` | **Yes** | UUID | Goal ID to delete |

**Example:**
```json
{
  "name": "focus_delete_goal",
  "arguments": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

---

### 15. `focus_list_actions`

List activity log entries. All filters are optional.

**Arguments:**

| Field | Type | Required | Values / Format | Description |
|-------|------|----------|-----------------|-------------|
| `actorType` | `string` | No | `"user"` or `"agent"` | Who performed the action |
| `entityType` | `string` | No | `"task"`, `"project"`, or `"goal"` | Type of entity the action was on |
| `entityId` | `string` | No | UUID | Specific entity ID (use with `entityType`) |
| `limit` | `number` | No | `1`–`100` (default: `50`) | Max number of results |

**Example — Recent agent actions:**
```json
{
  "name": "focus_list_actions",
  "arguments": {
    "actorType": "agent",
    "limit": 10
  }
}
```

**Example — Change log for a specific task:**
```json
{
  "name": "focus_list_actions",
  "arguments": {
    "entityType": "task",
    "entityId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

---

### 16. `focus_mark_actions_read`

Mark activity log entries as read.

**Arguments:**

| Field | Type | Required | Values / Format | Description |
|-------|------|----------|-----------------|-------------|
| `ids` | `string[]` | **Yes** | Array of UUIDs | Action IDs to mark as read |

**Example:**
```json
{
  "name": "focus_mark_actions_read",
  "arguments": {
    "ids": [
      "action-uuid-1",
      "action-uuid-2"
    ]
  }
}
```

---

## Best Practices

1. **Always use filters** when listing tasks — avoid fetching all tasks
2. **Use `focus_list_inbox`** for unorganized tasks (no project)
3. **Check action logs** to see what other agents or the user have done
4. **Validate dates** are in ISO 8601 UTC format before creating/updating
5. **Only include changed fields** when updating — omit unchanged fields
6. **Pass `null`** to clear nullable fields (`projectId`, `dueDate`, `planDate`)
7. **Remember filter restrictions** — `status` filter does NOT accept `"review"`, even though create/update does

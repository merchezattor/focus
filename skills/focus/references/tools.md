## Tool Reference

### Task Tools

#### `focus_list_tasks`
List and search tasks with server-side filtering. **ALWAYS use filters** — never fetch all.

**Arguments:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `priority` | `string[]` | No | Filter by priority: `["p1", "p2", "p3", "p4"]` |
| `status` | `string[]` | No | Filter by status: `["todo", "in_progress", "done"]` (review NOT valid) |
| `completed` | `boolean` | No | Filter by completion flag |
| `projectId` | `string` | No | Filter to specific project UUID |
| `dueDate` | `string` | No | `"today"`, `"overdue"`, `"upcoming"`, or ISO date |
| `planDate` | `string` | No | Same as dueDate |
| `search` | `string` | No | Case-insensitive text search in title/description |
| `lastActionType` | `string[]` | No | Filter by most recent action: `["create", "update", "reviewed", "groomed", "processed", "pending"]` |
| `limit` | `number` | No | Max results to return (1–100, default: 10) |

**Returns**: `{ success: true, data: Task[] }`

#### `focus_list_inbox`
List tasks without a project (inbox). Same filters as `focus_list_tasks` including `limit`.

**Returns**: `{ success: true, data: Task[] }`

#### `focus_get_task`
Get a single task by ID. Returns complete Task with comments. Use to verify after create/update or check current state of a known task.

**Arguments:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | **Yes** | Task UUID |

**Returns**: `{ success: true, data: Task }` or `{ success: false, error: "Task not found or access denied" }`

#### `focus_create_task`
Create a new task. Returns complete Task with generated ID.

**Arguments:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | `string` | **Yes** | 1–200 characters |
| `priority` | `string` | **Yes** | `"p1"`, `"p2"`, `"p3"`, or `"p4"` |
| `description` | `string` | No | Max 1000 characters |
| `projectId` | `string` | No | UUID. Omit for inbox |
| `dueDate` | `string` | No | ISO 8601 UTC |
| `planDate` | `string` | No | ISO 8601 UTC |
| `status` | `string` | No | `"todo"`, `"in_progress"`, `"review"`, `"done"` (default: "todo") |

**Returns**: `{ success: true, data: Task }`

#### `focus_update_task`
Update existing task by ID. **Partial update** — only include changed fields.

**Arguments:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | **Yes** | Task UUID |
| `title` | `string` | No | New title |
| `priority` | `string` | No | New priority |
| `description` | `string` | No | New description |
| `completed` | `boolean` | No | Mark complete/uncomplete |
| `status` | `string` | No | New status (review IS valid here) |
| `projectId` | `string \| null` | No | Move to project, or `null` for inbox |
| `dueDate` | `string \| null` | No | Set/clear due date |
| `planDate` | `string \| null` | No | Set/clear plan date |

**Returns**: `{ success: true, data: { id, ...updates } }`

#### `focus_delete_task`
Delete a task by ID.

**Arguments:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | **Yes** | Task UUID |

**Returns**: `{ success: true, id: string }`

#### `focus_add_task_comment`
Add a comment to a task.

**Arguments:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `taskId` | `string` | **Yes** | Task UUID |
| `content` | `string` | **Yes** | Comment text |

**Returns**: `{ success: true, data: Comment }`

### Project Tools

#### `focus_list_projects`
List all projects. No arguments.

**Returns**: `{ success: true, data: Project[] }`

#### `focus_create_project`
Create a new project.

**Arguments:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | **Yes** | 1–100 characters |
| `color` | `string` | **Yes** | Hex `#RRGGBB` |
| `priority` | `string` | No | `"p1"`, `"p2"`, `"p3"`, or `"p4"` (default: "p4") |
| `description` | `string` | No | Project description |
| `isFavorite` | `boolean` | No | Pin as favorite (default: false) |
| `parentId` | `string` | No | Parent goal/project UUID |
| `parentType` | `string` | No | `"goal"` or `"project"` (required if parentId set) |
| `viewType` | `string` | No | `"list"` or `"board"` (default: "list") |

**Returns**: `{ success: true, data: Project }`

#### `focus_update_project`
Update project by ID. Partial update.

**Returns**: `{ success: true, data: { id, ...updates } }`

#### `focus_delete_project`
Delete project by ID.

**Returns**: `{ success: true, id: string }`

### Goal Tools

#### `focus_list_goals`
List all goals. No arguments.

**Returns**: `{ success: true, data: Goal[] }`

#### `focus_create_goal`
Create a new goal.

**Returns**: `{ success: true, data: Goal }`

#### `focus_update_goal`
Update goal by ID. Partial update. dueDate can be cleared with `null`.

**Returns**: `{ success: true, data: { id, ...updates } }`

#### `focus_delete_goal`
Delete goal by ID.

**Returns**: `{ success: true, id: string }`

### Activity Tools

#### `focus_list_actions`
List activity log entries.

**Arguments:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `actorType` | `string` | No | `"user"` or `"agent"` |
| `entityType` | `string` | No | `"task"`, `"project"`, or `"goal"` |
| `entityId` | `string` | No | Specific entity UUID |
| `limit` | `number` | No | 1–100 (default: 50) |

**Returns**: `{ success: true, data: { actions } }`

#### `focus_mark_actions_read`
Mark activity log items as read.

**Arguments:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ids` | `string[]` | **Yes** | Array of action UUIDs |

**Returns**: `{ success: true, data: { markedCount } }`

#### `focus_create_agentic_action`
Create a manual agentic action log entry for a task.

**Arguments:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `entityId` | `string` | **Yes** | Task UUID |
| `entityType` | `string` | **Yes** | Only "task" supported |
| `actionType` | `string` | **Yes** | "reviewed", "groomed", or "processed" |
| `comment` | `string` | No | Optional comment (max 2000 chars) |

**Returns**: `{ success: true, data: { entityId, entityType, actionType, comment } }`

**Agentic Action Types:**
- `reviewed` — Task was reviewed or inspected
- `groomed` — Task was refined, clarified, or prepared
- `processed` — Task was worked on or completed outside normal flow

**Usage Example:**
```json
{
  "name": "focus_create_agentic_action",
  "arguments": {
    "entityId": "task-uuid",
    "entityType": "task",
    "actionType": "groomed",
    "comment": "Clarified requirements with stakeholder"
  }
}
```

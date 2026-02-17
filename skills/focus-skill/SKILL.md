---
name: focus-skill 
description: MCP-enabled skill for Focus task management. Provides 16 tools for tasks, projects, goals, and activity tracking via Model Context Protocol.
---

# Focus MCP Skill

AI-native task management through Model Context Protocol (MCP).

## Overview

This skill provides **16 MCP tools** for managing tasks, projects, goals, and tracking activity in the Focus application. It uses the modern **Streamable HTTP** transport for reliable, stateful connections.

**Protocol**: MCP 2024-11-05  
**Transport**: Streamable HTTP  
**Endpoint**: `POST /api/mcp`

---

## Available Tools (16 Total)

### Tasks (6 tools)

| Tool | Description |
|------|-------------|
| `focus_list_tasks` | List and search tasks with filters (priority, status, due date, etc.) |
| `focus_list_inbox` | List tasks from inbox (tasks without a project) |
| `focus_create_task` | Create a new task with title, priority, and optional fields |
| `focus_update_task` | Update an existing task by ID |
| `focus_delete_task` | Delete a task by ID |
| `focus_add_task_comment` | Add a comment to a task |

**List Tasks Example:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "focus_list_tasks",
    "arguments": {
      "priority": ["p1", "p2"],
      "status": ["todo"],
      "dueDate": "today"
    }
  }
}
```

**Create Task Example:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "focus_create_task",
    "arguments": {
      "title": "Review quarterly report",
      "priority": "p1",
      "description": "Detailed review needed",
      "dueDate": "2026-02-20T17:00:00Z"
    }
  }
}
```

**Get Inbox Tasks:**

Use the dedicated `focus_list_inbox` tool to fetch tasks without a project:

```json
{
  "method": "tools/call",
  "params": {
    "name": "focus_list_inbox",
    "arguments": {
      "status": ["todo"],
      "priority": ["p1", "p2"]
    }
  }
}
```

This tool supports the same filters as `focus_list_tasks` but automatically filters for tasks where `projectId` is null (inbox tasks).

### Projects (4 tools)

| Tool | Description |
|------|-------------|
| `focus_list_projects` | List all projects |
| `focus_create_project` | Create a new project |
| `focus_update_project` | Update a project |
| `focus_delete_project` | Delete a project |

**Create Project Example:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "focus_create_project",
    "arguments": {
      "name": "Q1 Goals",
      "color": "#E44332",
      "isFavorite": true
    }
  }
}
```

### Goals (4 tools)

| Tool | Description |
|------|-------------|
| `focus_list_goals` | List all goals |
| `focus_create_goal` | Create a new goal |
| `focus_update_goal` | Update a goal |
| `focus_delete_goal` | Delete a goal |

**Create Goal Example:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "focus_create_goal",
    "arguments": {
      "name": "Launch Product",
      "priority": "p1",
      "color": "#4F46E5",
      "dueDate": "2026-03-31T23:59:59Z"
    }
  }
}
```

### Activity Log (2 tools)

| Tool | Description |
|------|-------------|
| `focus_list_actions` | List activity log entries |
| `focus_mark_actions_read` | Mark actions as read |

**List Actions Example:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "focus_list_actions",
    "arguments": {
      "actorType": "agent",
      "limit": 10
    }
  }
}
```

**Get Task Change Log:**

To see all actions/changes for a specific task:

```json
{
  "method": "tools/call",
  "params": {
    "name": "focus_list_actions",
    "arguments": {
      "entityType": "task",
      "entityId": "task-uuid-here"
    }
  }
}
```

**Available Filters:**
- `actorType`: "user" or "agent" - who performed the action
- `entityType`: "task", "project", or "goal" - type of entity
- `entityId`: specific UUID of the entity (use with entityType)
- `limit`: number of results (1-100, default 50)

---

## MCP Protocol Usage

### Tool Discovery

First, list available tools to see all capabilities:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list"
}
```

### Calling Tools

Use the `tools/call` method to execute any of the 16 tools listed above:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "focus_list_tasks",
    "arguments": {
      "priority": ["p1"]
    }
  }
}
```

### Response Format

All tools return responses in this format:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "[JSON stringified data]"
      }
    ],
    "isError": false
  }
}
```

If an error occurs:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Error message"
      }
    ],
    "isError": true
  }
}
```

---

## Important Notes

### Date Handling

All dates are stored in **UTC** (ISO 8601 format with `Z` suffix):
```
2026-02-09T17:00:00.000Z = Feb 9, 2026 at 17:00 UTC
```

Always convert to user's local timezone for display.

### Priority Levels

- `p1` - High (red)
- `p2` - Medium (orange)
- `p3` - Low (blue)
- `p4` - None (gray)

### Colors

Use hex codes: `#E44332`, `#4F46E5`, `#10B981`, etc.

### Task Status Values

- `todo` - Not started
- `in_progress` - Currently working on it
- `review` - Pending review
- `done` - Completed

### Actor Types (for actions)

- `user` - Actions performed by the human user
- `agent` - Actions performed by AI agents (like you)

---

## Best Practices

1. **Always use filters** when listing tasks - avoid fetching all tasks
2. **Use `focus_list_inbox`** for unorganized tasks (no project)
3. **Check action logs** to see what other agents have done
4. **Validate dates** are in ISO 8601 UTC format before creating
5. **Provide context** in descriptions when creating tasks

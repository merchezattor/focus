---
name: focus-skill 
description: MCP-enabled skill for Focus task management. Provides 15 tools for tasks, projects, goals, and activity tracking via Model Context Protocol.
---

# Focus MCP Skill

AI-native task management through Model Context Protocol (MCP).

## Overview

This skill provides **15 MCP tools** for managing tasks, projects, goals, and tracking activity in the Focus application. It uses the modern **Streamable HTTP** transport for reliable, stateful connections.

**Protocol**: MCP 2024-11-05  
**Transport**: Streamable HTTP  
**Authentication**: Bearer Token  
**Endpoint**: `POST /api/mcp`

---

## Quick Start

### 1. Configure Environment

```bash
export FOCUS_MCP_URL="https://focus.merchezatter.xyz/api/mcp"
export FOCUS_MCP_TOKEN="focus_your_api_token_here"
```

### 2. Test Connection

```bash
node scripts/test-mcp.js
```

---

## Available Tools (15 Total)

### Tasks (5 tools)

| Tool | Description |
|------|-------------|
| `focus_list_tasks` | List and search tasks with filters (priority, status, due date, etc.) |
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

Inbox tasks are tasks without a project (tasks where `projectId` is null or undefined):

```json
{
  "method": "tools/call",
  "params": {
    "name": "focus_list_tasks",
    "arguments": {
      "status": ["todo"]
    }
  }
}
```

Then filter the results client-side to exclude tasks that have a `projectId`. Or if your storage supports it, pass:
```json
{
  "arguments": {
    "projectId": null
  }
}
```

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

---

## MCP Protocol Details

### Connection Flow

1. **Initialize** (required first call):
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {
      "name": "your-client",
      "version": "1.0.0"
    }
  }
}
```

2. **List Tools** (discover available tools):
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list"
}
```

3. **Call Tool** (execute operations):
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "focus_list_tasks",
    "arguments": {}
  }
}
```

### Headers Required

```
Content-Type: application/json
Accept: application/json, text/event-stream
Authorization: Bearer <your_token>
mcp-session-id: <session_id_from_initialize_response>
```

### Response Format

Responses may be JSON or SSE format:

**JSON Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [{"type": "text", "text": "[{...tasks...}]"}]
  }
}
```

**SSE Response:**
```
event: message
data: {"jsonrpc":"2.0","id":3,"result":{"content":[...]}}
```

---

## Client Configuration Examples

### OpenCode

```json
{
  "mcpServers": {
    "focus": {
      "url": "https://focus.merchezatter.xyz/api/mcp",
      "headers": {
        "Authorization": "Bearer focus_your_token"
      }
    }
  }
}
```

### Cursor

Settings → Features → MCP Servers:
- **Name**: `focus`
- **URL**: `https://focus.merchezatter.xyz/api/mcp`
- **Headers**: 
  - `Authorization: Bearer focus_your_token`
  - `Accept: application/json, text/event-stream`

### Claude Desktop

```json
{
  "mcpServers": {
    "focus": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-focus"],
      "env": {
        "FOCUS_API_URL": "https://focus.merchezatter.xyz/api/mcp",
        "FOCUS_API_TOKEN": "focus_your_token"
      }
    }
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

---

## Troubleshooting

### Connection Failed

1. Verify token is valid
2. Check URL ends with `/api/mcp`
3. Ensure `Accept` header includes both JSON and SSE

### Session Errors

Always include `mcp-session-id` header after initialization:
```bash
curl -X POST $FOCUS_MCP_URL \
  -H "Authorization: Bearer $TOKEN" \
  -H "mcp-session-id: <session_from_init>" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'
```

---

## Legacy Notice

Previous versions used REST API with `api-client.js`. This has been **deprecated** in favor of MCP. All functionality is now available through the 15 MCP tools listed above.

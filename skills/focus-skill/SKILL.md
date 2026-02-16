---
name: focus-skill 
description: Interacts with the Focus application to manage tasks and projects. Use when the user wants to list, create, or manage their todo list.
---

# Focus App Skill

Allows agents to interact with the Focus application via its API.
Capable of listing and creating tasks and projects.

## Quick Start

1. **Configuration of Environment**:

    ```bash
    export FOCUS_API_URL="https://focus.merchezatter.xyz/api"
    export FOCUS_API_TOKEN="<your_api_token>"
    ```

2. **Run Client**:

    ```bash
    # List Tasks
    node scripts/api-client.js tasks list
    ```

## Core Workflow

The skill uses a NodeJS script `scripts/api-client.js` as a bridge to the API.

### 1. Listing & Searching Resources

**Tasks:**

The `tasks list` command uses an efficient search endpoint. You can list all tasks or filter them. Always use filters, and refraint to fetch all tasks to do in-memory filtering (it's very expensive).

- **Filter Tasks:**

    ```bash
    # Filter by priority
    node scripts/api-client.js tasks list '{"priority": "p1"}'

    # Filter by multiple criteria (p1 tasks due today)
    node scripts/api-client.js tasks list '{"priority": "p1", "dueDate": "today"}'

    # Full text search
    node scripts/api-client.js tasks list '{"search": "buy milk"}'
    ```

    **Supported Filters:**
    - `priority`: "p1", "p2", "p3", "p4" (comma-separated for multiple)
    - `status`: "todo", "in_progress", "done"
    - `completed`: true/false
    - `projectId`: <uuid>
    - `dueDate`: "today", "overdue", "upcoming", or "YYYY-MM-DD"
    - `planDate`: "today", "overdue", "upcoming", or "YYYY-MM-DD"
    - `search`: text string

**Projects:**

```bash
node scripts/api-client.js projects list
```

**Goals:**

```bash
node scripts/api-client.js goals list
```

### 2. Creating Resources

**Create Task:**

```bash
node scripts/api-client.js tasks create '{"title": "New Task", "priority": "p1", "projectId": "optional_id"}'
```

**Create Project:**

```bash
node scripts/api-client.js projects create '{"name": "New Project", "color": "#ff0000", "isFavorite": true}'
```

**Create Goal:**

```bash
node scripts/api-client.js goals create '{"name": "New Goal", "color": "#00ff00", "priority": "p1"}'
```

### 3. Modifying Resources

**Update/Delete Tasks:**

```bash
node scripts/api-client.js tasks update <id> '{"title": "Updated", "priority": "p2"}'
node scripts/api-client.js tasks delete <id>
node scripts/api-client.js tasks add_comment <id> "This is a comment"
```

**Update/Delete Projects:**

```bash
node scripts/api-client.js projects update <id> '{"name": "Updated Project"}'
node scripts/api-client.js projects delete <id>
```

**Update/Delete Goals:**

```bash
node scripts/api-client.js goals update <id> '{"name": "Updated Goal"}'
node scripts/api-client.js goals delete <id>
```

### 4. Activity Log (Actions)

**List Actions:**

- Default (all actions, excluding your own):

  ```bash
  node scripts/api-client.js actions list
  ```

- Filter by Actor Type (e.g., 'user' to see only user actions):

  ```bash
  node scripts/api-client.js actions list '{"actorType": "user"}'
  ```

- Filter by Actor Type (e.g., 'agent' to see other agents' actions):

  ```bash
  node scripts/api-client.js actions list '{"actorType": "agent"}'
  ```

**Mark Actions as Read:**

- Mark specific actions as read:

  ```bash
  # payload is { "ids": ["action-id-1", "action-id-2"] }
  node scripts/api-client.js actions mark_read '{"ids": ["<action_id>"]}'
  ```

## Updating the Skill (Important!)

When the Focus app API changes, you need to update the skill files in your working directory. Follow this workflow:

### Workflow

```bash
# 1. Pull latest changes from the repository
cd ~/repos/focus
git pull origin main

# 2. Copy updated skill files to your working directory
cp ~/repos/focus/skills/focus-skill/scripts/api-client.js ~/clawd/skills/focus/scripts/
cp ~/repos/focus/skills/focus-skill/SKILL.md ~/clawd/skills/focus/ 2>/dev/null || true

# 3. Test that the skill works
cd ~/clawd/skills/focus
FOCUS_API_URL="https://todo.merchezatter.xyz/api" \
FOCUS_API_TOKEN="focus_b9ab46503834ee78d2356a72cbcfed49bf2514a1b9fcaf4f" \
node scripts/api-client.js tasks list
```

### Key Points

- Repository: [github.com/merchezattor/focus](https://github.com/merchezattor/focus)
- Skill location in repo: `skills/focus-skill/`
- Your working copy: `~/clawd/skills/focus/`
- Always pull before copying to get the latest API client
- Test after copying to verify the skill works

## Important Rules

- **ALWAYS** check that `FOCUS_API_TOKEN` is set before running commands.
- **ALWAYS** validate JSON payloads before passing them to the creation commands.
- **Priority Levels**: p1 (High), p2, p3, p4 (Low).
- **Colors**: Use hex codes for colors (e.g., `#ff0000`).

## Date Handling (Important!)

**All dates in the API are stored in UTC (ISO 8601 format with `Z` suffix).**

Example:
```
2026-02-09T17:00:00.000Z = Feb 9, 2026 at 17:00 UTC
```

When filtering or displaying dates, always convert to the user's local timezone.

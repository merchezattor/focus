---
name: focus-skill 
description: Interacts with the Focus application to manage tasks and projects. Use when the user wants to list, create, or manage their todo list.
---

# Focus App Skill

Allows agents to interact with the Focus application via its API. 
Capable of listing and creating tasks and projects.

## Quick Start

1.  **Configure Environment**:
    ```bash
    export FOCUS_API_URL="https://todo.michaelukhin.xyz/api"
    export FOCUS_API_TOKEN="<your_api_token>"
    ```

2.  **Run Client**:
    ```bash
    # List Tasks
    node scripts/api-client.js tasks list

    # Create Task
    node scripts/api-client.js tasks create '{"title": "Check emails", "priority": "p1"}'
    ```

## Core Workflow

The skill uses a NodeJS script `scripts/api-client.js` as a bridge to the API.

### 1. Listing Resources

**Tasks:**
```bash
node scripts/api-client.js tasks list
```
*Returns a JSON array of tasks.*

**Projects:**
```bash
node scripts/api-client.js projects list
```
*Returns a JSON array of projects.*

### 2. Creating Resources

**Create Task:**
Provide a valid JSON string as the third argument.
```bash
node scripts/api-client.js tasks create '{"title": "New Task", "description": "Details", "priority": "p1", "projectId": "optional_id"}'
```

**Create Project:**
```bash
node scripts/api-client.js projects create '{"name": "New Project", "color": "#ff0000", "isFavorite": true}'
```

### 3. Modifying Resources

**Update Task:**
Update any field (title, description, priority, dueDate, etc).
```bash
node scripts/api-client.js tasks update <id> '{"title": "Updated Title", "priority": "p2"}'
```

**Complete Task:**
Set `completed` to true via update.
```bash
node scripts/api-client.js tasks update <id> '{"completed": true}'
```

**Delete Task:**
```bash
node scripts/api-client.js tasks delete <id>
```

## Important Rules

- **ALWAYS** check that `FOCUS_API_TOKEN` is set before running commands.
- **ALWAYS** validate JSON payloads before passing them to the creation commands.
- **Priority Levels**: p1 (High), p2, p3, p4 (Low).
- **Colors**: Use hex codes for project colors (e.g., `#ff0000`).

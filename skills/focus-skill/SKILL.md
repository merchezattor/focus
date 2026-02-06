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
    export FOCUS_API_URL="https://todo.michaelukhin.xyz/api"
    export FOCUS_API_TOKEN="<your_api_token>"
    ```

2. **Run Client**:

    ```bash
    # List Tasks
    node scripts/api-client.js tasks list
    ```

## Core Workflow

The skill uses a NodeJS script `scripts/api-client.js` as a bridge to the API.

### 1. Listing Resources

**Tasks:**

```bash
node scripts/api-client.js tasks list
```

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

## Important Rules

- **ALWAYS** check that `FOCUS_API_TOKEN` is set before running commands.
- **ALWAYS** validate JSON payloads before passing them to the creation commands.
- **Priority Levels**: p1 (High), p2, p3, p4 (Low).
- **Colors**: Use hex codes for colors (e.g., `#ff0000`).

# Tasks Workflow

When a user asks to view, create, or update tasks, follow these guidelines.
**Note**: If a user asks to work with an unassigned task ("Inbox"), you must read `skills/focus/workflows/inbox.md` instead.

### Find and Display Tasks

**When user asks**: "Show me my high priority tasks" or "What tasks are due today?"

```
1. Call focus_list_tasks with appropriate filters
   - Use priority: ["p1", "p2"] for high priority
   - Use dueDate: "today" for today's tasks
   - Use dueDate: "overdue" for overdue tasks
   
2. Display results in user-friendly format
   - Show task title, priority (p1-p4), status, due date
   - Include project name if available
```

**Example**:
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

### Create Task

**When user asks**: "Add a task 'Review quarterly report'"

```
1. Call focus_create_task with:
   - title (required)
   - priority: "p1", "p2", "p3", or "p4" (required)
   - dueDate in ISO 8601 UTC format (optional)
   
2. Wait, does the user want this in a project?
   - If yes, you MUST read `skills/focus/workflows/projects.md` to get the project ID first.
```

### Update Task (Partial Update)

**When user asks**: "Change priority of task Z"

```
1. Call focus_update_task with:
   - id (required - the task UUID)
   - ONLY the fields being changed
   
2. Common update patterns:
   - Clear due date: { id: "...", dueDate: null }
   - Change priority: { id: "...", priority: "p1" }
   - Mark complete: { id: "...", completed: true }
```

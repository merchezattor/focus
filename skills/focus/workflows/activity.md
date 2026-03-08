# Activity Workflow

When a user asks to view historical logs, recent changes, or filter tasks based on recent actions (especially agentic actions).

### Check Recent Activity
**When user asks**: "What did I do recently?" or "Show me recent changes"

```
1. Call focus_list_actions with:
   - actorType: "user" for human actions
   - actorType: "agent" for AI agent actions
   - entityType + entityId for specific entity history
   - limit: 10-20 for recent activity
   
2. Present chronologically with action type and timestamp
```

**Example Log Request**:
```json
{
  "name": "focus_list_actions",
  "arguments": {
    "actorType": "user",
    "limit": 10
  }
}
```

### Filter by Status History / Last Action
**When user asks**: "Find tasks I recently groomed" or "Show me tasks the agent processed today"

```text
1. Call focus_list_tasks or focus_list_inbox with lastActionType parameter
   - lastActionType: ["groomed", "processed", "reviewed"]
   
2. Combine with dueDate or priority filters for high-value targets:
   - lastActionType: ["reviewed"] + dueDate: "today"
```

**Example History Filter**:
```json
{
  "name": "focus_list_tasks",
  "arguments": {
    "lastActionType": ["groomed"],
    "dueDate": "upcoming"
  }
}
```

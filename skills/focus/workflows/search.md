# Search Workflow

When a user asks to search for specific keywords across their tasks.

### Smart Search

**When user asks**: "Find tasks about reports" or "Search for Q1 tasks"

```
1. Use focus_list_tasks with search parameter
   - search: "report" matches title AND description
   - Case-insensitive
   
2. Combine with other filters for precision:
   - search + status: ["todo"] for pending report tasks
   - search + projectId for project-specific search
```

**Example Search**:
```json
{
  "name": "focus_list_tasks",
  "arguments": {
    "search": "report",
    "status": ["todo", "in_progress"]
  }
}
```

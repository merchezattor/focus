# Projects Workflow

When a user asks to view projects or assign tasks to projects.

### Finding a Project ID

You cannot create a task in a project without knowing the exact project UUID.

**When user asks**: "Add a task to Project X"

```
1. Call focus_list_projects to find the project.
2. Search through the returned array for the project matching the user's requested name.
3. Extract the `id` (the UUID).
4. Use this UUID as the `projectId` argument in `focus_create_task` or `focus_update_task`.
```

**Example Get Projects**:
```json
{ "name": "focus_list_projects", "arguments": {} }
```

### Moving a Task to a Project
**When user asks**: "Move task X to project Y"

```
1. Ensure you have the Project UUID (from focus_list_projects).
2. Call focus_update_task with the task ID and the new projectId.
```

**Example Move**:
```json
{
  "name": "focus_update_task",
  "arguments": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "projectId": "project-uuid-found-earlier"
  }
}
```

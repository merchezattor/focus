# Workflow 3: Inbox Management (CRITICAL)

**When user asks**: "What's in my inbox?", "Add task to inbox", "Process my inbox", "Clear inbox"

**What is Inbox?**
The Inbox is the default holding area for tasks that haven't been assigned to a project yet. Think of it as a "cold storage" or capture bucket—new tasks drop here automatically when created without a project. The inbox workflow is about reviewing these unorganized tasks and deciding what to do with them.

```
1. VIEW INBOX TASKS
   Call focus_list_inbox with optional filters:
   - priority: ["p1", "p2"] to see urgent unorganized tasks
   - dueDate: "today" to see what's due now
   - status: ["todo"] to see only unstarted tasks
   
2. ADD TASK TO INBOX
   Call focus_create_task WITHOUT projectId:
   - Just title, priority, and optional dueDate
   - Task automatically lands in inbox
   
3. PROCESS INBOX (Triage)
   For each task in inbox, user typically wants to:
   a) Assign to project → focus_update_task with projectId
   b) Set due date → focus_update_task with dueDate  
   c) Mark complete → focus_update_task with completed: true
   d) Delete → focus_delete_task
   
4. MOVE TASK TO INBOX (Unassign)
   Call focus_update_task with projectId: null
   - This removes task from its current project
   - Task returns to inbox for re-triage
```

**Examples:**

**Example 3a: View Inbox**
```json
{
  "name": "focus_list_inbox",
  "arguments": {
    "status": ["todo"],
    "priority": ["p1", "p2"]
  }
}
```
**Response**: "You have 5 tasks in your inbox. 2 are high priority..."

**Example 3b: Add Task to Inbox**

```json
{
  "name": "focus_create_task",
  "arguments": {
    "title": "Research competitor pricing",
    "priority": "p2"
  }
}
```
**Response**: "Added 'Research competitor pricing' to your inbox with medium priority."

**Example 3c: Process Inbox - Assign to Project**
```json
// Step 1: Get inbox to see tasks
{ "name": "focus_list_inbox", "arguments": {} }

// Step 2: Move task to Marketing project
{
  "name": "focus_update_task",
  "arguments": {
    "id": "task-uuid-from-inbox",
    "projectId": "marketing-project-uuid"
  }
}
```

**Example 3d: Move Task Back to Inbox**
```json
{
  "name": "focus_update_task",
  "arguments": {
    "id": "task-uuid",
    "projectId": null
  }
}
```
**Response**: "Moved 'Quarterly report' back to your inbox."

**Inbox Best Practices:**
- ✅ Use `focus_list_inbox` for inbox tasks — NOT `focus_list_tasks` with null projectId
- ✅ Process inbox regularly (assign, schedule, or complete tasks)
- ✅ Don't let inbox grow too large — it's a triage area, not permanent storage
- ✅ High priority inbox tasks need immediate attention (assign or schedule)
- ✅ Adding to inbox: simply omit projectId when creating
- ✅ Removing from inbox: set projectId to null when updating

## Edge Case: Inbox vs Project Tasks
- **Inbox tasks**: `projectId` is `null` or `undefined` in database
- **Adding to inbox**: Create task without `projectId` field
- **Removing from inbox**: Update task with `projectId: null` (moves back to inbox)
- **Querying inbox**: Always use `focus_list_inbox` — NOT `focus_list_tasks` with filters

**Common Mistake:**
- ❌ Wrong: `focus_list_tasks` with `projectId: null` filter
- ✅ Correct: `focus_list_inbox` with appropriate filters

### Workflow 8: Generate a Learning Map / Roadmap
**When user asks**: "Create a roadmap for React" or "Make a plan to learn System Design"

```text
1. If the user wants this roadmap in a specific project, create the project first and optionally set `viewType: "roadmap"`.
2. Break down the topic into major "Milestones" or "Sections".
3. For each Milestone, create a list of actionable "Subtasks".
4. Call `focus_create_project_roadmap` with the `projectId` and the entire nested array of milestones and subtasks.
5. This creates a beautifully grouped Roadmap instantly where Top-level tasks act as section headers, and Subtasks form the timeline.
```

**Example**:
```json
// Step 1: Create the roadmap in one call
{ 
  "name": "focus_create_project_roadmap", 
  "arguments": { 
    "projectId": "project-uuid",
    "sections": [
      {
        "title": "Phase 1: Networking Basics",
        "priority": "p2",
        "subtasks": [
          { "title": "Learn OSI Model", "priority": "p2" },
          { "title": "Understand TCP/IP", "priority": "p2" }
        ]
      },
      {
        "title": "Phase 2: Advanced Protocols",
        "priority": "p3",
        "subtasks": [
          { "title": "Study BGP", "priority": "p3" }
        ]
      }
    ]
  } 
}
```

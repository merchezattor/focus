## Shared Reference: Enums & Formats

### Priority
| Value | Meaning |
|-------|---------|
| `"p1"` | High (red) |
| `"p2"` | Medium (orange) |
| `"p3"` | Low (blue) |
| `"p4"` | None / default (gray) |

### Task Status
| Value | Meaning |
|-------|---------|
| `"todo"` | Not started |
| `"in_progress"` | Currently being worked on |
| `"review"` | Pending review |
| `"done"` | Completed |

> [!IMPORTANT]
> **Filter vs. Create/Update mismatch**: When filtering tasks (`focus_list_tasks`, `focus_list_inbox`), the `status` filter only accepts `["todo", "in_progress", "done"]`. The value `"review"` is **not valid** in filter queries. However, `"review"` **is valid** when creating or updating a task.

### Date Format
All dates must be **ISO 8601 UTC** strings with a `Z` suffix:
```
2026-02-20T17:00:00Z
```

### Date Filter Keywords
| Value | Behavior |
|-------|----------|
| `"today"` | Tasks where the date falls within today (00:00–23:59 server time) |
| `"overdue"` | Tasks where the date is **before** today AND the task is **not completed** |
| `"upcoming"` | Tasks where the date is **after** today |
| Any ISO date string | Tasks on that exact calendar day |

### Color
Hex color code matching the pattern `#RRGGBB`. Examples: `"#E44332"`, `"#4F46E5"`.

### Actor Type
| Value | Meaning |
|-------|---------|
| `"user"` | Actions performed by the human user |
| `"agent"` | Actions performed by an AI agent |

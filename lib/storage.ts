import { db } from '@/db';
import { tasks, projects, comments } from '@/db/schema';
import { type Task, type Project, type Comment } from '@/types';
import { eq, desc } from 'drizzle-orm';

// --- Projects ---

export async function readProjects(): Promise<Project[]> {
  const dbProjects = await db.select().from(projects).orderBy(projects.createdAt);
  return dbProjects.map(p => ({
    id: p.id,
    name: p.name,
    color: p.color,
    description: p.description || undefined,
    isFavorite: p.isFavorite,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));
}

export async function createProject(project: Project): Promise<void> {
  await db.insert(projects).values({
    id: project.id,
    name: project.name,
    color: project.color,
    description: project.description,
    isFavorite: project.isFavorite,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  });
}

// --- Tasks ---

export async function readTasks(): Promise<Task[]> {
  const dbTasks = await db.select().from(tasks).orderBy(desc(tasks.created_at));

  // Fetch comments for all tasks - lazy loading or secondary query
  // For MVP efficiency with small data, fetching all comments is okay, but ideally we'd join or batch.
  // Drizzle "query" builder (relational) is easier for this if we had set it up with relations.
  // For now, let's just do a second query to get all comments and map them.
  const dbComments = await db.select().from(comments);

  const commentsByTaskId: Record<string, Comment[]> = {};
  for (const c of dbComments) {
    if (!commentsByTaskId[c.task_id]) {
      commentsByTaskId[c.task_id] = [];
    }
    commentsByTaskId[c.task_id].push({
      id: c.id,
      content: c.content,
      postedAt: c.posted_at,
    });
  }

  return dbTasks.map(t => ({
    id: t.id,
    title: t.content,
    description: t.description || undefined,
    completed: t.completed,
    projectId: t.project_id,
    priority: t.priority as "p1" | "p2" | "p3" | "p4", // cast safe if enum matches
    dueDate: t.due_date,
    planDate: t.plan_date,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
    comments: commentsByTaskId[t.id] || [],
  }));
}

export async function createTask(task: Task): Promise<void> {
  await db.insert(tasks).values({
    id: task.id,
    content: task.title,
    description: task.description || null,
    completed: task.completed,
    priority: task.priority,
    project_id: task.projectId || null,
    due_date: task.dueDate,
    plan_date: task.planDate,
    created_at: task.createdAt,
    updated_at: task.updatedAt,
  });

  if (task.comments && task.comments.length > 0) {
    for (const c of task.comments) {
      await createComment(task.id, c);
    }
  }
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<void> {
  // Map partial Task to partial DB Task
  const dbUpdates: any = {};
  if (updates.title !== undefined) dbUpdates.content = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.completed !== undefined) dbUpdates.completed = updates.completed;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
  if (updates.projectId !== undefined) dbUpdates.project_id = updates.projectId;
  if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
  if (updates.planDate !== undefined) dbUpdates.plan_date = updates.planDate;
  if (updates.updatedAt !== undefined) dbUpdates.updated_at = updates.updatedAt;

  if (Object.keys(dbUpdates).length > 0) {
    await db.update(tasks).set(dbUpdates).where(eq(tasks.id, id));
  }
}

export async function deleteTask(id: string): Promise<void> {
  await db.delete(tasks).where(eq(tasks.id, id));
}

// --- Comments ---

export async function createComment(taskId: string, comment: Comment): Promise<void> {
  await db.insert(comments).values({
    id: comment.id,
    content: comment.content,
    posted_at: comment.postedAt,
    task_id: taskId,
  });
}

export async function deleteComment(commentId: string): Promise<void> {
  await db.delete(comments).where(eq(comments.id, commentId));
}

export async function syncComments(taskId: string, newComments: Comment[]): Promise<void> {
  // 1. Get existing comments
  // (We could optimize by fetching IDs only, but for now select * is fine for MVP)
  const existingDbComments = await db.select().from(comments).where(eq(comments.task_id, taskId));
  const existingIds = new Set(existingDbComments.map(c => c.id));
  const newIds = new Set(newComments.map(c => c.id));

  // 2. Identify deletions
  const toDelete = existingDbComments.filter(c => !newIds.has(c.id));
  for (const c of toDelete) {
    await deleteComment(c.id);
  }

  // 3. Identify additions
  const toAdd = newComments.filter(c => !existingIds.has(c.id));
  for (const c of toAdd) {
    await createComment(taskId, c);
  }

  // (Optional) Identify updates (not implemented for MVP as UI doesn't allow editing comments)
}

// --- Legacy Support (Deprecated) ---
// These are kept to avoid breaking build if something still imports them, 
// but they should be removed. 
// writeTasks was used to overwrite the whole JSON. We will log a warning.

export async function writeTasks(tasks: Task[]): Promise<void> {
  console.warn("Deprecated writeTasks called! This does nothing in DB mode. Use create/updateTask.");
}

export async function writeProjects(projects: Project[]): Promise<void> {
  console.warn("Deprecated writeProjects called! This does nothing in DB mode.");
}


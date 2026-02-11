import { and, count, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { comments, goals, projects, tasks } from "@/db/schema";
import type { Comment, Goal, Project, Task } from "@/types";

import { type ActionType, type ActorType, logAction } from "./actions";

// ... existing code ...

export async function getTaskCounts(
	userId: string,
): Promise<{ inboxCount: number; todayCount: number }> {
	// Inbox: ALL tasks for the user (as per user request)
	const inboxResult = await db
		.select({ value: count() })
		.from(tasks)
		.where(and(eq(tasks.userId, userId), eq(tasks.completed, false)));

	// Today: dueDate is today
	// We need to handle timestamps carefully.
	// Assuming 'today' means local time of the server or UTC?
	// Ideally client timezone, but for MVP server time is acceptable approximation if simpler.
	// Or we can just check if the day matches.

	const todayStart = new Date();
	todayStart.setHours(0, 0, 0, 0);
	const todayEnd = new Date();
	todayEnd.setHours(23, 59, 59, 999);

	const todayResult = await db
		.select({ value: count() })
		.from(tasks)
		.where(
			and(
				eq(tasks.userId, userId),
				eq(tasks.completed, false),
				gte(tasks.due_date, todayStart),
				lte(tasks.due_date, todayEnd),
			),
		);

	return {
		inboxCount: inboxResult[0].value,
		todayCount: todayResult[0].value,
	};
}

export async function readProjects(userId: string): Promise<Project[]> {
	const dbProjects = await db
		.select()
		.from(projects)
		.where(eq(projects.userId, userId))
		.orderBy(projects.createdAt);
	return dbProjects.map((p) => ({
		id: p.id,
		name: p.name,
		color: p.color,
		description: p.description || undefined,
		isFavorite: p.isFavorite,
		parentId: p.parent_id || undefined,
		parentType: (p.parent_type as "goal" | "project") || undefined,
		viewType: (p.view_type as "list" | "board") || "list",
		createdAt: p.createdAt,
		updatedAt: p.updatedAt,
	}));
}

export async function createProject(
	project: Project,
	userId: string,
	actorType: ActorType = "user",
): Promise<void> {
	await db.insert(projects).values({
		id: project.id,
		name: project.name,
		color: project.color,
		description: project.description,
		isFavorite: project.isFavorite,
		parent_id: project.parentId,
		parent_type: project.parentType,
		view_type: project.viewType,
		createdAt: project.createdAt,
		updatedAt: project.updatedAt,
		userId: userId,
	});

	logAction({
		entityId: project.id,
		entityType: "project",
		actorId: userId,
		actorType: actorType,
		actionType: "create",
		changes: { name: project.name },
		metadata: { name: project.name },
	});
}

export async function updateProject(
	id: string,
	updates: Partial<Project> & { parentType?: "goal" | "project" },
	actorId: string,
	actorType: ActorType = "user",
): Promise<void> {
	const dbUpdates: any = {};
	if (updates.name !== undefined) dbUpdates.name = updates.name;
	if (updates.description !== undefined)
		dbUpdates.description = updates.description;
	if (updates.color !== undefined) dbUpdates.color = updates.color;
	if (updates.isFavorite !== undefined)
		dbUpdates.isFavorite = updates.isFavorite;
	if (updates.isFavorite !== undefined)
		dbUpdates.isFavorite = updates.isFavorite;
	if (updates.parentId !== undefined) dbUpdates.parent_id = updates.parentId;
	if (updates.parentType !== undefined)
		dbUpdates.parent_type = updates.parentType;
	if (updates.viewType !== undefined) dbUpdates.view_type = updates.viewType;

	if (updates.updatedAt !== undefined) dbUpdates.updatedAt = updates.updatedAt;

	if (Object.keys(dbUpdates).length > 0) {
		const result = await db
			.update(projects)
			.set(dbUpdates)
			.where(eq(projects.id, id))
			.returning({ name: projects.name });

		// Log action
		// For updates, we log the *changes* requested
		logAction({
			entityId: id,
			entityType: "project",
			actorId: actorId,
			actorType: actorType,
			actionType: "update",
			changes: updates,
			metadata: { name: result[0]?.name },
		});
	}
}

// --- Goals ---

export async function readGoals(userId: string): Promise<Goal[]> {
	const dbGoals = await db
		.select()
		.from(goals)
		.where(eq(goals.userId, userId))
		.orderBy(goals.priority);
	return dbGoals.map((g) => ({
		id: g.id,
		name: g.name,
		description: g.description || undefined,
		priority: g.priority as "p1" | "p2" | "p3" | "p4",
		dueDate: g.due_date || undefined,
		color: g.color,
		createdAt: g.createdAt,
		updatedAt: g.updatedAt,
	}));
}

export async function createGoal(
	goal: Goal,
	userId: string,
	actorType: ActorType = "user",
): Promise<void> {
	await db.insert(goals).values({
		id: goal.id,
		name: goal.name,
		description: goal.description,
		priority: goal.priority,
		due_date: goal.dueDate,
		color: goal.color,
		userId: userId,
		createdAt: goal.createdAt,
		updatedAt: goal.updatedAt,
	});

	logAction({
		entityId: goal.id,
		entityType: "goal",
		actorId: userId,
		actorType: actorType,
		actionType: "create",
		changes: { name: goal.name },
		metadata: { name: goal.name },
	});
}

export async function updateGoal(
	id: string,
	updates: Partial<Goal>,
	actorId: string,
	actorType: ActorType = "user",
): Promise<void> {
	const dbUpdates: any = {};
	if (updates.name !== undefined) dbUpdates.name = updates.name;
	if (updates.description !== undefined)
		dbUpdates.description = updates.description;
	if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
	if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
	if (updates.color !== undefined) dbUpdates.color = updates.color;
	if (updates.updatedAt !== undefined) dbUpdates.updatedAt = updates.updatedAt;

	if (Object.keys(dbUpdates).length > 0) {
		const result = await db
			.update(goals)
			.set(dbUpdates)
			.where(eq(goals.id, id))
			.returning({ name: goals.name });

		logAction({
			entityId: id,
			entityType: "goal",
			actorId: actorId,
			actorType: actorType,
			actionType: "update",
			changes: updates,
			metadata: { name: result[0]?.name },
		});
	}
}

export async function deleteGoal(
	id: string,
	actorId: string,
	actorType: ActorType = "user",
): Promise<void> {
	const result = await db
		.delete(goals)
		.where(eq(goals.id, id))
		.returning({ name: goals.name });

	logAction({
		entityId: id,
		entityType: "goal",
		actorId: actorId,
		actorType: actorType,
		actionType: "delete",
		metadata: { name: result[0]?.name },
	});
}

// --- Tasks ---

export async function readTasks(userId: string): Promise<Task[]> {
	// Fetch tasks belonging to the user
	const dbTasks = await db
		.select()
		.from(tasks)
		.where(eq(tasks.userId, userId))
		.orderBy(tasks.priority, desc(tasks.created_at));

	// Fetch comments for these tasks
	// We can join or fetch all comments for user's tasks.
	// For simplicity, let's fetch all comments for user's tasks.
	// Actually, we should filter comments by task_id which are in dbTasks.
	// Let's grab all comments for now, assuming not massive scale yet, or better:
	// const taskIds = dbTasks.map(t => t.id);
	// const dbComments = await db.select().from(comments).where(inArray(comments.task_id, taskIds));
	// But for MVP, let's keep it simple: select all comments, or just select * since we don't have user_id on comments.
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

	return dbTasks.map((t) => ({
		id: t.id,
		title: t.content,
		description: t.description || undefined,
		completed: t.completed,
		status: (t.status as "todo" | "in_progress" | "done") || "todo",
		projectId: t.project_id,
		priority: t.priority as "p1" | "p2" | "p3" | "p4",
		dueDate: t.due_date,
		planDate: t.plan_date,
		createdAt: t.created_at,
		updatedAt: t.updated_at,
		comments: commentsByTaskId[t.id] || [],
	}));
}

export async function createTask(
	task: Task,
	userId: string,
	actorType: ActorType = "user",
): Promise<void> {
	await db.insert(tasks).values({
		id: task.id,
		content: task.title,
		description: task.description || null,
		completed: task.completed,
		status: task.status,
		priority: task.priority,
		project_id: task.projectId || null,
		due_date: task.dueDate,
		plan_date: task.planDate,
		created_at: task.createdAt,
		updated_at: task.updatedAt,
		userId: userId,
	});

	if (task.comments && task.comments.length > 0) {
		for (const c of task.comments) {
			await createComment(task.id, c);
		}
	}

	logAction({
		entityId: task.id,
		entityType: "task",
		actorId: userId,
		actorType: actorType,
		actionType: "create",
		changes: { content: task.title },
		metadata: { title: task.title },
	});
}

export async function updateTask(
	id: string,
	updates: Partial<Task>,
	actorId: string,
	actorType: ActorType = "user",
): Promise<void> {
	// Map partial Task to partial DB Task
	const dbUpdates: any = {};
	if (updates.title !== undefined) dbUpdates.content = updates.title;
	if (updates.description !== undefined)
		dbUpdates.description = updates.description;
	if (updates.completed !== undefined) dbUpdates.completed = updates.completed;
	if (updates.status !== undefined) dbUpdates.status = updates.status;
	if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
	if (updates.projectId !== undefined) dbUpdates.project_id = updates.projectId;
	if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
	if (updates.planDate !== undefined) dbUpdates.plan_date = updates.planDate;
	if (updates.updatedAt !== undefined) dbUpdates.updated_at = updates.updatedAt;

	if (Object.keys(dbUpdates).length > 0) {
		const result = await db
			.update(tasks)
			.set(dbUpdates)
			.where(eq(tasks.id, id))
			.returning({ content: tasks.content });

		const actionType: ActionType =
			updates.completed === true
				? "complete"
				: updates.completed === false
					? "uncomplete"
					: "update";

		logAction({
			entityId: id,
			entityType: "task",
			actorId: actorId,
			actorType: actorType,
			actionType: actionType,
			changes: updates,
			metadata: { title: result[0]?.content },
		});
	}
}

export async function deleteTask(
	id: string,
	actorId: string,
	actorType: ActorType = "user",
): Promise<void> {
	const result = await db
		.delete(tasks)
		.where(eq(tasks.id, id))
		.returning({ content: tasks.content });

	logAction({
		entityId: id,
		entityType: "task",
		actorId: actorId,
		actorType: actorType,
		actionType: "delete",
		metadata: { title: result[0]?.content },
	});
}

// --- Comments ---

export async function createComment(
	taskId: string,
	comment: Comment,
): Promise<void> {
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

export async function syncComments(
	taskId: string,
	newComments: Comment[],
): Promise<void> {
	// 1. Get existing comments
	// (We could optimize by fetching IDs only, but for now select * is fine for MVP)
	const existingDbComments = await db
		.select()
		.from(comments)
		.where(eq(comments.task_id, taskId));
	const existingIds = new Set(existingDbComments.map((c) => c.id));
	const newIds = new Set(newComments.map((c) => c.id));

	// 2. Identify deletions
	const toDelete = existingDbComments.filter((c) => !newIds.has(c.id));
	for (const c of toDelete) {
		await deleteComment(c.id);
	}

	// 3. Identify additions
	const toAdd = newComments.filter((c) => !existingIds.has(c.id));
	for (const c of toAdd) {
		await createComment(taskId, c);
	}

	// (Optional) Identify updates (not implemented for MVP as UI doesn't allow editing comments)
}

// --- Legacy Support (Deprecated) ---
// These are kept to avoid breaking build if something still imports them,
// but they should be removed.
// writeTasks was used to overwrite the whole JSON. We will log a warning.

export async function writeTasks(_tasks: Task[]): Promise<void> {
	console.warn(
		"Deprecated writeTasks called! This does nothing in DB mode. Use create/updateTask.",
	);
}

// ... (legacy writeProjects)

export async function deleteProject(
	id: string,
	actorId: string,
	actorType: ActorType = "user",
): Promise<void> {
	await db.delete(tasks).where(eq(tasks.project_id, id));
	const result = await db
		.delete(projects)
		.where(eq(projects.id, id))
		.returning({ name: projects.name });

	logAction({
		entityId: id,
		entityType: "project",
		actorId: actorId,
		actorType: actorType,
		actionType: "delete",
		metadata: { name: result[0]?.name },
	});
}

import {
	and,
	count,
	desc,
	eq,
	gt,
	gte,
	ilike,
	inArray,
	isNull,
	lt,
	lte,
	or,
} from "drizzle-orm";
import { getDb } from "@/db";
import { apiTokens, comments, goals, projects, tasks } from "@/db/schema";
import type { Comment, Goal, Project, Task } from "@/types";

import { type ActionType, type ActorType, logAction } from "./actions";

// ... existing code ...

export async function getTaskCounts(
	userId: string,
): Promise<{ inboxCount: number; todayCount: number }> {
	const inboxResult = await getDb()
		.select({ value: count() })
		.from(tasks)
		.where(
			and(
				eq(tasks.userId, userId),
				eq(tasks.completed, false),
				isNull(tasks.project_id),
			),
		);

	// Today: dueDate is today
	// We need to handle timestamps carefully.
	// Assuming 'today' means local time of the server or UTC?
	// Ideally client timezone, but for MVP server time is acceptable approximation if simpler.
	// Or we can just check if the day matches.

	const todayStart = new Date();
	todayStart.setHours(0, 0, 0, 0);
	const todayEnd = new Date();
	todayEnd.setHours(23, 59, 59, 999);

	const todayResult = await getDb()
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
	const dbProjects = await getDb()
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
	tokenName?: string,
): Promise<void> {
	await getDb().insert(projects).values({
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
		metadata: { name: project.name, tokenName },
	});
}

export async function updateProject(
	id: string,
	updates: Partial<Project> & { parentType?: "goal" | "project" },
	actorId: string,
	actorType: ActorType = "user",
	tokenName?: string,
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
		const result = await getDb()
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
			metadata: { name: result[0]?.name, tokenName },
		});
	}
}

// --- Goals ---

export async function readGoals(userId: string): Promise<Goal[]> {
	const dbGoals = await getDb()
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
	tokenName?: string,
): Promise<void> {
	await getDb().insert(goals).values({
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
		metadata: { name: goal.name, tokenName },
	});
}

export async function updateGoal(
	id: string,
	updates: Partial<Goal>,
	actorId: string,
	actorType: ActorType = "user",
	tokenName?: string,
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
		const result = await getDb()
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
			metadata: { name: result[0]?.name, tokenName },
		});
	}
}

export async function deleteGoal(
	id: string,
	actorId: string,
	actorType: ActorType = "user",
	tokenName?: string,
): Promise<void> {
	const result = await getDb()
		.delete(goals)
		.where(eq(goals.id, id))
		.returning({ name: goals.name });

	logAction({
		entityId: id,
		entityType: "goal",
		actorId: actorId,
		actorType: actorType,
		actionType: "delete",
		metadata: { name: result[0]?.name, tokenName },
	});
}

// --- Tasks ---

export async function getTaskById(id: string): Promise<Task | undefined> {
	// Simple fetch by ID without filters
	const result = await getDb().select().from(tasks).where(eq(tasks.id, id));

	if (!result[0]) return undefined;

	return {
		id: result[0].id,
		title: result[0].content,
		description: result[0].description || undefined,
		completed: result[0].completed,
		status: (result[0].status as "todo" | "in_progress" | "done") || "todo",
		priority: result[0].priority as "p1" | "p2" | "p3" | "p4",
		projectId: result[0].project_id,
		dueDate: result[0].due_date,
		planDate: result[0].plan_date,
		createdAt: result[0].created_at,
		updatedAt: result[0].updated_at,
		comments: [], // Fetched separately if needed
	};
}

// --- Advanced Search ---

export interface TaskFilters {
	priority?: ("p1" | "p2" | "p3" | "p4")[];
	status?: ("todo" | "in_progress" | "done")[];
	completed?: boolean;
	projectId?: string;
	dueDateStr?: string; // "today", "overdue", "upcoming", or ISO date
	planDateStr?: string; // "today", "overdue", "upcoming", or ISO date
	search?: string; // title/description search
}

export async function searchTasks(
	userId: string,
	filters: TaskFilters,
): Promise<Task[]> {
	const conditions = [eq(tasks.userId, userId)];

	// 1. Priority (Array)
	if (filters.priority && filters.priority.length > 0) {
		conditions.push(inArray(tasks.priority, filters.priority));
	}

	// 2. Status (Array)
	if (filters.status && filters.status.length > 0) {
		conditions.push(inArray(tasks.status, filters.status));
	}

	// 3. Completed (Boolean) - overrides status if present, or works alongside
	if (filters.completed !== undefined) {
		conditions.push(eq(tasks.completed, filters.completed));
	}

	// 4. Project
	if (filters.projectId) {
		if (filters.projectId === "inbox") {
			conditions.push(isNull(tasks.project_id));
		} else {
			conditions.push(eq(tasks.project_id, filters.projectId));
		}
	}

	// 5. Text Search (title or description)
	if (filters.search) {
		const searchLower = `%${filters.search.toLowerCase()}%`;
		conditions.push(
			or(
				ilike(tasks.content, searchLower),
				ilike(tasks.description, searchLower),
			)!,
		);
	}

	// 6. Due Date Logic
	if (filters.dueDateStr) {
		const todayStart = new Date();
		todayStart.setHours(0, 0, 0, 0);
		const todayEnd = new Date();
		todayEnd.setHours(23, 59, 59, 999);

		if (filters.dueDateStr === "today") {
			conditions.push(
				and(gte(tasks.due_date, todayStart), lte(tasks.due_date, todayEnd))!,
			);
		} else if (filters.dueDateStr === "overdue") {
			conditions.push(
				and(lt(tasks.due_date, todayStart), eq(tasks.completed, false))!,
			);
		} else if (filters.dueDateStr === "upcoming") {
			conditions.push(gt(tasks.due_date, todayEnd));
		} else {
			// Try specific ISO date match (exact day)
			const specificDate = new Date(filters.dueDateStr);
			if (!Number.isNaN(specificDate.getTime())) {
				const start = new Date(specificDate);
				start.setHours(0, 0, 0, 0);
				const end = new Date(specificDate);
				end.setHours(23, 59, 59, 999);
				conditions.push(
					and(gte(tasks.due_date, start), lte(tasks.due_date, end))!,
				);
			}
		}
	}

	// 7. Plan Date Logic
	if (filters.planDateStr) {
		const todayStart = new Date();
		todayStart.setHours(0, 0, 0, 0);
		const todayEnd = new Date();
		todayEnd.setHours(23, 59, 59, 999);

		if (filters.planDateStr === "today") {
			conditions.push(
				and(gte(tasks.plan_date, todayStart), lte(tasks.plan_date, todayEnd))!,
			);
		} else if (filters.planDateStr === "overdue") {
			conditions.push(
				and(lt(tasks.plan_date, todayStart), eq(tasks.completed, false))!,
			);
		} else if (filters.planDateStr === "upcoming") {
			conditions.push(gt(tasks.plan_date, todayEnd));
		} else {
			// Try specific ISO date match (exact day)
			const specificDate = new Date(filters.planDateStr);
			if (!Number.isNaN(specificDate.getTime())) {
				const start = new Date(specificDate);
				start.setHours(0, 0, 0, 0);
				const end = new Date(specificDate);
				end.setHours(23, 59, 59, 999);
				conditions.push(
					and(gte(tasks.plan_date, start), lte(tasks.plan_date, end))!,
				);
			}
		}
	}

	// Execute Query
	const dbTasks = await getDb()
		.select()
		.from(tasks)
		.where(and(...conditions))
		.orderBy(tasks.priority, desc(tasks.created_at)); // Default sort

	// Fetch comments (simplified for now, same as readTasks)
	const dbComments = await getDb().select().from(comments);
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

export async function readTasks(userId: string): Promise<Task[]> {
	// Fetch tasks belonging to the user
	const dbTasks = await getDb()
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
	// const dbComments = await getDb().select().from(comments).where(inArray(comments.task_id, taskIds));
	// But for MVP, let's keep it simple: select all comments, or just select * since we don't have user_id on comments.
	const dbComments = await getDb().select().from(comments);

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
	tokenName?: string,
): Promise<void> {
	await getDb().insert(tasks).values({
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
		metadata: { title: task.title, tokenName },
	});
}

export async function updateTask(
	id: string,
	updates: Partial<Task>,
	actorId: string,
	actorType: ActorType = "user",
	tokenName?: string,
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
		const result = await getDb()
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
			metadata: { title: result[0]?.content, tokenName },
		});
	}
}

export async function deleteTask(
	id: string,
	actorId: string,
	actorType: ActorType = "user",
	tokenName?: string,
): Promise<void> {
	const result = await getDb()
		.delete(tasks)
		.where(eq(tasks.id, id))
		.returning({ content: tasks.content });

	logAction({
		entityId: id,
		entityType: "task",
		actorId: actorId,
		actorType: actorType,
		actionType: "delete",
		metadata: { title: result[0]?.content, tokenName },
	});
}

// --- API Tokens ---

export async function listApiTokens(
	userId: string,
): Promise<Array<{ id: string; name: string; createdAt: Date }>> {
	const tokens = await getDb()
		.select({
			id: apiTokens.id,
			name: apiTokens.name,
			createdAt: apiTokens.createdAt,
		})
		.from(apiTokens)
		.where(eq(apiTokens.userId, userId))
		.orderBy(desc(apiTokens.createdAt));

	return tokens;
}

export async function createApiToken(
	userId: string,
	name: string,
): Promise<{ id: string; name: string; token: string; createdAt: Date }> {
	const { randomBytes } = await import("node:crypto");
	const newToken = `focus_${randomBytes(24).toString("hex")}`;

	const result = await getDb()
		.insert(apiTokens)
		.values({
			id: crypto.randomUUID(),
			token: newToken,
			userId: userId,
			name: name,
			createdAt: new Date(),
		})
		.returning({
			id: apiTokens.id,
			name: apiTokens.name,
			token: apiTokens.token,
			createdAt: apiTokens.createdAt,
		});

	return result[0];
}

export async function deleteApiToken(
	id: string,
	userId: string,
): Promise<void> {
	await getDb()
		.delete(apiTokens)
		.where(and(eq(apiTokens.id, id), eq(apiTokens.userId, userId)));
}

// --- Comments ---

export async function createComment(
	taskId: string,
	comment: Comment,
): Promise<void> {
	await getDb().insert(comments).values({
		id: comment.id,
		content: comment.content,
		posted_at: comment.postedAt,
		task_id: taskId,
	});
}

export async function deleteComment(commentId: string): Promise<void> {
	await getDb().delete(comments).where(eq(comments.id, commentId));
}

export async function syncComments(
	taskId: string,
	newComments: Comment[],
	actorId: string,
	actorType: ActorType = "user",
	tokenName?: string,
): Promise<void> {
	// 1. Get existing comments
	// (We could optimize by fetching IDs only, but for now select * is fine for MVP)
	const existingDbComments = await getDb()
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

	if (toAdd.length > 0) {
		const task = await getTaskById(taskId);
		const taskTitle = task?.title;

		for (const c of toAdd) {
			await createComment(taskId, c);

			// Log the added comment action
			logAction({
				entityId: taskId,
				entityType: "task",
				actorId: actorId,
				actorType: actorType,
				actionType: "update",
				changes: { comments: "added" },
				metadata: { commentId: c.id, title: taskTitle, tokenName },
			});
		}
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
	tokenName?: string,
): Promise<void> {
	await getDb().delete(tasks).where(eq(tasks.project_id, id));
	const result = await getDb()
		.delete(projects)
		.where(eq(projects.id, id))
		.returning({ name: projects.name });

	logAction({
		entityId: id,
		entityType: "project",
		actorId: actorId,
		actorType: actorType,
		actionType: "delete",
		metadata: { name: result[0]?.name, tokenName },
	});
}

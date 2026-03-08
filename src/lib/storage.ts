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
	ne,
	notInArray,
	or,
	sql,
} from "drizzle-orm";
import { getDb } from "@/db";
import { apiTokens, comments, goals, projects, tasks } from "@/db/schema";
import type { Comment, Goal, Project, Task } from "@/types";

import { type ActionType, type ActorType, logAction } from "./actions";

// ... existing code ...

export async function getTaskCounts(userId: string): Promise<{
	inboxCount: number;
	todayCount: number;
	projectCounts: Record<string, number>;
}> {
	const inboxResult = await getDb()
		.select({ value: count() })
		.from(tasks)
		.where(
			and(
				eq(tasks.userId, userId),
				notInArray(tasks.status, ["done", "cold"]),
				isNull(tasks.project_id),
			),
		);

	// Today: dueDate is today
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
				notInArray(tasks.status, ["done", "cold"]),
				gte(tasks.due_date, todayStart),
				lte(tasks.due_date, todayEnd),
			),
		);

	const projectCountsResult = await getDb()
		.select({ projectId: tasks.project_id, value: count() })
		.from(tasks)
		.where(
			and(
				eq(tasks.userId, userId),
				notInArray(tasks.status, ["done", "cold"]),
				sql`${tasks.project_id} IS NOT NULL`,
			),
		)
		.groupBy(tasks.project_id);

	const projectCounts: Record<string, number> = {};
	for (const row of projectCountsResult) {
		if (row.projectId) {
			projectCounts[row.projectId] = Number(row.value);
		}
	}

	return {
		inboxCount: Number(inboxResult[0]?.value || 0),
		todayCount: Number(todayResult[0]?.value || 0),
		projectCounts,
	};
}

export async function readProjects(userId: string): Promise<Project[]> {
	const dbProjects = await getDb()
		.select()
		.from(projects)
		.where(eq(projects.userId, userId))
		.orderBy(projects.priority, desc(projects.createdAt));
	return dbProjects.map((p) => ({
		id: p.id,
		name: p.name,
		color: p.color,
		priority: p.priority,
		description: p.description || undefined,
		status: p.status,
		isFavorite: p.isFavorite,
		goalId: p.goalId || undefined,
		parentProjectId: p.parentProjectId || undefined,
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
		priority: project.priority,
		description: project.description,
		status: project.status,
		isFavorite: project.isFavorite,
		goalId: project.goalId,
		parentProjectId: project.parentProjectId,
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
		userId: userId,
	});
}

export async function updateProject(
	id: string,
	updates: Partial<Project> & {
		goalId?: string | null;
		parentProjectId?: string | null;
	},
	actorId: string,
	actorType: ActorType = "user",
	tokenName?: string,
): Promise<void> {
	const dbUpdates: any = {};
	if (updates.name !== undefined) dbUpdates.name = updates.name;
	if (updates.description !== undefined)
		dbUpdates.description = updates.description;
	if (updates.color !== undefined) dbUpdates.color = updates.color;
	if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
	if (updates.status !== undefined) dbUpdates.status = updates.status;
	if (updates.isFavorite !== undefined)
		dbUpdates.isFavorite = updates.isFavorite;
	if (updates.goalId !== undefined) dbUpdates.goalId = updates.goalId;
	if (updates.parentProjectId !== undefined)
		dbUpdates.parentProjectId = updates.parentProjectId;
	if (updates.viewType !== undefined) dbUpdates.view_type = updates.viewType;

	if (updates.updatedAt !== undefined) dbUpdates.updatedAt = updates.updatedAt;

	if (Object.keys(dbUpdates).length > 0) {
		const result = await getDb()
			.update(projects)
			.set(dbUpdates)
			.where(eq(projects.id, id))
			.returning({ name: projects.name });

		logAction({
			entityId: id,
			entityType: "project",
			actorId: actorId,
			actorType: actorType,
			actionType: "update",
			changes: updates,
			metadata: { name: result[0]?.name, tokenName },
			userId: actorId,
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
		priority: g.priority,
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
		userId: userId,
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
			userId: actorId,
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
		userId: actorId,
	});
}

// --- Tasks ---

export async function getTaskById(id: string): Promise<Task | undefined> {
	const result = await getDb().select().from(tasks).where(eq(tasks.id, id));

	if (!result[0]) return undefined;

	return {
		id: result[0].id,
		title: result[0].title,
		description: result[0].description || undefined,
		status: result[0].status || "todo",
		priority: result[0].priority,
		projectId: result[0].project_id,
		parentId: result[0].parent_id,
		dueDate: result[0].due_date,
		planDate: result[0].plan_date,
		createdAt: result[0].created_at,
		updatedAt: result[0].updated_at,
		comments: [],
	};
}

export async function getTaskByIdForUser(
	id: string,
	userId: string,
): Promise<Task | undefined> {
	const result = await getDb()
		.select()
		.from(tasks)
		.where(and(eq(tasks.id, id), eq(tasks.userId, userId)));

	if (!result[0]) return undefined;

	// Fetch comments for this task
	const dbComments = await getDb()
		.select()
		.from(comments)
		.where(eq(comments.task_id, id));

	return {
		id: result[0].id,
		title: result[0].title,
		description: result[0].description || undefined,
		status: result[0].status || "todo",
		priority: result[0].priority,
		projectId: result[0].project_id,
		parentId: result[0].parent_id,
		dueDate: result[0].due_date,
		planDate: result[0].plan_date,
		createdAt: result[0].created_at,
		updatedAt: result[0].updated_at,
		comments: dbComments.map((c) => ({
			id: c.id,
			content: c.content,
			postedAt: c.posted_at,
			userId: c.userId || undefined,
			actorType: c.actorType || undefined,
		})),
	};
}

// --- Advanced Search ---

export interface TaskFilters {
	priority?: ("p1" | "p2" | "p3" | "p4")[];
	status?: ("todo" | "in_progress" | "review" | "done" | "cold")[];
	projectId?: string;
	parentId?: string | null; // UUID or null for top-level
	dueDateStr?: string; // "today", "overdue", "upcoming", or ISO date
	planDateStr?: string; // "today", "overdue", "upcoming", or ISO date
	search?: string; // title/description search
	lastActionType?: ActionType[]; // action type filter
	limit?: number; // max results to return
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

		// If they explicitly ask for active statuses but NOT "done",
		// also exclude done tasks
		if (!filters.status.includes("done")) {
			conditions.push(ne(tasks.status, "done"));
		}
	} else {
		// Default behavior: exclude 'cold' tasks from generic searches
		conditions.push(ne(tasks.status, "cold"));
	}

	// 3. Project
	if (filters.projectId) {
		if (filters.projectId === "inbox") {
			conditions.push(isNull(tasks.project_id));
		} else {
			conditions.push(eq(tasks.project_id, filters.projectId));
		}
	}

	// 4. Parent Task
	if (filters.parentId !== undefined) {
		if (filters.parentId === null) {
			conditions.push(isNull(tasks.parent_id));
		} else {
			conditions.push(eq(tasks.parent_id, filters.parentId));
		}
	}

	// 5. Text Search (title or description)
	if (filters.search) {
		const searchLower = `%${filters.search.toLowerCase()}%`;
		conditions.push(
			or(
				ilike(tasks.title, searchLower),
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
				and(lt(tasks.due_date, todayStart), ne(tasks.status, "done"))!,
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
				and(lt(tasks.plan_date, todayStart), ne(tasks.status, "done"))!,
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

	// 8. Last Action Logic
	if (filters.lastActionType && filters.lastActionType.length > 0) {
		const actionTypesList = sql.join(
			filters.lastActionType.map((t) => sql`${t}`),
			sql`, `,
		);
		const latestActionSubquery = sql`
      SELECT a.entity_id 
      FROM actions a
      WHERE a.entity_type = 'task'
      AND a.created_at = (
        SELECT MAX(created_at) FROM actions a2 WHERE a2.entity_id = a.entity_id AND a2.entity_type = 'task'
      )
      AND a.action_type IN (${actionTypesList})
    `;

		conditions.push(inArray(tasks.id, latestActionSubquery));
	}

	// Execute Query
	const query = getDb()
		.select()
		.from(tasks)
		.where(and(...conditions))
		.orderBy(tasks.priority, desc(tasks.created_at));

	const dbTasks = await (filters.limit
		? query.limit(filters.limit)
		: query.limit(100));

	// Fetch comments scoped to matched tasks only
	const taskIds = dbTasks.map((t) => t.id);
	const dbComments =
		taskIds.length > 0
			? await getDb()
					.select()
					.from(comments)
					.where(inArray(comments.task_id, taskIds))
			: [];
	const commentsByTaskId: Record<string, Comment[]> = {};
	for (const c of dbComments) {
		if (!commentsByTaskId[c.task_id]) {
			commentsByTaskId[c.task_id] = [];
		}
		commentsByTaskId[c.task_id].push({
			id: c.id,
			content: c.content,
			postedAt: c.posted_at,
			userId: c.userId || undefined,
			actorType: c.actorType || undefined,
		});
	}

	return dbTasks.map((t) => ({
		id: t.id,
		title: t.title,
		description: t.description || undefined,
		status: t.status || "todo",
		projectId: t.project_id,
		parentId: t.parent_id,
		priority: t.priority,
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
		.where(and(eq(tasks.userId, userId), ne(tasks.status, "cold")))
		.orderBy(tasks.priority, desc(tasks.created_at));

	// Fetch comments scoped to the user's tasks
	const taskIds = dbTasks.map((t) => t.id);
	const dbComments =
		taskIds.length > 0
			? await getDb()
					.select()
					.from(comments)
					.where(inArray(comments.task_id, taskIds))
			: [];

	const commentsByTaskId: Record<string, Comment[]> = {};
	for (const c of dbComments) {
		if (!commentsByTaskId[c.task_id]) {
			commentsByTaskId[c.task_id] = [];
		}
		commentsByTaskId[c.task_id].push({
			id: c.id,
			content: c.content,
			postedAt: c.posted_at,
			userId: c.userId || undefined,
			actorType: c.actorType || undefined,
		});
	}

	return dbTasks.map((t) => ({
		id: t.id,
		title: t.title,
		description: t.description || undefined,
		status: t.status || "todo",
		projectId: t.project_id,
		parentId: t.parent_id,
		priority: t.priority,
		dueDate: t.due_date,
		planDate: t.plan_date,
		createdAt: t.created_at,
		updatedAt: t.updated_at,
		comments: commentsByTaskId[t.id] || [],
	}));
}

export async function getBacklogTasks(userId: string): Promise<Task[]> {
	const dbTasks = await getDb()
		.select()
		.from(tasks)
		.where(and(eq(tasks.userId, userId), eq(tasks.status, "cold")))
		.orderBy(desc(tasks.created_at));

	const taskIds = dbTasks.map((t) => t.id);
	const dbComments =
		taskIds.length > 0
			? await getDb()
					.select()
					.from(comments)
					.where(inArray(comments.task_id, taskIds))
			: [];

	const commentsByTaskId: Record<string, Comment[]> = {};
	for (const c of dbComments) {
		if (!commentsByTaskId[c.task_id]) {
			commentsByTaskId[c.task_id] = [];
		}
		commentsByTaskId[c.task_id].push({
			id: c.id,
			content: c.content,
			postedAt: c.posted_at,
			userId: c.userId || undefined,
			actorType: c.actorType || undefined,
		});
	}

	return dbTasks.map((t) => ({
		id: t.id,
		title: t.title,
		description: t.description || undefined,
		status: t.status || "todo",
		projectId: t.project_id,
		parentId: t.parent_id,
		priority: t.priority,
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
	await getDb()
		.insert(tasks)
		.values({
			id: task.id,
			title: task.title,
			description: task.description || null,
			status: task.status,
			priority: task.priority,
			project_id: task.projectId || null,
			parent_id: task.parentId || null,
			due_date: task.dueDate,
			plan_date: task.planDate,
			created_at: task.createdAt,
			updated_at: task.updatedAt,
			userId: userId,
		});

	if (task.comments && task.comments.length > 0) {
		for (const c of task.comments) {
			await createComment(task.id, c, userId);
		}
	}

	logAction({
		entityId: task.id,
		entityType: "task",
		actorId: userId,
		actorType: actorType,
		actionType: "create",
		changes: { title: task.title },
		metadata: { title: task.title, tokenName },
		userId: userId,
	});
}

export async function createTasksBulk(
	tasksList: Task[],
	userId: string,
	actorType: ActorType = "user",
	tokenName?: string,
): Promise<void> {
	if (tasksList.length === 0) return;

	const values = tasksList.map((task) => ({
		id: task.id,
		title: task.title,
		description: task.description || null,
		status: task.status,
		priority: task.priority,
		project_id: task.projectId || null,
		parent_id: task.parentId || null,
		due_date: task.dueDate,
		plan_date: task.planDate,
		created_at: task.createdAt,
		updated_at: task.updatedAt,
		userId: userId,
	}));

	await getDb().insert(tasks).values(values);

	// Insert all comments if any
	const allComments = tasksList.flatMap((task) =>
		(task.comments || []).map((c) => ({
			id: c.id,
			content: c.content,
			posted_at: c.postedAt,
			task_id: task.id,
			userId: userId,
			actorType: actorType as "user" | "agent" | "system",
		})),
	);

	if (allComments.length > 0) {
		await getDb().insert(comments).values(allComments);
	}

	// Bulk log action
	const projectIds = [
		...new Set(tasksList.map((t) => t.projectId).filter(Boolean)),
	];
	const targetEntityId = projectIds[0] || tasksList[0].id;
	const targetEntityType = projectIds.length > 0 ? "project" : "task";

	logAction({
		entityId: targetEntityId,
		entityType: targetEntityType,
		actorId: userId,
		actorType: actorType,
		actionType: "update",
		changes: { tasks: `Bulk created ${tasksList.length} tasks` },
		metadata: {
			tokenName,
			message: `Created roadmap with ${tasksList.length} tasks`,
		},
		userId: userId,
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
	if (updates.title !== undefined) dbUpdates.title = updates.title;
	if (updates.description !== undefined)
		dbUpdates.description = updates.description;
	if (updates.status !== undefined) dbUpdates.status = updates.status;
	if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
	if (updates.projectId !== undefined) dbUpdates.project_id = updates.projectId;
	if (updates.parentId !== undefined) dbUpdates.parent_id = updates.parentId;
	if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
	if (updates.planDate !== undefined) dbUpdates.plan_date = updates.planDate;
	if (updates.updatedAt !== undefined) dbUpdates.updated_at = updates.updatedAt;

	if (Object.keys(dbUpdates).length > 0) {
		const result = await getDb()
			.update(tasks)
			.set(dbUpdates)
			.where(and(eq(tasks.id, id), eq(tasks.userId, actorId)))
			.returning({ title: tasks.title });

		const actionType: ActionType =
			updates.status === "done"
				? "complete"
				: updates.status !== undefined
					? "uncomplete"
					: "update";

		logAction({
			entityId: id,
			entityType: "task",
			actorId: actorId,
			actorType: actorType,
			actionType: actionType,
			changes: updates,
			metadata: { title: result[0]?.title, tokenName },
			userId: actorId,
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
		.where(and(eq(tasks.id, id), eq(tasks.userId, actorId)))
		.returning({ title: tasks.title });

	logAction({
		entityId: id,
		entityType: "task",
		actorId: actorId,
		actorType: actorType,
		actionType: "delete",
		metadata: { title: result[0]?.title, tokenName },
		userId: actorId,
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
	userId?: string,
	actorType?: "user" | "agent" | "system",
): Promise<void> {
	await getDb()
		.insert(comments)
		.values({
			id: comment.id,
			content: comment.content,
			posted_at: comment.postedAt,
			task_id: taskId,
			userId: userId || comment.userId,
			actorType: actorType || comment.actorType,
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
	const existingDbComments = await getDb()
		.select()
		.from(comments)
		.where(eq(comments.task_id, taskId));
	const existingIds = new Set(existingDbComments.map((c) => c.id));
	const newIds = new Set(newComments.map((c) => c.id));

	// Identify deletions
	const toDelete = existingDbComments.filter((c) => !newIds.has(c.id));
	for (const c of toDelete) {
		await deleteComment(c.id);
	}

	// Identify additions
	const toAdd = newComments.filter((c) => !existingIds.has(c.id));

	if (toAdd.length > 0) {
		const task = await getTaskById(taskId);
		const taskTitle = task?.title;

		for (const c of toAdd) {
			await createComment(taskId, c, actorId, actorType);

			logAction({
				entityId: taskId,
				entityType: "task",
				actorId: actorId,
				actorType: actorType,
				actionType: "update",
				changes: { comments: "added" },
				metadata: { commentId: c.id, title: taskTitle, tokenName },
				userId: actorId,
			});
		}
	}
}

// --- Project Deletion ---

export async function deleteProject(
	id: string,
	actorId: string,
	actorType: ActorType = "user",
	tokenName?: string,
): Promise<void> {
	// Tasks cascade-delete via FK, but we delete explicitly to be safe
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
		userId: actorId,
	});
}

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { logAction } from "@/lib/actions";
import type { MCPServerContext } from "@/lib/mcp/types";
import {
	createComment,
	createTask,
	createTasksBulk,
	deleteTask,
	getTaskById,
	getTaskByIdForUser,
	searchTasks,
	updateTask,
} from "@/lib/storage";
import type { Task } from "@/types";
import { commentSchema } from "@/types/task";

// --- Schema Definitions ---

const listTasksSchema = z.object({
	priority: z
		.array(z.enum(["p1", "p2", "p3", "p4"]))
		.optional()
		.describe(
			"Filter by priority. p1=High, p2=Medium, p3=Low, p4=None. Multiple values are OR'd.",
		),
	status: z
		.array(z.enum(["todo", "in_progress", "done", "cold"]))
		.optional()
		.describe(
			'Filter by status. NOTE: "review" is NOT valid here (only in create/update). Multiple values are OR\'d.',
		),

	projectId: z
		.string()
		.uuid()
		.optional()
		.describe(
			"Filter to a specific project by UUID. Use focus_list_inbox instead for tasks without a project.",
		),
	parentId: z
		.string()
		.uuid()
		.nullable()
		.optional()
		.describe(
			"Filter to subtasks of a specific parent task (by UUID), or pass null to only get top-level tasks.",
		),
	dueDate: z
		.union([z.enum(["today", "overdue", "upcoming"]), z.string()])
		.optional()
		.describe(
			'Filter by due date. "today"=due today, "overdue"=past due and not completed, "upcoming"=due after today, or an ISO date string for a specific day.',
		),
	planDate: z
		.union([z.enum(["today", "overdue", "upcoming"]), z.string()])
		.optional()
		.describe(
			'Filter by plan date. Same keywords as dueDate: "today", "overdue", "upcoming", or an ISO date string.',
		),
	search: z
		.string()
		.optional()
		.describe(
			"Case-insensitive text search across task title and description.",
		),
	limit: z
		.number()
		.int()
		.min(1)
		.max(100)
		.optional()
		.describe("Max results to return. Defaults to 10, max 100."),
	lastActionType: z
		.array(
			z.enum([
				"create",
				"update",
				"delete",
				"complete",
				"uncomplete",
				"reviewed",
				"groomed",
				"processed",
				"pending",
			]),
		)
		.optional()
		.describe(
			"Filter tasks by the type of their most recent action (e.g. ['processed', 'reviewed']). Multiple values are OR'd.",
		),
});

const createTaskSchema = z.object({
	title: z.string().min(1).max(200).describe("Task title. 1–200 characters."),
	priority: z
		.enum(["p1", "p2", "p3", "p4"])
		.describe("Priority level. p1=High, p2=Medium, p3=Low, p4=None."),
	description: z
		.string()
		.max(1000)
		.optional()
		.describe("Task description. Max 1000 characters."),
	projectId: z
		.string()
		.uuid()
		.optional()
		.describe("UUID of the project to assign to. Omit to create in inbox."),
	parentId: z
		.string()
		.uuid()
		.optional()
		.describe("UUID of the parent task, to create this as a subtask."),
	dueDate: z
		.string()
		.datetime()
		.optional()
		.describe("Deadline in ISO 8601 UTC format, e.g. 2026-02-20T17:00:00Z."),
	planDate: z
		.string()
		.datetime()
		.optional()
		.describe(
			"When you plan to work on this task. ISO 8601 UTC format, e.g. 2026-02-19T09:00:00Z.",
		),
	status: z
		.enum(["todo", "in_progress", "review", "done", "cold"])
		.optional()
		.describe('Task status. Defaults to "cold" (backlog) if omitted.'),
	orderNum: z
		.number()
		.optional()
		.describe("Order number for subtask ordering. Lower numbers appear first."),
});

const updateTaskSchema = z.object({
	id: z.string().uuid().describe("UUID of the task to update."),
	title: z
		.string()
		.min(1)
		.max(200)
		.optional()
		.describe("New title. 1–200 characters."),
	priority: z
		.enum(["p1", "p2", "p3", "p4"])
		.optional()
		.describe("New priority. p1=High, p2=Medium, p3=Low, p4=None."),
	description: z
		.string()
		.max(1000)
		.optional()
		.describe("New description. Max 1000 characters."),

	status: z
		.enum(["todo", "in_progress", "review", "done", "cold"])
		.optional()
		.describe("New status."),
	projectId: z
		.string()
		.uuid()
		.nullable()
		.optional()
		.describe(
			"Move to a project by UUID, or pass null to move to inbox (remove from project).",
		),
	parentId: z
		.string()
		.uuid()
		.nullable()
		.optional()
		.describe(
			"Move to a parent task by UUID, or pass null to become a top-level task.",
		),
	dueDate: z
		.string()
		.datetime()
		.nullable()
		.optional()
		.describe(
			"Set due date in ISO 8601 UTC, or pass null to clear the due date.",
		),
	planDate: z
		.string()
		.datetime()
		.nullable()
		.optional()
		.describe(
			"Set plan date in ISO 8601 UTC, or pass null to clear the plan date.",
		),
	orderNum: z
		.number()
		.optional()
		.describe(
			"Set order number for subtask ordering (lower numbers appear first).",
		),
});

const createProjectRoadmapSchema = z.object({
	projectId: z
		.string()
		.uuid()
		.describe(
			"UUID of the project where this roadmap belongs. Omit only if strictly intended for Inbox, though Roadmaps typically belong in projects.",
		),
	sections: z
		.array(
			z.object({
				title: z.string().min(1).max(200).describe("Section title"),
				description: z
					.string()
					.max(1000)
					.optional()
					.describe("Optional description"),
				priority: z
					.enum(["p1", "p2", "p3", "p4"])
					.optional()
					.describe("Defaults to p4"),
				subtasks: z
					.array(
						z.object({
							title: z.string().min(1).max(200).describe("Subtask title"),
							description: z
								.string()
								.max(1000)
								.optional()
								.describe("Optional description"),
							priority: z
								.enum(["p1", "p2", "p3", "p4"])
								.optional()
								.describe("Defaults to p4"),
							orderNum: z
								.number()
								.optional()
								.describe(
									"Order number for subtask ordering (lower numbers appear first).",
								),
						}),
					)
					.describe("Subtasks belonging to this section"),
			}),
		)
		.min(1)
		.describe("List of sections"),
});

const deleteTaskSchema = z.object({
	id: z.string().uuid().describe("UUID of the task to delete."),
});

const addCommentSchema = z.object({
	taskId: z.string().uuid().describe("UUID of the task to add a comment to."),
	content: z.string().min(1).describe("Comment text. Must not be empty."),
});

const listInboxSchema = z.object({
	priority: z
		.array(z.enum(["p1", "p2", "p3", "p4"]))
		.optional()
		.describe(
			"Filter by priority. p1=High, p2=Medium, p3=Low, p4=None. Multiple values are OR'd.",
		),
	status: z
		.array(z.enum(["todo", "in_progress", "done", "cold"]))
		.optional()
		.describe(
			'Filter by status. NOTE: "review" is NOT valid here (only in create/update). Multiple values are OR\'d.',
		),

	dueDate: z
		.union([z.enum(["today", "overdue", "upcoming"]), z.string()])
		.optional()
		.describe(
			'Filter by due date. "today"=due today, "overdue"=past due and not completed, "upcoming"=due after today, or an ISO date string.',
		),
	planDate: z
		.union([z.enum(["today", "overdue", "upcoming"]), z.string()])
		.optional()
		.describe(
			'Filter by plan date. Same keywords as dueDate: "today", "overdue", "upcoming", or an ISO date string.',
		),
	search: z
		.string()
		.optional()
		.describe(
			"Case-insensitive text search across task title and description.",
		),
	limit: z
		.number()
		.int()
		.min(1)
		.max(100)
		.optional()
		.describe("Max results to return. Defaults to 10, max 100."),
	lastActionType: z
		.array(
			z.enum([
				"create",
				"update",
				"delete",
				"complete",
				"uncomplete",
				"reviewed",
				"groomed",
				"processed",
				"pending",
			]),
		)
		.optional()
		.describe(
			"Filter tasks by the type of their most recent action (e.g. ['processed', 'reviewed']). Multiple values are OR'd.",
		),
});

// --- Tool Implementations ---

async function listTasks(
	args: unknown,
	context: MCPServerContext,
): Promise<{
	content: Array<{ type: string; text: string }>;
	isError?: boolean;
}> {
	try {
		const parsed = listTasksSchema.parse(args);

		const tasks = await searchTasks(context.user.id, {
			priority: parsed.priority,
			status: parsed.status,
			projectId: parsed.projectId,
			parentId: parsed.parentId,
			dueDateStr: parsed.dueDate,
			planDateStr: parsed.planDate,
			search: parsed.search,
			lastActionType: parsed.lastActionType as any,
			limit: parsed.limit ?? 10,
		});

		return {
			content: [
				{ type: "text", text: JSON.stringify({ success: true, data: tasks }) },
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text",
					text: error instanceof Error ? error.message : "Unknown error",
				},
			],
			isError: true,
		};
	}
}

async function listInbox(
	args: unknown,
	context: MCPServerContext,
): Promise<{
	content: Array<{ type: string; text: string }>;
	isError?: boolean;
}> {
	try {
		const parsed = listInboxSchema.parse(args);

		const inboxTasks = await searchTasks(context.user.id, {
			priority: parsed.priority,
			status: parsed.status,
			projectId: "inbox",
			dueDateStr: parsed.dueDate,
			planDateStr: parsed.planDate,
			search: parsed.search,
			lastActionType: parsed.lastActionType as any,
			limit: parsed.limit ?? 10,
		});

		return {
			content: [
				{
					type: "text",
					text: JSON.stringify({ success: true, data: inboxTasks }),
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text",
					text: error instanceof Error ? error.message : "Unknown error",
				},
			],
			isError: true,
		};
	}
}

export async function createTaskTool(
	args: unknown,
	context: MCPServerContext,
): Promise<{
	content: Array<{ type: string; text: string }>;
	isError?: boolean;
}> {
	try {
		const parsed = createTaskSchema.parse(args);

		const now = new Date();
		const task: Task = {
			id: randomUUID(),
			title: parsed.title,
			description: parsed.description,
			status: parsed.status ?? "cold",
			priority: parsed.priority,
			projectId: parsed.projectId ?? null,
			parentId: parsed.parentId ?? null,
			dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
			planDate: parsed.planDate ? new Date(parsed.planDate) : null,
			orderNum: parsed.orderNum ?? 0,
			createdAt: now,
			updatedAt: now,
			comments: [],
		};

		await createTask(task, context.user.id, "agent", context.tokenName);
		console.log("[MCP] createTaskTool context.tokenName:", context.tokenName);

		return {
			content: [
				{ type: "text", text: JSON.stringify({ success: true, data: task }) },
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text",
					text: error instanceof Error ? error.message : "Unknown error",
				},
			],
			isError: true,
		};
	}
}

export async function createProjectRoadmapTool(
	args: unknown,
	context: MCPServerContext,
): Promise<{
	content: Array<{ type: string; text: string }>;
	isError?: boolean;
}> {
	try {
		const parsed = createProjectRoadmapSchema.parse(args);
		const tasksToInsert: Task[] = [];
		const now = new Date();

		for (const section of parsed.sections) {
			const sectionId = randomUUID();

			// 1. Create the section task
			tasksToInsert.push({
				id: sectionId,
				title: section.title,
				description: section.description,
				status: "todo",
				priority: section.priority ?? "p4",
				projectId: parsed.projectId,
				parentId: null, // Top-level
				dueDate: null,
				planDate: null,
				orderNum: 0,
				createdAt: now,
				updatedAt: now,
				comments: [],
			});

			// 2. Create its subtasks
			for (const sub of section.subtasks) {
				tasksToInsert.push({
					id: randomUUID(),
					title: sub.title,
					description: sub.description,
					status: "todo",
					priority: sub.priority ?? "p4",
					projectId: parsed.projectId,
					parentId: sectionId, // Link to section
					dueDate: null,
					planDate: null,
					orderNum: sub.orderNum ?? 0,
					createdAt: now,
					updatedAt: now,
					comments: [],
				});
			}
		}

		await createTasksBulk(
			tasksToInsert,
			context.user.id,
			"agent",
			context.tokenName,
		);

		return {
			content: [
				{
					type: "text",
					text: JSON.stringify({
						success: true,
						message: `Successfully created ${tasksToInsert.length} roadmap items (sections and subtasks).`,
					}),
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text",
					text: error instanceof Error ? error.message : "Unknown error",
				},
			],
			isError: true,
		};
	}
}

export async function updateTaskTool(
	args: unknown,
	context: MCPServerContext,
): Promise<{
	content: Array<{ type: string; text: string }>;
	isError?: boolean;
}> {
	try {
		const parsed = updateTaskSchema.parse(args);

		const updates: Partial<Task> = {};

		if (parsed.title !== undefined) updates.title = parsed.title;
		if (parsed.description !== undefined)
			updates.description = parsed.description;
		if (parsed.priority !== undefined) updates.priority = parsed.priority;

		if (parsed.status !== undefined) updates.status = parsed.status;
		if (parsed.projectId !== undefined) updates.projectId = parsed.projectId;
		if (parsed.parentId !== undefined) updates.parentId = parsed.parentId;
		if (parsed.dueDate !== undefined)
			updates.dueDate = parsed.dueDate ? new Date(parsed.dueDate) : null;
		if (parsed.planDate !== undefined)
			updates.planDate = parsed.planDate ? new Date(parsed.planDate) : null;
		if (parsed.orderNum !== undefined) updates.orderNum = parsed.orderNum;
		updates.updatedAt = new Date();
		await updateTask(
			parsed.id,
			updates,
			context.user.id,
			"agent",
			context.tokenName,
		);

		return {
			content: [
				{
					type: "text",
					text: JSON.stringify({
						success: true,
						data: { id: parsed.id, ...updates },
					}),
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text",
					text: error instanceof Error ? error.message : "Unknown error",
				},
			],
			isError: true,
		};
	}
}

async function deleteTaskTool(
	args: unknown,
	context: MCPServerContext,
): Promise<{
	content: Array<{ type: string; text: string }>;
	isError?: boolean;
}> {
	try {
		const parsed = deleteTaskSchema.parse(args);

		await deleteTask(parsed.id, context.user.id, "agent", context.tokenName);

		return {
			content: [
				{
					type: "text",
					text: JSON.stringify({ success: true, id: parsed.id }),
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text",
					text: error instanceof Error ? error.message : "Unknown error",
				},
			],
			isError: true,
		};
	}
}

async function addCommentTool(
	args: unknown,
	context: MCPServerContext,
): Promise<{
	content: Array<{ type: string; text: string }>;
	isError?: boolean;
}> {
	try {
		const parsed = addCommentSchema.parse(args);

		const comment = commentSchema.parse({
			id: randomUUID(),
			content: parsed.content,
			postedAt: new Date(),
		});

		await createComment(parsed.taskId, comment, context.user.id, "agent");

		const task = await getTaskById(parsed.taskId);

		logAction({
			entityId: parsed.taskId,
			entityType: "task",
			actorId: context.user.id,
			actorType: "agent",
			actionType: "update",
			changes: { comments: "added" },
			metadata: {
				commentId: comment.id,
				title: task?.title,
				tokenName: context.tokenName,
			},
			userId: context.user.id,
		});

		return {
			content: [
				{
					type: "text",
					text: JSON.stringify({ success: true, data: comment }),
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text",
					text: error instanceof Error ? error.message : "Unknown error",
				},
			],
			isError: true,
		};
	}
}

// --- Get Task Tool ---

const getTaskSchema = z.object({
	id: z.string().uuid().describe("UUID of the task to retrieve."),
});

async function getTaskTool(
	args: unknown,
	context: MCPServerContext,
): Promise<{
	content: Array<{ type: string; text: string }>;
	isError?: boolean;
}> {
	try {
		const parsed = getTaskSchema.parse(args);

		const task = await getTaskByIdForUser(parsed.id, context.user.id);

		if (!task) {
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify({
							success: false,
							error: "Task not found or access denied",
						}),
					},
				],
				isError: true,
			};
		}

		return {
			content: [
				{ type: "text", text: JSON.stringify({ success: true, data: task }) },
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text",
					text: error instanceof Error ? error.message : "Unknown error",
				},
			],
			isError: true,
		};
	}
}

// --- Export Tools Array ---

export const taskTools = [
	{
		name: "focus_list_tasks",
		description:
			"List and search tasks with filters. Returns: Array of Task objects (default 10, max 100). Use focus_list_projects to get valid projectId values. Note: status filter excludes 'review'.",
		schema: listTasksSchema,
		handler: listTasks,
	},
	{
		name: "focus_list_inbox",
		description:
			"List tasks without a project (inbox). Returns: Array of Task objects (default 10, max 100). Use when: You need unassigned tasks. For project tasks, use focus_list_tasks.",
		schema: listInboxSchema,
		handler: listInbox,
	},
	{
		name: "focus_get_task",
		description:
			"Get a single task by ID. Returns: Complete Task object with comments. Use after creating/updating a task to verify, or to check current state of a known task.",
		schema: getTaskSchema,
		handler: getTaskTool,
	},
	{
		name: "focus_create_task",
		description:
			"Create a new task with title and priority. Returns: Complete Task with generated id, status defaults to 'todo'. Use focus_list_projects first to get valid projectId.",
		schema: createTaskSchema,
		handler: createTaskTool,
	},
	{
		name: "focus_create_project_roadmap",
		description:
			"Bulk create a complete roadmap structure (Sections + Subtasks) in a single operation. Use this instead of focus_create_task in a loop when planning a project or learning path.",
		schema: createProjectRoadmapSchema,
		handler: createProjectRoadmapTool,
	},
	{
		name: "focus_update_task",
		description:
			"Update an existing task by ID. Returns: Updated Task object. Partial update: only include changed fields. Set nullable fields to null to clear (projectId, dueDate, planDate).",
		schema: updateTaskSchema,
		handler: updateTaskTool,
	},
	{
		name: "focus_delete_task",
		description:
			"Delete a task by ID. Returns: { success: boolean, id: string }.",
		schema: deleteTaskSchema,
		handler: deleteTaskTool,
	},
	{
		name: "focus_add_task_comment",
		description:
			"Add a comment to a task. Returns: Comment object. Logs action to activity feed.",
		schema: addCommentSchema,
		handler: addCommentTool,
	},
] as const;

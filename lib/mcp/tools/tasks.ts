import { randomUUID } from "node:crypto";
import { z } from "zod";
import { logAction } from "@/lib/actions";
import type { MCPServerContext } from "@/lib/mcp/types";
import {
	createComment,
	createTask,
	deleteTask,
	getTaskById,
	searchTasks,
	updateTask,
} from "@/lib/storage";
import type { Task } from "@/types";
import { commentSchema } from "@/types/task";

// --- Schema Definitions ---

const listTasksSchema = z.object({
	priority: z.array(z.enum(["p1", "p2", "p3", "p4"])).optional(),
	status: z.array(z.enum(["todo", "in_progress", "done"])).optional(),
	completed: z.boolean().optional(),
	projectId: z.string().uuid().optional(),
	dueDate: z
		.union([z.enum(["today", "overdue", "upcoming"]), z.string()])
		.optional(),
	planDate: z
		.union([z.enum(["today", "overdue", "upcoming"]), z.string()])
		.optional(),
	search: z.string().optional(),
});

const createTaskSchema = z.object({
	title: z.string().min(1).max(200),
	priority: z.enum(["p1", "p2", "p3", "p4"]),
	description: z.string().max(1000).optional(),
	projectId: z.string().uuid().optional(),
	dueDate: z.string().datetime().optional(),
	planDate: z.string().datetime().optional(),
	status: z.enum(["todo", "in_progress", "review", "done"]).optional(),
});

const updateTaskSchema = z.object({
	id: z.string().uuid(),
	title: z.string().min(1).max(200).optional(),
	priority: z.enum(["p1", "p2", "p3", "p4"]).optional(),
	description: z.string().max(1000).optional(),
	completed: z.boolean().optional(),
	status: z.enum(["todo", "in_progress", "review", "done"]).optional(),
	projectId: z.string().uuid().nullable().optional(),
	dueDate: z.string().datetime().nullable().optional(),
	planDate: z.string().datetime().nullable().optional(),
});

const deleteTaskSchema = z.object({
	id: z.string().uuid(),
});

const addCommentSchema = z.object({
	taskId: z.string().uuid(),
	content: z.string().min(1),
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
			completed: parsed.completed,
			projectId: parsed.projectId,
			dueDateStr: parsed.dueDate,
			planDateStr: parsed.planDate,
			search: parsed.search,
		});

		return {
			content: [{ type: "text", text: JSON.stringify(tasks, null, 2) }],
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

async function createTaskTool(
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
			completed: false,
			status: parsed.status ?? "todo",
			priority: parsed.priority,
			projectId: parsed.projectId ?? null,
			dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
			planDate: parsed.planDate ? new Date(parsed.planDate) : null,
			createdAt: now,
			updatedAt: now,
			comments: [],
		};

		await createTask(task, context.user.id, "agent");

		return {
			content: [{ type: "text", text: JSON.stringify(task, null, 2) }],
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

async function updateTaskTool(
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
		if (parsed.completed !== undefined) updates.completed = parsed.completed;
		if (parsed.status !== undefined) updates.status = parsed.status;
		if (parsed.projectId !== undefined) updates.projectId = parsed.projectId;
		if (parsed.dueDate !== undefined)
			updates.dueDate = parsed.dueDate ? new Date(parsed.dueDate) : null;
		if (parsed.planDate !== undefined)
			updates.planDate = parsed.planDate ? new Date(parsed.planDate) : null;
		updates.updatedAt = new Date();

		await updateTask(parsed.id, updates, context.user.id, "agent");

		return {
			content: [
				{
					type: "text",
					text: JSON.stringify({ id: parsed.id, ...updates }, null, 2),
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

		await deleteTask(parsed.id, context.user.id, "agent");

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

		await createComment(parsed.taskId, comment);

		const task = await getTaskById(parsed.taskId);

		logAction({
			entityId: parsed.taskId,
			entityType: "task",
			actorId: context.user.id,
			actorType: "agent",
			actionType: "update",
			changes: { comments: "added" },
			metadata: { commentId: comment.id, title: task?.title },
		});

		return {
			content: [{ type: "text", text: JSON.stringify(comment, null, 2) }],
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
			"List and search tasks. Supports filters for priority, status, due date, plan date, and text search.",
		schema: listTasksSchema,
		handler: listTasks,
	},
	{
		name: "focus_create_task",
		description: "Create a new task with title, priority, and optional fields",
		schema: createTaskSchema,
		handler: createTaskTool,
	},
	{
		name: "focus_update_task",
		description: "Update an existing task by ID",
		schema: updateTaskSchema,
		handler: updateTaskTool,
	},
	{
		name: "focus_delete_task",
		description: "Delete a task by ID",
		schema: deleteTaskSchema,
		handler: deleteTaskTool,
	},
	{
		name: "focus_add_task_comment",
		description: "Add a comment to a task",
		schema: addCommentSchema,
		handler: addCommentTool,
	},
] as const;

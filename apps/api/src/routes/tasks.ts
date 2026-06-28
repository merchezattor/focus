import {
	createTask,
	deleteTask,
	getTaskByIdForUser,
	getTaskCounts,
	searchTasks,
	syncComments,
	type TaskFilters,
	updateTask,
} from "@focus/core/storage";
import { type Task, taskSchema } from "@focus/core/types";
import { Hono } from "hono";
import { z } from "zod";
import { type AppEnv, requireAuth } from "../auth-context";

// Schema for creating a task (id, createdAt, updatedAt are generated server-side)
const createTaskSchema = taskSchema
	.omit({
		id: true,
		createdAt: true,
		updatedAt: true,
		completedAt: true,
	})
	.extend({
		projectId: z
			.string()
			.uuid()
			.or(z.literal("inbox"))
			.or(z.literal("backlog"))
			.nullable()
			.or(z.literal("")),
		dueDate: z
			.string()
			.datetime()
			.nullable()
			.optional()
			.transform((val: string | null | undefined) =>
				val ? new Date(val) : null,
			),
		planDate: z
			.string()
			.datetime()
			.nullable()
			.optional()
			.transform((val: string | null | undefined) =>
				val ? new Date(val) : null,
			),
		status: z
			.enum(["todo", "in_progress", "review", "done", "cold"])
			.optional(),
		orderNum: z.number().optional(),
	});

// Schema for updating a task via PUT (all fields optional, id separate)
const taskUpdateSchema = z
	.object({
		title: z.string().min(1).max(200).optional(),
		description: z.string().max(1000).optional(),
		projectId: z.string().uuid().nullable().optional(),
		parentId: z.string().uuid().nullable().optional(),
		dueDate: z
			.string()
			.datetime()
			.nullable()
			.optional()
			.transform((val: string | null | undefined) =>
				val ? new Date(val) : null,
			),
		planDate: z
			.string()
			.datetime()
			.nullable()
			.optional()
			.transform((val: string | null | undefined) =>
				val ? new Date(val) : null,
			),
		priority: z.enum(["p1", "p2", "p3", "p4"]).optional(),
		status: z
			.enum(["todo", "in_progress", "review", "done", "cold", "archived"])
			.optional(),
		orderNum: z.number().optional(),
		completedAt: z
			.string()
			.datetime()
			.nullable()
			.optional()
			.transform((val: string | null | undefined) =>
				val ? new Date(val) : null,
			),
	})
	.strict();

const validStatuses = [
	"todo",
	"in_progress",
	"review",
	"done",
	"cold",
	"archived",
] as const;
const validActionTypes = [
	"create",
	"update",
	"delete",
	"complete",
	"uncomplete",
	"reviewed",
	"groomed",
	"processed",
	"pending",
] as const;
const validPriorities = ["p1", "p2", "p3", "p4"] as const;

export const tasksRouter = new Hono<AppEnv>();

tasksRouter.use("*", requireAuth);

// GET /api/tasks/search - advanced filtering
tasksRouter.get("/search", async (c) => {
	try {
		const { user } = c.get("auth");
		const filters: TaskFilters = {};

		const priorityParam = c.req.query("priority");
		if (priorityParam) {
			const parsed = priorityParam
				.split(",")
				.filter((v): v is (typeof validPriorities)[number] =>
					validPriorities.includes(v as (typeof validPriorities)[number]),
				);
			if (parsed.length === 0) {
				return c.json({ error: "Invalid priority values" }, 400);
			}
			filters.priority = parsed;
		}

		const statusParam = c.req.query("status");
		if (statusParam) {
			const parsed = statusParam
				.split(",")
				.filter((v): v is (typeof validStatuses)[number] =>
					validStatuses.includes(v as (typeof validStatuses)[number]),
				);
			if (parsed.length === 0) {
				return c.json({ error: "Invalid status values" }, 400);
			}
			filters.status = parsed;
		}

		const projectIdParam = c.req.query("projectId");
		if (projectIdParam) filters.projectId = projectIdParam;

		const dueDateParam = c.req.query("dueDate");
		if (dueDateParam) filters.dueDateStr = dueDateParam;

		const planDateParam = c.req.query("planDate");
		if (planDateParam) filters.planDateStr = planDateParam;

		const searchParam = c.req.query("search");
		if (searchParam) filters.search = searchParam;

		const tasks = await searchTasks(user.id, filters);
		return c.json({ tasks });
	} catch (error) {
		console.error("Failed to search tasks:", error);
		return c.json({ error: "Failed to search tasks" }, 500);
	}
});

// GET /api/tasks/counts - per-status counts for the sidebar
tasksRouter.get("/counts", async (c) => {
	try {
		const { user } = c.get("auth");
		const counts = await getTaskCounts(user.id);
		return c.json({ counts });
	} catch (error) {
		console.error("Failed to get task counts:", error);
		return c.json({ error: "Failed to get task counts" }, 500);
	}
});

// GET /api/tasks - list (optionally filtered)
tasksRouter.get("/", async (c) => {
	try {
		const { user } = c.get("auth");

		const projectId = c.req.query("projectId") ?? null;
		const dueDateStr = c.req.query("dueDateStr") || undefined;
		const lastActionTypeParam = c.req.query("lastActionType");
		const lastActionType = lastActionTypeParam
			? lastActionTypeParam
					.split(",")
					.filter((v): v is (typeof validActionTypes)[number] =>
						validActionTypes.includes(v as (typeof validActionTypes)[number]),
					)
			: undefined;
		const statusParam = c.req.query("status");
		const status = statusParam
			? statusParam
					.split(",")
					.filter((v): v is (typeof validStatuses)[number] =>
						validStatuses.includes(v as (typeof validStatuses)[number]),
					)
			: undefined;

		let tasks = await searchTasks(user.id, {
			dueDateStr,
			lastActionType,
			status,
		});

		if (projectId) {
			if (projectId === "inbox") {
				tasks = tasks.filter((task: Task) => task.projectId === null);
			} else {
				tasks = tasks.filter((task: Task) => task.projectId === projectId);
			}
		}

		return c.json({ tasks });
	} catch (error) {
		console.error("Failed to read tasks:", error);
		return c.json({ error: "Failed to read tasks" }, 500);
	}
});

// POST /api/tasks - create
tasksRouter.post("/", async (c) => {
	try {
		const { user, actorType, tokenName } = c.get("auth");
		const body = await c.req.json();

		const result = createTaskSchema.safeParse(body);
		if (!result.success) {
			return c.json(
				{ error: "Invalid task data", details: result.error.format() },
				400,
			);
		}

		const isInbox =
			result.data.projectId === "inbox" ||
			result.data.projectId === null ||
			result.data.projectId === "";

		const status = result.data.status ?? (isInbox ? "cold" : "todo");

		const newTask: Task = {
			...result.data,
			id: crypto.randomUUID(),
			createdAt: new Date(),
			updatedAt: new Date(),
			completedAt: status === "done" ? new Date() : null,
			comments: [],
			status,
			orderNum: result.data.orderNum ?? 0,
			projectId:
				result.data.projectId === "inbox" || result.data.projectId === ""
					? null
					: result.data.projectId,
		};

		await createTask(newTask, user.id, actorType, tokenName);

		return c.json({ task: newTask }, 201);
	} catch (error) {
		console.error("Failed to create task:", error);
		return c.json({ error: "Failed to create task" }, 500);
	}
});

// PUT /api/tasks - update (id in body)
tasksRouter.put("/", async (c) => {
	try {
		const { user, actorType, tokenName } = c.get("auth");
		const body = await c.req.json();
		const { id, ...data } = body;

		if (!id) {
			return c.json({ error: "Task ID is required" }, 400);
		}

		const result = taskUpdateSchema.safeParse(data);
		if (!result.success) {
			return c.json(
				{ error: "Invalid task data", details: result.error.format() },
				400,
			);
		}

		await updateTask(id, result.data, user.id, actorType, tokenName);
		return c.json({ success: true });
	} catch (error) {
		console.error("Failed to update task:", error);
		return c.json({ error: "Failed to update task" }, 500);
	}
});

// GET /api/tasks/:id
tasksRouter.get("/:id", async (c) => {
	try {
		const { user } = c.get("auth");
		const id = c.req.param("id");

		const task = await getTaskByIdForUser(id, user.id);
		if (!task) {
			return c.json({ error: "Task not found" }, 404);
		}
		return c.json({ task });
	} catch (error) {
		console.error("Failed to get task:", error);
		return c.json({ error: "Failed to get task" }, 500);
	}
});

// PATCH /api/tasks/:id
const patchTaskSchema = taskSchema.partial().extend({
	dueDate: z
		.union([z.string(), z.date(), z.null()])
		.optional()
		.transform((val: string | Date | null | undefined) =>
			typeof val === "string" ? new Date(val) : val,
		),
	planDate: z
		.union([z.string(), z.date(), z.null()])
		.optional()
		.transform((val: string | Date | null | undefined) =>
			typeof val === "string" ? new Date(val) : val,
		),
	completedAt: z
		.union([z.string(), z.date(), z.null()])
		.optional()
		.transform((val: string | Date | null | undefined) =>
			typeof val === "string" ? new Date(val) : val,
		),
	status: z.enum(["todo", "in_progress", "review", "done", "cold"]).optional(),
	comments: z
		.array(
			z.object({
				id: z.string().uuid(),
				content: z.string(),
				postedAt: z
					.union([z.string(), z.date()])
					.transform((val) => new Date(val)),
			}),
		)
		.optional(),
});

tasksRouter.patch("/:id", async (c) => {
	try {
		const { user, actorType, tokenName } = c.get("auth");
		const id = c.req.param("id");
		const body = await c.req.json();

		const result = patchTaskSchema.safeParse(body);
		if (!result.success) {
			return c.json(
				{ error: "Invalid update data", details: result.error.format() },
				400,
			);
		}

		await updateTask(id, result.data, user.id, actorType, tokenName);

		if (result.data.comments) {
			await syncComments(
				id,
				result.data.comments,
				user.id,
				actorType,
				tokenName,
			);
		}

		const updatedResponse = { ...result.data, id, updatedAt: new Date() };
		return c.json({ task: updatedResponse });
	} catch (error) {
		console.error("Failed to update task:", error);
		return c.json({ error: "Failed to update task" }, 500);
	}
});

// DELETE /api/tasks/:id
tasksRouter.delete("/:id", async (c) => {
	try {
		const { user, actorType, tokenName } = c.get("auth");
		const id = c.req.param("id");

		await deleteTask(id, user.id, actorType, tokenName);
		return c.json({ success: true });
	} catch (error) {
		console.error("Failed to delete task:", error);
		return c.json({ error: "Failed to delete task" }, 500);
	}
});

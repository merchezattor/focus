import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { createTask, searchTasks, updateTask } from "@/lib/storage";
import { type Task, taskSchema } from "@/types";

// Schema for creating a task (id, createdAt, updatedAt are generated server-side)
const createTaskSchema = taskSchema
	.omit({
		id: true,
		createdAt: true,
		updatedAt: true,
		completedAt: true,
	})
	.extend({
		// Accept string or null for projectId (client sends string, we convert)
		projectId: z
			.string()
			.uuid()
			.or(z.literal("inbox"))
			.or(z.literal("backlog"))
			.nullable()
			.or(z.literal("")),
		// Accept string or null for dueDate (client sends ISO string)
		dueDate: z
			.string()
			.datetime()
			.nullable()
			.optional()
			.transform((val: string | null | undefined) =>
				val ? new Date(val) : null,
			),
		// Accept string or null for planDate (client sends ISO string)
		planDate: z
			.string()
			.datetime()
			.nullable()
			.optional()
			.transform((val: string | null | undefined) =>
				val ? new Date(val) : null,
			),
		// Optional status override - client can specify initial status
		status: z
			.enum(["todo", "in_progress", "review", "done", "cold"])
			.optional(),
		// Optional order number for subtask ordering
		orderNum: z.number().optional(),
	});

// Schema for updating a task (all fields optional, id required separately)
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

// Valid enum values for search params
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

// GET /api/tasks - Get all tasks (optionally filtered by project)
export async function GET(request: NextRequest) {
	try {
		const auth = await getAuthenticatedUser(request);

		if (!auth) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		const { user } = auth;

		const { searchParams } = new URL(request.url);
		const projectId = searchParams.get("projectId");

		const dueDateStr = searchParams.get("dueDateStr") || undefined;
		const lastActionTypeParam = searchParams.get("lastActionType");
		const lastActionType = lastActionTypeParam
			? lastActionTypeParam
					.split(",")
					.filter((v): v is (typeof validActionTypes)[number] =>
						validActionTypes.includes(v as (typeof validActionTypes)[number]),
					)
			: undefined;
		const statusParam = searchParams.get("status");
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

		// Filter by project if specified
		if (projectId) {
			if (projectId === "inbox") {
				tasks = tasks.filter((task: Task) => task.projectId === null);
			} else {
				tasks = tasks.filter((task: Task) => task.projectId === projectId);
			}
		}

		return NextResponse.json({ tasks });
	} catch (error) {
		console.error("Failed to read tasks:", error);
		return NextResponse.json(
			{ error: "Failed to read tasks" },
			{ status: 500 },
		);
	}
}

// POST /api/tasks - Create new task
export async function POST(request: NextRequest) {
	try {
		const auth = await getAuthenticatedUser(request);

		if (!auth) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		const { user, actorType } = auth;

		const body = await request.json();

		// Validate request body
		const result = createTaskSchema.safeParse(body);
		if (!result.success) {
			return NextResponse.json(
				{ error: "Invalid task data", details: result.error.format() },
				{ status: 400 },
			);
		}

		// Use client-provided status if available, otherwise fall back to existing logic
		const isInbox =
			result.data.projectId === "inbox" ||
			result.data.projectId === null ||
			result.data.projectId === "";

		// Determine status: client override > context-based default
		const status = result.data.status ?? (isInbox ? "cold" : "todo");

		// Add new task with generated id and timestamps
		const newTask: Task = {
			...result.data,
			id: crypto.randomUUID(),
			createdAt: new Date(),
			updatedAt: new Date(),
			completedAt: status === "done" ? new Date() : null,
			comments: [],
			status,
			orderNum: result.data.orderNum ?? 0,
			// Convert special project IDs to null
			projectId:
				result.data.projectId === "inbox" || result.data.projectId === ""
					? null
					: result.data.projectId,
		};

		await createTask(newTask, user.id, actorType, auth.tokenName);

		return NextResponse.json({ task: newTask }, { status: 201 });
	} catch (error) {
		console.error("Failed to create task:", error);
		return NextResponse.json(
			{ error: "Failed to create task" },
			{ status: 500 },
		);
	}
}
// PUT /api/tasks - Update task
export async function PUT(request: NextRequest) {
	try {
		const auth = await getAuthenticatedUser(request);

		if (!auth) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		const { user, actorType } = auth;

		const body = await request.json();
		const { id, ...data } = body;

		if (!id) {
			return NextResponse.json(
				{ error: "Task ID is required" },
				{ status: 400 },
			);
		}

		const result = taskUpdateSchema.safeParse(data);
		if (!result.success) {
			return NextResponse.json(
				{ error: "Invalid task data", details: result.error.format() },
				{ status: 400 },
			);
		}

		await updateTask(id, result.data, user.id, actorType, auth.tokenName);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to update task:", error);
		return NextResponse.json(
			{ error: "Failed to update task" },
			{ status: 500 },
		);
	}
}

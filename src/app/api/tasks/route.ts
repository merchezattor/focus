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
	});

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

		// Parse advanced filters
		const dueDateStr = searchParams.get("dueDateStr") || undefined;
		const lastActionTypeParam = searchParams.get("lastActionType");
		const lastActionType = lastActionTypeParam
			? (lastActionTypeParam.split(",") as any[])
			: undefined;
		const statusParam = searchParams.get("status");
		const status = statusParam ? (statusParam.split(",") as any[]) : undefined;

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
			comments: [],
			status,
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

		// Basic validation (can improve with Zod schema for updates)
		// For now trust the partial update but sanitized via storage function types
		await updateTask(id, data, user.id, actorType, auth.tokenName);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to update task:", error);
		return NextResponse.json(
			{ error: "Failed to update task" },
			{ status: 500 },
		);
	}
}

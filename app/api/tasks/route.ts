import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { createTask, readTasks, updateTask } from "@/lib/storage";
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
		projectId: z.string().uuid().nullable().or(z.literal("")),
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
	});

// GET /api/tasks - Get all tasks (optionally filtered by project)
export async function GET(request: NextRequest) {
	try {
		const user = await getAuthenticatedUser(request);

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const projectId = searchParams.get("projectId");

		let tasks = await readTasks(user.id);

		// Filter by project if specified
		if (projectId) {
			tasks = tasks.filter((task) => task.projectId === projectId);
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
		const user = await getAuthenticatedUser(request);

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();

		// Validate request body
		const result = createTaskSchema.safeParse(body);
		if (!result.success) {
			return NextResponse.json(
				{ error: "Invalid task data", details: result.error.format() },
				{ status: 400 },
			);
		}

		// Add new task with generated id and timestamps
		const newTask: Task = {
			...result.data,
			id: crypto.randomUUID(),
			createdAt: new Date(),
			updatedAt: new Date(),
			comments: [],
		};

		await createTask(newTask, user.id);

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
		const user = await getAuthenticatedUser(request);

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

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
		await updateTask(id, data, user.id);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to update task:", error);
		return NextResponse.json(
			{ error: "Failed to update task" },
			{ status: 500 },
		);
	}
}

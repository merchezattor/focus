import { HttpResponse, http } from "msw";

export interface Task {
	id: string;
	title: string;
	description?: string;
	completed: boolean;
	projectId: string | null;
	dueDate: string | null;
	planDate: string | null;
	priority: "p1" | "p2" | "p3" | "p4";
	status: "todo" | "in_progress" | "review" | "done";
	comments: Array<{
		id: string;
		content: string;
		postedAt: string;
	}>;
	createdAt: string;
	updatedAt: string;
}

const tasks: Task[] = [];

function createTask(data: Partial<Task>): Task {
	const now = new Date().toISOString();
	return {
		id: crypto.randomUUID(),
		title: data.title ?? "New Task",
		description: data.description,
		completed: data.completed ?? false,
		projectId: data.projectId ?? null,
		dueDate: data.dueDate ?? null,
		planDate: data.planDate ?? null,
		priority: data.priority ?? "p3",
		status: data.status ?? "todo",
		comments: data.comments ?? [],
		createdAt: now,
		updatedAt: now,
	};
}

const _mockUser = {
	id: "00000000-0000-0000-0000-000000000001",
	email: "test@example.com",
	name: "Test User",
};

function _isAuthorized(headers: Headers): boolean {
	const authHeader = headers.get("authorization");
	return authHeader === "Bearer test-token";
}

export const handlers = [
	http.get("/api/tasks", ({ request }) => {
		const url = new URL(request.url);
		const projectId = url.searchParams.get("projectId");

		let filteredTasks = [...tasks];

		if (projectId) {
			filteredTasks = filteredTasks.filter(
				(task) => task.projectId === projectId,
			);
		}

		return HttpResponse.json({ tasks: filteredTasks });
	}),

	http.post("/api/tasks", async ({ request }) => {
		const body = (await request.json()) as Record<string, unknown>;

		if (!body.title || typeof body.title !== "string") {
			return HttpResponse.json(
				{
					error: "Invalid task data",
					details: { title: { _errors: ["Required"] } },
				},
				{ status: 400 },
			);
		}

		const newTask = createTask({
			title: body.title,
			description: body.description as string | undefined,
			completed: body.completed as boolean | undefined,
			projectId: body.projectId as string | null | undefined,
			dueDate: body.dueDate as string | null | undefined,
			planDate: body.planDate as string | null | undefined,
			priority: body.priority as "p1" | "p2" | "p3" | "p4" | undefined,
			status: body.status as
				| "todo"
				| "in_progress"
				| "review"
				| "done"
				| undefined,
		});

		tasks.push(newTask);

		return HttpResponse.json({ task: newTask }, { status: 201 });
	}),
];

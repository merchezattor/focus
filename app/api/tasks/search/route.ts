import { type NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { type TaskFilters, searchTasks } from "@/lib/storage";

export async function GET(request: NextRequest) {
	try {
		const auth = await getAuthenticatedUser(request);

		if (!auth) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		const { user } = auth;

		const { searchParams } = new URL(request.url);

		// Parse params
		const filters: TaskFilters = {};

		// Priority (p1, p2...)
		const priorityParam = searchParams.get("priority");
		if (priorityParam) {
			filters.priority = priorityParam.split(",") as any[];
		}

		// Status (todo, done...)
		const statusParam = searchParams.get("status");
		if (statusParam) {
			filters.status = statusParam.split(",") as any[];
		}

		// Completed (true/false)
		const completedParam = searchParams.get("completed");
		if (completedParam !== null) {
			filters.completed = completedParam === "true";
		}

		// Project
		const projectIdParam = searchParams.get("projectId");
		if (projectIdParam) {
			filters.projectId = projectIdParam;
		}

		// Due Date (today, overdue, upcoming, YYYY-MM-DD)
		const dueDateParam = searchParams.get("dueDate");
		if (dueDateParam) {
			filters.dueDateStr = dueDateParam;
		}

		// Search (text)
		const searchParam = searchParams.get("search");
		if (searchParam) {
			filters.search = searchParam;
		}

		const tasks = await searchTasks(user.id, filters);

		return NextResponse.json({ tasks });
	} catch (error) {
		console.error("Failed to search tasks:", error);
		return NextResponse.json(
			{ error: "Failed to search tasks" },
			{ status: 500 },
		);
	}
}

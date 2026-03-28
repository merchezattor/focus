import { type NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { searchTasks, type TaskFilters } from "@/lib/storage";

const validPriorities = ["p1", "p2", "p3", "p4"] as const;
const validStatuses = [
	"todo",
	"in_progress",
	"review",
	"done",
	"cold",
	"archived",
] as const;

export async function GET(request: NextRequest) {
	try {
		const auth = await getAuthenticatedUser(request);

		if (!auth) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		const { user } = auth;

		const { searchParams } = new URL(request.url);

		const filters: TaskFilters = {};

		const priorityParam = searchParams.get("priority");
		if (priorityParam) {
			const parsed = priorityParam
				.split(",")
				.filter((v): v is (typeof validPriorities)[number] =>
					validPriorities.includes(v as (typeof validPriorities)[number]),
				);
			if (parsed.length === 0) {
				return NextResponse.json(
					{ error: "Invalid priority values" },
					{ status: 400 },
				);
			}
			filters.priority = parsed;
		}

		const statusParam = searchParams.get("status");
		if (statusParam) {
			const parsed = statusParam
				.split(",")
				.filter((v): v is (typeof validStatuses)[number] =>
					validStatuses.includes(v as (typeof validStatuses)[number]),
				);
			if (parsed.length === 0) {
				return NextResponse.json(
					{ error: "Invalid status values" },
					{ status: 400 },
				);
			}
			filters.status = parsed;
		}

		const projectIdParam = searchParams.get("projectId");
		if (projectIdParam) {
			filters.projectId = projectIdParam;
		}

		const dueDateParam = searchParams.get("dueDate");
		if (dueDateParam) {
			filters.dueDateStr = dueDateParam;
		}

		const planDateParam = searchParams.get("planDate");
		if (planDateParam) {
			filters.planDateStr = planDateParam;
		}

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

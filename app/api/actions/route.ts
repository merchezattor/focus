import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { type EntityType, getActions, markActionsRead } from "@/lib/actions";
import { getAuthenticatedUser } from "@/lib/api-auth";

// GET /api/actions
export async function GET(request: NextRequest) {
	try {
		const user = await getAuthenticatedUser(request);
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const limit = searchParams.get("limit")
			? parseInt(searchParams.get("limit")!)
			: 50;
		const isRead = searchParams.has("isRead")
			? searchParams.get("isRead") === "true"
			: undefined;
		const entityType = searchParams.get("entityType") as EntityType | undefined;
		const entityId = searchParams.get("entityId") || undefined;

		const actions = await getActions({
			userId: user.id,
			limit,
			isRead,
			entityType,
			entityId,
		});

		return NextResponse.json({ actions });
	} catch (error) {
		console.error("Failed to get actions:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}

// POST /api/actions/read
// Body: { ids: string[] }
const markReadSchema = z.object({
	ids: z.array(z.string()),
});

export async function POST(request: NextRequest) {
	try {
		const user = await getAuthenticatedUser(request);
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const result = markReadSchema.safeParse(body);

		if (!result.success) {
			return NextResponse.json(
				{ error: "Invalid request body", details: result.error.format() },
				{ status: 400 },
			);
		}

		await markActionsRead(result.data.ids);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to mark actions as read:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}

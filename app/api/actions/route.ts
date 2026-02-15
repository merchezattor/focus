import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { type EntityType, getActions, markActionsRead } from "@/lib/actions";
import { getAuthenticatedUser } from "@/lib/api-auth";

// GET /api/actions
export async function GET(request: NextRequest) {
	try {
		const auth = await getAuthenticatedUser(request);
		if (!auth) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		const { user } = auth;

		const { searchParams } = new URL(request.url);
		const limit = searchParams.get("limit")
			? parseInt(searchParams.get("limit")!, 10)
			: 50;
		const isRead = searchParams.has("isRead")
			? searchParams.get("isRead") === "true"
			: undefined;
		const entityType = searchParams.get("entityType") as EntityType | undefined;
		const entityId = searchParams.get("entityId") || undefined;
		// Allow filtering by actorType (e.g. "user", "agent")
		const actorType = (searchParams.get("actorType") as any) || undefined;
		// If requesting own actions (actorType=user), we must set includeOwn=true
		const includeOwn =
			actorType === "user" || searchParams.get("includeOwn") === "true";

		const actions = await getActions({
			userId: user.id,
			limit,
			isRead,
			entityType,
			entityId,
			actorType,
			includeOwn,
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
		const auth = await getAuthenticatedUser(request);
		if (!auth) {
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

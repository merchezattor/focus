import { type NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { createGoal, deleteGoal, readGoals, updateGoal } from "@/lib/storage";
import { goalSchema } from "@/types/goal";

// Schema for updating - partial
const updateGoalSchema = goalSchema.partial().omit({ id: true });

export async function GET(req: NextRequest) {
	try {
		const auth = await getAuthenticatedUser(req);

		if (!auth) {
			return NextResponse.json(
				{ Unauthorized: "Unauthorized" },
				{ status: 401 },
			);
		}
		const { user } = auth;

		const goals = await readGoals(user.id);
		return NextResponse.json({ goals });
	} catch (error) {
		console.error("[GOALS_GET]", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	try {
		const auth = await getAuthenticatedUser(req);

		if (!auth) {
			return NextResponse.json(
				{ Unauthorized: "Unauthorized" },
				{ status: 401 },
			);
		}
		const { user, actorType } = auth;

		const json = await req.json();

		// Server-side validation/defaults
		const body = {
			...json,
			id: crypto.randomUUID(),
			createdAt: new Date(),
			updatedAt: new Date(),
			// Parse dates if they are strings
			dueDate: json.dueDate ? new Date(json.dueDate) : undefined,
		};

		const result = goalSchema.safeParse(body);

		if (!result.success) {
			return new NextResponse(JSON.stringify(result.error), { status: 400 });
		}

		await createGoal(result.data, user.id, actorType, auth.tokenName);

		return NextResponse.json({ goal: result.data }, { status: 201 });
	} catch (error) {
		console.error("[GOALS_POST]", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}

export async function PUT(req: NextRequest) {
	try {
		const auth = await getAuthenticatedUser(req);

		if (!auth) {
			return NextResponse.json(
				{ Unauthorized: "Unauthorized" },
				{ status: 401 },
			);
		}
		const { user, actorType } = auth;

		const json = await req.json();
		const { id, ...data } = json;

		if (!id) return new NextResponse("Goal ID required", { status: 400 });

		const result = updateGoalSchema.safeParse(data);
		if (!result.success) {
			return new NextResponse(JSON.stringify(result.error), { status: 400 });
		}

		await updateGoal(id, result.data, user.id, actorType, auth.tokenName);
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[GOALS_PUT]", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}

export async function DELETE(req: NextRequest) {
	try {
		const auth = await getAuthenticatedUser(req);

		if (!auth) {
			return NextResponse.json(
				{ Unauthorized: "Unauthorized" },
				{ status: 401 },
			);
		}
		const { user, actorType } = auth;

		const { searchParams } = new URL(req.url);
		const id = searchParams.get("id");

		if (!id) return new NextResponse("Goal ID required", { status: 400 });

		await deleteGoal(id, user.id, actorType, auth.tokenName);
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[GOALS_DELETE]", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { createApiToken, listApiTokens } from "@/lib/storage";

export async function GET(request: NextRequest) {
	const auth = await getAuthenticatedUser(request);

	if (!auth) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const tokens = await listApiTokens(auth.user.id);
	return NextResponse.json(tokens);
}

export async function POST(request: NextRequest) {
	const auth = await getAuthenticatedUser(request);

	if (!auth) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = await request.json();
	const { name } = body;

	if (!name || typeof name !== "string" || name.trim().length === 0) {
		return NextResponse.json({ error: "Name is required" }, { status: 400 });
	}

	if (name.length > 50) {
		return NextResponse.json(
			{ error: "Name must be 50 characters or less" },
			{ status: 400 },
		);
	}

	const token = await createApiToken(auth.user.id, name.trim());
	return NextResponse.json(token, { status: 201 });
}

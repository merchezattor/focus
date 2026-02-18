import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { deleteApiToken } from "@/lib/storage";

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const auth = await getAuthenticatedUser(request);

	if (!auth) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { id } = await params;

	if (!id) {
		return NextResponse.json(
			{ error: "Token ID is required" },
			{ status: 400 },
		);
	}

	await deleteApiToken(id, auth.user.id);
	return new NextResponse(null, { status: 204 });
}

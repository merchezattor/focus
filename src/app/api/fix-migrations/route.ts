import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";

// TEMPORARY: Run this once to fix migration tracking, then delete this file
export async function POST(request: NextRequest) {
	// Add simple auth check - use a secret from env
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${process.env.MIGRATION_FIX_SECRET}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const db = getDb();

		// Insert migration records
		await db.execute(`
			INSERT INTO "__drizzle_migrations" (hash, created_at) 
			VALUES 
				('0000_odd_doomsday', NOW()),
				('0001_aberrant_inertia', NOW())
			ON CONFLICT DO NOTHING
		`);

		return NextResponse.json({
			success: true,
			message: "Migration tracking fixed",
		});
	} catch (error) {
		console.error("Failed to fix migrations:", error);
		return NextResponse.json(
			{
				error: "Failed to fix migrations",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}

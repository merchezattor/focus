import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { apiTokens, user } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function getAuthenticatedUser(request: NextRequest) {
	// 1. Try Session Auth (Cookies)
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (session) {
			return session.user;
		}
	} catch (_e) {
		// ignore session error
	}

	// 2. Try Bearer Token (API)
	const authHeader = request.headers.get("Authorization");
	if (authHeader?.startsWith("Bearer ")) {
		const token = authHeader.split(" ")[1];

		const apiToken = await db.query.apiTokens.findFirst({
			where: eq(apiTokens.token, token),
		});

		if (apiToken) {
			// Fetch real user details
			const dbUser = await db.query.user.findFirst({
				where: eq(user.id, apiToken.userId),
			});

			if (dbUser) return dbUser;
		}
	}

	return null;
}

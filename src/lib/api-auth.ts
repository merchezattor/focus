import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { getDb } from "@/db";
import { apiTokens, user } from "@/db/schema";
import type { ActorType } from "@/lib/actions";
import { auth } from "@/lib/auth";

export async function getAuthenticatedUser(request: NextRequest) {
	// 1. Try Session Auth (Cookies) -> Actor = user
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (session) {
			return { user: session.user, actorType: "user" as ActorType };
		}
	} catch (_e) {
		// ignore session error
	}

	// 2. Try Bearer Token (API) -> Actor = agent
	const authHeader = request.headers.get("Authorization");
	if (authHeader?.startsWith("Bearer ")) {
		const token = authHeader.split(" ")[1];

		const apiToken = await getDb().query.apiTokens.findFirst({
			where: eq(apiTokens.token, token),
		});

		if (apiToken) {
			// Fetch real user details
			const dbUser = await getDb().query.user.findFirst({
				where: eq(user.id, apiToken.userId),
			});

			if (dbUser) {
				return {
					user: dbUser,
					actorType: "agent" as ActorType,
					tokenName: apiToken.name,
				};
			}
		}
	}

	return null;
}

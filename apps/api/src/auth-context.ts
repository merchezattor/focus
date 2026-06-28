import type { ActorType } from "@focus/core/actions";
import { auth } from "@focus/core/auth";
import { hashToken } from "@focus/core/crypto";
import { getDb } from "@focus/core/db";
import { apiTokens, user as userTable } from "@focus/core/schema";
import { eq } from "drizzle-orm";
import type { Context, MiddlewareHandler } from "hono";

export interface AuthUser {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	image: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface AuthResult {
	user: AuthUser;
	actorType: ActorType;
	tokenName?: string;
}

export type AppEnv = { Variables: { auth: AuthResult } };

/**
 * Resolve the caller's identity, mirroring the original Next `api-auth.ts`:
 *   1. better-auth session cookie  -> actor = "user"
 *   2. `Authorization: Bearer <token>` -> actor = "agent"
 */
export async function getAuthenticatedUser(
	c: Context,
): Promise<AuthResult | null> {
	// 1. Session auth (cookies)
	try {
		const session = await auth.api.getSession({ headers: c.req.raw.headers });
		if (session) {
			const u = session.user;
			return {
				user: {
					id: u.id,
					name: u.name ?? "",
					email: u.email,
					emailVerified: u.emailVerified,
					image: u.image ?? null,
					createdAt: u.createdAt,
					updatedAt: u.updatedAt,
				},
				actorType: "user",
			};
		}
	} catch {
		// ignore session errors, fall through to token auth
	}

	// 2. Bearer token (API) -> actor = agent
	const authHeader = c.req.header("Authorization");
	if (authHeader?.startsWith("Bearer ")) {
		const token = authHeader.split(" ")[1];
		const tokenHash = hashToken(token);

		const apiToken = await getDb().query.apiTokens.findFirst({
			where: eq(apiTokens.token, tokenHash),
		});

		if (apiToken) {
			const dbUser = await getDb().query.user.findFirst({
				where: eq(userTable.id, apiToken.userId),
			});

			if (dbUser) {
				return {
					user: {
						id: dbUser.id,
						name: dbUser.name,
						email: dbUser.email,
						emailVerified: dbUser.emailVerified,
						image: dbUser.image,
						createdAt: dbUser.createdAt,
						updatedAt: dbUser.updatedAt,
					},
					actorType: "agent",
					tokenName: apiToken.name,
				};
			}
		}
	}

	return null;
}

/** Hono middleware: 401s unauthenticated requests, otherwise sets `c.var.auth`. */
export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
	const result = await getAuthenticatedUser(c);
	if (!result) {
		return c.json({ error: "Unauthorized" }, 401);
	}
	c.set("auth", result);
	await next();
};

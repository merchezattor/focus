"use server";

import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb } from "@/db";
import { apiTokens } from "@/db/schema";
import { auth } from "@/lib/auth";
import { createApiToken, deleteApiToken, listApiTokens } from "@/lib/storage";

/**
 * @deprecated Use listUserTokens() instead for multi-token support
 */
export async function getApiToken() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	if (!session) return null;

	const token = await getDb().query.apiTokens.findFirst({
		where: eq(apiTokens.userId, session.user.id),
	});

	return token?.token || null;
}

export async function generateApiToken() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	if (!session) throw new Error("Unauthorized");

	// Generate simple token: "focus_" prefix + 24 random bytes (48 hex chars)
	const newToken = `focus_${randomBytes(24).toString("hex")}`;

	const existing = await getDb().query.apiTokens.findFirst({
		where: eq(apiTokens.userId, session.user.id),
	});

	if (existing) {
		await getDb()
			.update(apiTokens)
			.set({
				token: newToken,
				createdAt: new Date(),
				name: existing.name || "Default Token",
			})
			.where(eq(apiTokens.id, existing.id));
	} else {
		await getDb().insert(apiTokens).values({
			id: crypto.randomUUID(),
			token: newToken,
			userId: session.user.id,
			name: "Default Token",
		});
	}

	return newToken;
}

export async function listUserTokens(): Promise<
	Array<{ id: string; name: string; createdAt: Date }>
> {
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	if (!session) throw new Error("Unauthorized");

	return listApiTokens(session.user.id);
}

export async function createUserToken(name: string): Promise<{
	id: string;
	name: string;
	token: string;
	createdAt: Date;
}> {
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	if (!session) throw new Error("Unauthorized");

	return createApiToken(session.user.id, name);
}

export async function deleteUserToken(id: string): Promise<void> {
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	if (!session) throw new Error("Unauthorized");

	return deleteApiToken(id, session.user.id);
}

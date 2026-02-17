"use server";

import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { apiTokens } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function getApiToken() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	if (!session) return null;

	const token = await db.query.apiTokens.findFirst({
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

	const existing = await db.query.apiTokens.findFirst({
		where: eq(apiTokens.userId, session.user.id),
	});

	if (existing) {
		await db
			.update(apiTokens)
			.set({ token: newToken, createdAt: new Date() })
			.where(eq(apiTokens.id, existing.id));
	} else {
		await db.insert(apiTokens).values({
			id: crypto.randomUUID(),
			token: newToken,
			userId: session.user.id,
		});
	}

	return newToken;
}

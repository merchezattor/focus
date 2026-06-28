// SPA replacement for the former Next server actions in `src/actions/auth.ts`.
// Token management now goes through the REST API at /api/tokens.
import { apiGet } from "@/lib/api";

export interface ApiTokenSummary {
	id: string;
	name: string;
	createdAt: Date;
}

export async function listUserTokens(): Promise<ApiTokenSummary[]> {
	const tokens =
		await apiGet<Array<{ id: string; name: string; createdAt: string }>>(
			"/api/tokens",
		);
	return tokens.map((t) => ({
		id: t.id,
		name: t.name,
		createdAt: new Date(t.createdAt),
	}));
}

export async function createUserToken(name: string): Promise<{
	id: string;
	name: string;
	token: string;
	createdAt: string;
}> {
	const res = await fetch("/api/tokens", {
		method: "POST",
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name }),
	});
	if (!res.ok) throw new Error("Failed to create token");
	return res.json();
}

export async function deleteUserToken(id: string): Promise<void> {
	const res = await fetch(`/api/tokens/${id}`, {
		method: "DELETE",
		credentials: "include",
	});
	if (!res.ok) throw new Error("Failed to delete token");
}

import {
	createApiToken,
	deleteApiToken,
	listApiTokens,
} from "@focus/core/storage";
import { Hono } from "hono";
import { type AppEnv, requireAuth } from "../auth-context";

export const tokensRouter = new Hono<AppEnv>();

tokensRouter.use("*", requireAuth);

tokensRouter.get("/", async (c) => {
	try {
		const { user } = c.get("auth");
		const tokens = await listApiTokens(user.id);
		return c.json(tokens);
	} catch (error) {
		console.error("Failed to list tokens:", error);
		return c.json({ error: "Failed to list tokens" }, 500);
	}
});

tokensRouter.post("/", async (c) => {
	try {
		const { user } = c.get("auth");
		const body = await c.req.json();
		const { name } = body;

		if (!name || typeof name !== "string" || name.trim().length === 0) {
			return c.json({ error: "Name is required" }, 400);
		}
		if (name.length > 50) {
			return c.json({ error: "Name must be 50 characters or less" }, 400);
		}

		const token = await createApiToken(user.id, name.trim());
		return c.json(token, 201);
	} catch (error) {
		console.error("Failed to create token:", error);
		return c.json({ error: "Failed to create token" }, 500);
	}
});

tokensRouter.delete("/:id", async (c) => {
	try {
		const { user } = c.get("auth");
		const id = c.req.param("id");

		if (!id) {
			return c.json({ error: "Token ID is required" }, 400);
		}

		await deleteApiToken(id, user.id);
		return c.body(null, 204);
	} catch (error) {
		console.error("Failed to delete token:", error);
		return c.json({ error: "Failed to delete token" }, 500);
	}
});

import {
	type EntityType,
	getActions,
	markActionsRead,
	markAllActionsRead,
} from "@focus/core/actions";
import { Hono } from "hono";
import { z } from "zod";
import { type AppEnv, requireAuth } from "../auth-context";

const markReadSchema = z.union([
	z.object({ ids: z.array(z.string()) }),
	z.object({ markAll: z.literal(true) }),
]);

export const actionsRouter = new Hono<AppEnv>();

actionsRouter.use("*", requireAuth);

actionsRouter.get("/", async (c) => {
	try {
		const { user } = c.get("auth");

		const limitParam = c.req.query("limit");
		const limit = limitParam ? parseInt(limitParam, 10) : 50;
		const isReadParam = c.req.query("isRead");
		const isRead =
			isReadParam !== undefined ? isReadParam === "true" : undefined;
		const entityType = c.req.query("entityType") as EntityType | undefined;
		const entityId = c.req.query("entityId") || undefined;
		const actorType = c.req.query("actorType") as
			| "user"
			| "agent"
			| "system"
			| undefined;
		const includeOwn =
			actorType === "user" || c.req.query("includeOwn") === "true";

		const actions = await getActions({
			userId: user.id,
			limit,
			isRead,
			entityType,
			entityId,
			actorType,
			includeOwn,
		});

		return c.json({ actions });
	} catch (error) {
		console.error("Failed to get actions:", error);
		return c.json({ error: "Internal Server Error" }, 500);
	}
});

actionsRouter.post("/", async (c) => {
	try {
		const { user } = c.get("auth");
		const body = await c.req.json();
		const result = markReadSchema.safeParse(body);

		if (!result.success) {
			return c.json(
				{ error: "Invalid request body", details: result.error.format() },
				400,
			);
		}

		if ("markAll" in result.data && result.data.markAll) {
			await markAllActionsRead(user.id);
		} else if ("ids" in result.data) {
			await markActionsRead(result.data.ids);
		}

		return c.json({ success: true });
	} catch (error) {
		console.error("Failed to mark actions as read:", error);
		return c.json({ error: "Internal Server Error" }, 500);
	}
});

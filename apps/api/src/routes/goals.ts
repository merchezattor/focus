import {
	createGoal,
	deleteGoal,
	readGoals,
	updateGoal,
} from "@focus/core/storage";
import { goalSchema } from "@focus/core/types/goal";
import { Hono } from "hono";
import { type AppEnv, requireAuth } from "../auth-context";

const updateGoalSchema = goalSchema.partial().omit({ id: true });

export const goalsRouter = new Hono<AppEnv>();

goalsRouter.use("*", requireAuth);

goalsRouter.get("/", async (c) => {
	try {
		const { user } = c.get("auth");
		const goals = await readGoals(user.id);
		return c.json({ goals });
	} catch (error) {
		console.error("[GOALS_GET]", error);
		return c.json({ error: "Internal Server Error" }, 500);
	}
});

goalsRouter.post("/", async (c) => {
	try {
		const { user, actorType, tokenName } = c.get("auth");
		const json = await c.req.json();

		const body = {
			...json,
			id: crypto.randomUUID(),
			createdAt: new Date(),
			updatedAt: new Date(),
			dueDate: json.dueDate ? new Date(json.dueDate) : undefined,
		};

		const result = goalSchema.safeParse(body);
		if (!result.success) {
			return c.json(
				{ error: "Invalid goal data", details: result.error.format() },
				400,
			);
		}

		await createGoal(result.data, user.id, actorType, tokenName);
		return c.json({ goal: result.data }, 201);
	} catch (error) {
		console.error("[GOALS_POST]", error);
		return c.json({ error: "Internal Server Error" }, 500);
	}
});

goalsRouter.put("/", async (c) => {
	try {
		const { user, actorType, tokenName } = c.get("auth");
		const json = await c.req.json();
		const { id, ...data } = json;

		if (!id) {
			return c.json({ error: "Goal ID is required" }, 400);
		}

		const result = updateGoalSchema.safeParse(data);
		if (!result.success) {
			return c.json(
				{ error: "Invalid goal data", details: result.error.format() },
				400,
			);
		}

		await updateGoal(id, result.data, user.id, actorType, tokenName);
		return c.json({ success: true });
	} catch (error) {
		console.error("[GOALS_PUT]", error);
		return c.json({ error: "Internal Server Error" }, 500);
	}
});

goalsRouter.delete("/", async (c) => {
	try {
		const { user, actorType, tokenName } = c.get("auth");
		const id = c.req.query("id");

		if (!id) {
			return c.json({ error: "Goal ID is required" }, 400);
		}

		await deleteGoal(id, user.id, actorType, tokenName);
		return c.json({ success: true });
	} catch (error) {
		console.error("[GOALS_DELETE]", error);
		return c.json({ error: "Internal Server Error" }, 500);
	}
});

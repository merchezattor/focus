import {
	createMilestone,
	deleteMilestone,
	readMilestones,
	updateMilestone,
} from "@focus/core/storage";
import { type Milestone, milestoneSchema } from "@focus/core/types";
import { Hono } from "hono";
import { z } from "zod";
import { type AppEnv, requireAuth } from "../auth-context";

const createMilestoneSchema = milestoneSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
	targetDate: true,
});

const milestoneDateSchema = z.object({
	targetDate: z
		.string()
		.datetime()
		.transform((value) => new Date(value)),
});

const updateMilestoneSchema = z.object({
	title: z.string().min(1).max(200).optional(),
	description: z.string().max(1000).optional(),
	targetDate: z
		.string()
		.datetime()
		.optional()
		.transform((value) => (value ? new Date(value) : undefined)),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
});

export const milestonesRouter = new Hono<AppEnv>();

milestonesRouter.use("*", requireAuth);

milestonesRouter.get("/", async (c) => {
	try {
		const { user } = c.get("auth");
		const milestones = await readMilestones(user.id);
		return c.json({ milestones });
	} catch (error) {
		console.error("Failed to read milestones:", error);
		return c.json({ error: "Failed to read milestones" }, 500);
	}
});

milestonesRouter.post("/", async (c) => {
	try {
		const { user, actorType, tokenName } = c.get("auth");
		const body = await c.req.json();

		const fieldsResult = createMilestoneSchema.safeParse(body);
		const dateResult = milestoneDateSchema.safeParse(body);

		if (!fieldsResult.success || !dateResult.success) {
			return c.json(
				{
					error: "Invalid milestone data",
					details: {
						fields: fieldsResult.success
							? undefined
							: fieldsResult.error.format(),
						targetDate: dateResult.success
							? undefined
							: dateResult.error.format(),
					},
				},
				400,
			);
		}

		const newMilestone: Milestone = {
			...fieldsResult.data,
			id: crypto.randomUUID(),
			targetDate: dateResult.data.targetDate,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		await createMilestone(newMilestone, user.id, actorType, tokenName);
		return c.json({ milestone: newMilestone }, 201);
	} catch (error) {
		console.error("Failed to create milestone:", error);
		return c.json({ error: "Failed to create milestone" }, 500);
	}
});

milestonesRouter.put("/", async (c) => {
	try {
		const { user, actorType, tokenName } = c.get("auth");
		const body = await c.req.json();
		const { id, ...data } = body;

		if (!id) {
			return c.json({ error: "Milestone ID is required" }, 400);
		}

		const result = updateMilestoneSchema.safeParse(data);
		if (!result.success) {
			return c.json(
				{ error: "Invalid milestone data", details: result.error.format() },
				400,
			);
		}

		await updateMilestone(id, result.data, user.id, actorType, tokenName);
		return c.json({ success: true });
	} catch (error) {
		console.error("Failed to update milestone:", error);
		return c.json({ error: "Failed to update milestone" }, 500);
	}
});

milestonesRouter.delete("/", async (c) => {
	try {
		const { user, actorType, tokenName } = c.get("auth");
		const id = c.req.query("id");

		if (!id) {
			return c.json({ error: "Milestone ID is required" }, 400);
		}

		await deleteMilestone(id, user.id, actorType, tokenName);
		return c.json({ success: true });
	} catch (error) {
		console.error("Failed to delete milestone:", error);
		return c.json({ error: "Failed to delete milestone" }, 500);
	}
});

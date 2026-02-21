import { z } from "zod";
import type { MCPToolHandler } from "@/lib/mcp/types";
import { createGoal, deleteGoal, readGoals, updateGoal } from "@/lib/storage";
import type { Goal } from "@/types/goal";

/**
 * Generate a new UUID for goal IDs
 */
function generateId(): string {
	return crypto.randomUUID();
}

// Input validation schemas
const listGoalsSchema = z.object({});

const createGoalSchema = z.object({
	name: z.string().min(1).max(100).describe("Goal name. 1–100 characters."),
	priority: z
		.enum(["p1", "p2", "p3", "p4"])
		.describe("Priority level. p1=High, p2=Medium, p3=Low, p4=None."),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.describe('Hex color code in #RRGGBB format, e.g. "#4F46E5".'),
	description: z.string().optional().describe("Goal description."),
	dueDate: z
		.string()
		.datetime()
		.optional()
		.describe(
			"Goal deadline in ISO 8601 UTC format, e.g. 2026-03-31T23:59:59Z.",
		),
});

const updateGoalSchema = z.object({
	id: z.string().uuid().describe("UUID of the goal to update."),
	name: z
		.string()
		.min(1)
		.max(100)
		.optional()
		.describe("New goal name. 1–100 characters."),
	priority: z
		.enum(["p1", "p2", "p3", "p4"])
		.optional()
		.describe("New priority. p1=High, p2=Medium, p3=Low, p4=None."),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.optional()
		.describe('New hex color code in #RRGGBB format, e.g. "#10B981".'),
	description: z.string().optional().describe("New goal description."),
	dueDate: z
		.string()
		.datetime()
		.nullable()
		.optional()
		.describe(
			"Set deadline in ISO 8601 UTC, or pass null to clear the deadline.",
		),
});

const deleteGoalSchema = z.object({
	id: z.string().uuid().describe("UUID of the goal to delete."),
});

// Tool definitions
export const focus_list_goals = {
	name: "focus_list_goals",
	description: "List all goals",
	schema: listGoalsSchema,
} as const;

export const focus_create_goal = {
	name: "focus_create_goal",
	description: "Create a new goal",
	schema: createGoalSchema,
} as const;

export const focus_update_goal = {
	name: "focus_update_goal",
	description: "Update a goal",
	schema: updateGoalSchema,
} as const;

export const focus_delete_goal = {
	name: "focus_delete_goal",
	description: "Delete a goal",
	schema: deleteGoalSchema,
} as const;

// Handler implementations

const handleListGoals: MCPToolHandler<z.infer<typeof listGoalsSchema>> = async (
	_args,
	context,
) => {
	try {
		const goals = await readGoals(context.user.id);
		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify({ success: true, data: goals }, null, 2),
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text" as const,
					text: `Error listing goals: ${error instanceof Error ? error.message : "Unknown error"}`,
				},
			],
			isError: true,
		};
	}
};

const handleCreateGoal: MCPToolHandler<
	z.infer<typeof createGoalSchema>
> = async (args, context) => {
	try {
		const goal: Goal = {
			id: generateId(),
			name: args.name,
			description: args.description,
			priority: args.priority,
			color: args.color,
			dueDate: args.dueDate ? new Date(args.dueDate) : undefined,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		await createGoal(
			goal,
			context.user.id,
			context.actorType,
			context.tokenName,
		);

		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify({ success: true, data: goal }),
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text" as const,
					text: `Error creating goal: ${error instanceof Error ? error.message : "Unknown error"}`,
				},
			],
			isError: true,
		};
	}
};

const handleUpdateGoal: MCPToolHandler<
	z.infer<typeof updateGoalSchema>
> = async (args, context) => {
	try {
		const updates: Partial<Goal> = {};

		if (args.name !== undefined) updates.name = args.name;
		if (args.priority !== undefined) updates.priority = args.priority;
		if (args.color !== undefined) updates.color = args.color;
		if (args.description !== undefined) updates.description = args.description;
		if (args.dueDate !== undefined)
			updates.dueDate = args.dueDate ? new Date(args.dueDate) : undefined;

		await updateGoal(
			args.id,
			updates,
			context.user.id,
			context.actorType,
			context.tokenName,
		);

		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify({
						success: true,
						data: { id: args.id, ...updates },
					}),
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text" as const,
					text: `Error updating goal: ${error instanceof Error ? error.message : "Unknown error"}`,
				},
			],
			isError: true,
		};
	}
};

const handleDeleteGoal: MCPToolHandler<
	z.infer<typeof deleteGoalSchema>
> = async (args, context) => {
	try {
		await deleteGoal(
			args.id,
			context.user.id,
			context.actorType,
			context.tokenName,
		);

		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify({ success: true, id: args.id }),
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text" as const,
					text: `Error deleting goal: ${error instanceof Error ? error.message : "Unknown error"}`,
				},
			],
			isError: true,
		};
	}
};

// Export tools array
export const goalTools = [
	{
		name: "focus_list_goals",
		description: "List all goals",
		schema: listGoalsSchema,
		handler: handleListGoals,
	},
	{
		name: "focus_create_goal",
		description: "Create a new goal",
		schema: createGoalSchema,
		handler: handleCreateGoal,
	},
	{
		name: "focus_update_goal",
		description: "Update a goal",
		schema: updateGoalSchema,
		handler: handleUpdateGoal,
	},
	{
		name: "focus_delete_goal",
		description: "Delete a goal",
		schema: deleteGoalSchema,
		handler: handleDeleteGoal,
	},
];

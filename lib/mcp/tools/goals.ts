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
	name: z.string().min(1).max(100),
	priority: z.enum(["p1", "p2", "p3", "p4"]),
	color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
	description: z.string().optional(),
	dueDate: z.string().datetime().optional(),
});

const updateGoalSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1).max(100).optional(),
	priority: z.enum(["p1", "p2", "p3", "p4"]).optional(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.optional(),
	description: z.string().optional(),
	dueDate: z.string().datetime().nullable().optional(),
});

const deleteGoalSchema = z.object({
	id: z.string().uuid(),
});

// Tool definitions
export const focus_list_goals = {
	name: "focus_list_goals",
	description: "List all goals",
	inputSchema: listGoalsSchema,
} as const;

export const focus_create_goal = {
	name: "focus_create_goal",
	description: "Create a new goal",
	inputSchema: createGoalSchema,
} as const;

export const focus_update_goal = {
	name: "focus_update_goal",
	description: "Update a goal",
	inputSchema: updateGoalSchema,
} as const;

export const focus_delete_goal = {
	name: "focus_delete_goal",
	description: "Delete a goal",
	inputSchema: deleteGoalSchema,
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
					text: JSON.stringify(goals, null, 2),
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

		await createGoal(goal, context.user.id, context.actorType);

		return {
			content: [
				{
					type: "text" as const,
					text: `Goal created successfully with ID: ${goal.id}`,
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

		await updateGoal(args.id, updates, context.user.id, context.actorType);

		return {
			content: [
				{
					type: "text" as const,
					text: `Goal ${args.id} updated successfully`,
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
		await deleteGoal(args.id, context.user.id, context.actorType);

		return {
			content: [
				{
					type: "text" as const,
					text: `Goal ${args.id} deleted successfully`,
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
		tool: focus_list_goals,
		handler: handleListGoals,
	},
	{
		tool: focus_create_goal,
		handler: handleCreateGoal,
	},
	{
		tool: focus_update_goal,
		handler: handleUpdateGoal,
	},
	{
		tool: focus_delete_goal,
		handler: handleDeleteGoal,
	},
];

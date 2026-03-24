import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { MCPResponse, MCPToolHandler } from "@/lib/mcp/types";
import {
	createMilestone,
	deleteMilestone,
	readMilestones,
	updateMilestone,
} from "@/lib/storage";
import type { Milestone } from "@/types";

const listMilestonesInputSchema = z.object({});

const createMilestoneInputSchema = z.object({
	title: z
		.string()
		.min(1)
		.max(200)
		.describe("Milestone title. 1-200 characters."),
	description: z
		.string()
		.max(1000)
		.optional()
		.describe("Optional milestone description."),
	targetDate: z
		.string()
		.datetime()
		.describe(
			"Milestone date as an ISO 8601 timestamp. Treated as a calendar day in the UI.",
		),
});

const updateMilestoneInputSchema = z.object({
	id: z.string().uuid().describe("UUID of the milestone to update."),
	title: z
		.string()
		.min(1)
		.max(200)
		.optional()
		.describe("New milestone title. 1-200 characters."),
	description: z
		.string()
		.max(1000)
		.optional()
		.describe("New milestone description."),
	targetDate: z
		.string()
		.datetime()
		.optional()
		.describe(
			"New milestone date as an ISO 8601 timestamp. Treated as a calendar day in the UI.",
		),
});

const deleteMilestoneInputSchema = z.object({
	id: z.string().uuid().describe("UUID of the milestone to delete."),
});

export const focusListMilestones: MCPToolHandler<
	z.infer<typeof listMilestonesInputSchema>
> = async (_args, context): Promise<MCPResponse> => {
	try {
		const milestones = await readMilestones(context.user.id);
		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify({ success: true, data: milestones }),
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text" as const,
					text: `Error listing milestones: ${
						error instanceof Error ? error.message : "Unknown error"
					}`,
				},
			],
			isError: true,
		};
	}
};

export const focusCreateMilestone: MCPToolHandler<
	z.infer<typeof createMilestoneInputSchema>
> = async (args, context): Promise<MCPResponse> => {
	try {
		const now = new Date();
		const milestone: Milestone = {
			id: randomUUID(),
			title: args.title,
			description: args.description,
			targetDate: new Date(args.targetDate),
			createdAt: now,
			updatedAt: now,
		};

		await createMilestone(
			milestone,
			context.user.id,
			context.actorType,
			context.tokenName,
		);

		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify({ success: true, data: milestone }),
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text" as const,
					text: `Error creating milestone: ${
						error instanceof Error ? error.message : "Unknown error"
					}`,
				},
			],
			isError: true,
		};
	}
};

export const focusUpdateMilestone: MCPToolHandler<
	z.infer<typeof updateMilestoneInputSchema>
> = async (args, context): Promise<MCPResponse> => {
	try {
		const updates: Partial<Milestone> = {};
		if (args.title !== undefined) updates.title = args.title;
		if (args.description !== undefined) updates.description = args.description;
		if (args.targetDate !== undefined)
			updates.targetDate = new Date(args.targetDate);

		await updateMilestone(
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
					text: `Error updating milestone: ${
						error instanceof Error ? error.message : "Unknown error"
					}`,
				},
			],
			isError: true,
		};
	}
};

export const focusDeleteMilestone: MCPToolHandler<
	z.infer<typeof deleteMilestoneInputSchema>
> = async (args, context): Promise<MCPResponse> => {
	try {
		await deleteMilestone(
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
					text: `Error deleting milestone: ${
						error instanceof Error ? error.message : "Unknown error"
					}`,
				},
			],
			isError: true,
		};
	}
};

export const milestoneTools = [
	{
		name: "focus_list_milestones",
		description: "List all milestones.",
		schema: listMilestonesInputSchema,
		handler: focusListMilestones,
	},
	{
		name: "focus_create_milestone",
		description: "Create a new milestone.",
		schema: createMilestoneInputSchema,
		handler: focusCreateMilestone,
	},
	{
		name: "focus_update_milestone",
		description: "Update a milestone by ID.",
		schema: updateMilestoneInputSchema,
		handler: focusUpdateMilestone,
	},
	{
		name: "focus_delete_milestone",
		description: "Delete a milestone by ID.",
		schema: deleteMilestoneInputSchema,
		handler: focusDeleteMilestone,
	},
];

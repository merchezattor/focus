import { z } from "zod";
import { getActions, markActionsRead } from "@/lib/actions";
import type {
	MCPResponse,
	MCPServerContext,
	MCPToolHandler,
} from "@/lib/mcp/types";

const listActionsSchema = z.object({
	actorType: z
		.enum(["user", "agent"])
		.optional()
		.describe(
			'Filter by who performed the action. "user"=human user, "agent"=AI agent.',
		),
	entityType: z
		.enum(["task", "project", "goal"])
		.optional()
		.describe("Filter by the type of entity the action was performed on."),
	entityId: z
		.string()
		.uuid()
		.optional()
		.describe(
			"Filter to a specific entity by UUID. Best used together with entityType.",
		),
	limit: z
		.number()
		.int()
		.min(1)
		.max(100)
		.optional()
		.describe("Max number of results to return. Defaults to 50. Max 100."),
});

const markReadSchema = z.object({
	ids: z
		.array(z.string().uuid())
		.describe("Array of action UUIDs to mark as read."),
});

export const focus_list_actions: MCPToolHandler<
	z.infer<typeof listActionsSchema>
> = async (args, context: MCPServerContext): Promise<MCPResponse> => {
	try {
		const parsed = listActionsSchema.safeParse(args);
		if (!parsed.success) {
			return {
				content: [
					{
						type: "text" as const,
						text: JSON.stringify({
							error: "Invalid arguments",
							details: parsed.error.format(),
						}),
					},
				],
				isError: true,
			};
		}

		const { actorType, entityType, entityId, limit } = parsed.data;

		const actions = await getActions({
			userId: context.user.id,
			actorType,
			entityType,
			entityId,
			limit: limit ?? 50,
		});

		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify({ success: true, data: { actions } }),
				},
			],
		};
	} catch (error) {
		console.error("focus_list_actions error:", error);
		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify({
						error: "Failed to list actions",
						message: error instanceof Error ? error.message : "Unknown error",
					}),
				},
			],
			isError: true,
		};
	}
};

export const focus_mark_actions_read: MCPToolHandler<
	z.infer<typeof markReadSchema>
> = async (args, context: MCPServerContext): Promise<MCPResponse> => {
	try {
		const parsed = markReadSchema.safeParse(args);
		if (!parsed.success) {
			return {
				content: [
					{
						type: "text" as const,
						text: JSON.stringify({
							error: "Invalid arguments",
							details: parsed.error.format(),
						}),
					},
				],
				isError: true,
			};
		}

		const { ids } = parsed.data;

		await markActionsRead(ids);

		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify({
						success: true,
						data: { markedCount: ids.length },
					}),
				},
			],
		};
	} catch (error) {
		console.error("focus_mark_actions_read error:", error);
		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify({
						error: "Failed to mark actions as read",
						message: error instanceof Error ? error.message : "Unknown error",
					}),
				},
			],
			isError: true,
		};
	}
};

export const actionTools = [
	{
		name: "focus_list_actions",
		description:
			"List activity log entries. Returns: { success, data: { actions } }. Use to see recent user/agent actions. Filter by actorType, entityType, entityId. Defaults to 50 results, max 100.",
		schema: listActionsSchema,
		handler: focus_list_actions,
	},
	{
		name: "focus_mark_actions_read",
		description:
			"Mark activity log items as read. Returns: { success, data: { markedCount } }. Use after reviewing activity.",
		schema: markReadSchema,
		handler: focus_mark_actions_read,
	},
];

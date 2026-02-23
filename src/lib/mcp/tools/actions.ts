import { z } from "zod";
import { getActions, logAction, markActionsRead } from "@/lib/actions";
import type {
	MCPResponse,
	MCPServerContext,
	MCPToolHandler,
} from "@/lib/mcp/types";
import { getTaskByIdForUser } from "@/lib/storage";

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

const createAgenticActionSchema = z.object({
	entityId: z.string().uuid().describe("UUID of the task to log an action on."),
	entityType: z
		.enum(["task"])
		.describe("Type of entity (only 'task' supported for v1)."),
	actionType: z
		.enum(["reviewed", "groomed", "processed", "pending"])
		.describe("Type of agentic action performed."),
	comment: z
		.string()
		.max(2000)
		.trim()
		.optional()
		.describe("Optional comment. Max 2000 characters. Will be trimmed."),
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

export const focus_create_agentic_action: MCPToolHandler<
	z.infer<typeof createAgenticActionSchema>
> = async (args, context: MCPServerContext): Promise<MCPResponse> => {
	try {
		const parsed = createAgenticActionSchema.safeParse(args);
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

		const { entityId, entityType, actionType, comment } = parsed.data;

		if (entityType === "task") {
			const task = await getTaskByIdForUser(entityId, context.user.id);
			if (!task) {
				return {
					content: [
						{
							type: "text" as const,
							text: JSON.stringify({
								error: "Access denied",
								message: "Task not found or you do not own this task",
							}),
						},
					],
					isError: true,
				};
			}
		}

		const trimmedComment = comment?.trim();

		if (comment !== undefined && trimmedComment === "") {
			return {
				content: [
					{
						type: "text" as const,
						text: JSON.stringify({
							error: "Invalid comment",
							message: "Comment cannot be empty or whitespace-only",
						}),
					},
				],
				isError: true,
			};
		}

		logAction({
			entityId,
			entityType,
			actorId: context.user.id,
			actorType: "agent",
			actionType,
			metadata: { tokenName: context.tokenName },
			comment: trimmedComment,
		});

		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify({
						success: true,
						data: {
							entityId,
							entityType,
							actionType,
							comment: trimmedComment,
						},
					}),
				},
			],
		};
	} catch (error) {
		console.error("focus_create_agentic_action error:", error);
		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify({
						error: "Failed to create agentic action",
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
	{
		name: "focus_create_agentic_action",
		description:
			"Log an agentic action on a task. Returns: { success, data: { entityId, entityType, actionType, comment } }. Valid actionTypes: reviewed, groomed, processed. Optional comment (max 2000 chars).",
		schema: createAgenticActionSchema,
		handler: focus_create_agentic_action,
	},
];

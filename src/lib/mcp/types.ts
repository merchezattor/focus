import type { user } from "@/db/schema";
import type { ActionType, ActorType, EntityType } from "@/lib/actions";

// Infer User type from the user table
type User = typeof user.$inferSelect;

/**
 * Context passed to all MCP tool handlers
 */
export interface MCPServerContext {
	user: User;
	actorType: ActorType;
}

/**
 * MCP text content item
 */
export interface MCPTextContent {
	type: "text";
	text: string;
}

/**
 * MCP tool response content
 */
export type MCPContent = MCPTextContent[];

/**
 * MCP tool response
 */
export interface MCPResponse {
	content: MCPContent;
	isError?: boolean;
}

/**
 * Tool handler function type
 */
export type MCPToolHandler<TArgs = unknown> = (
	args: TArgs,
	context: MCPServerContext,
) => Promise<MCPResponse>;

// Re-export types from actions for convenience
export type { ActorType, ActionType, EntityType };

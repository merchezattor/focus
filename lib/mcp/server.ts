import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { actionTools } from "./tools/actions";
import { goalTools } from "./tools/goals";
import { projectTools } from "./tools/projects";
import { taskTools } from "./tools/tasks";
import type { MCPServerContext } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyHandler = (args: unknown, context: MCPServerContext) => Promise<any>;

function registerTool(
	server: McpServer,
	name: string,
	description: string,
	schema: unknown,
	handler: AnyHandler,
	context: MCPServerContext,
) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(server as any).tool(name, description, schema, (args: unknown) =>
		handler(args, context),
	);
}

export function createMCPServer(context: MCPServerContext) {
	const server = new McpServer({
		name: "focus-mcp",
		version: "1.0.0",
	});

	// Register task tools (uses Zod schema)
	for (const tool of taskTools) {
		registerTool(
			server,
			tool.name,
			tool.description,
			tool.schema,
			tool.handler as AnyHandler,
			context,
		);
	}

	// Register project tools (uses JSON schema)
	for (const tool of projectTools) {
		registerTool(
			server,
			tool.name,
			tool.description,
			tool.inputSchema,
			tool.handler as AnyHandler,
			context,
		);
	}

	// Register goal tools (different structure with nested tool object)
	for (const { tool, handler } of goalTools) {
		registerTool(
			server,
			tool.name,
			tool.description,
			tool.inputSchema,
			handler as AnyHandler,
			context,
		);
	}

	// Register action tools (uses JSON schema)
	for (const tool of actionTools) {
		registerTool(
			server,
			tool.name,
			tool.description,
			tool.inputSchema,
			tool.handler as AnyHandler,
			context,
		);
	}

	return server;
}

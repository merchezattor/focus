import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { actionTools } from "./tools/actions";
import { goalTools } from "./tools/goals";
import { projectTools } from "./tools/projects";
import { taskTools } from "./tools/tasks";
import type { MCPResponse, MCPServerContext } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ToolHandler = (
	args: any,
	context: MCPServerContext,
) => Promise<MCPResponse>;

export function createMcpServer(context: MCPServerContext): McpServer {
	const server = new McpServer({
		name: "focus-mcp",
		version: "1.0.0",
	});

	for (const tool of taskTools) {
		server.tool(
			tool.name,
			tool.description,
			tool.schema.shape,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			async (args: any) => {
				const handler = tool.handler as ToolHandler;
				const result = await handler(args, context);
				return {
					content: result.content.map((item) => ({
						type: "text" as const,
						text: item.text,
					})),
					isError: result.isError,
				};
			},
		);
	}

	for (const tool of projectTools) {
		server.tool(
			tool.name,
			tool.description,
			tool.schema.shape,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			async (args: any) => {
				const handler = tool.handler as ToolHandler;
				const result = await handler(args, context);
				return {
					content: result.content.map((item) => ({
						type: "text" as const,
						text: item.text,
					})),
					isError: result.isError,
				};
			},
		);
	}

	for (const tool of goalTools) {
		server.tool(
			tool.name,
			tool.description,
			tool.schema.shape,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			async (args: any) => {
				const handler = tool.handler as ToolHandler;
				const result = await handler(args, context);
				return {
					content: result.content.map((item) => ({
						type: "text" as const,
						text: item.text,
					})),
					isError: result.isError,
				};
			},
		);
	}

	for (const tool of actionTools) {
		server.tool(
			tool.name,
			tool.description,
			tool.schema.shape,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			async (args: any) => {
				const handler = tool.handler as ToolHandler;
				const result = await handler(args, context);
				return {
					content: result.content.map((item) => ({
						type: "text" as const,
						text: item.text,
					})),
					isError: result.isError,
				};
			},
		);
	}

	return server;
}

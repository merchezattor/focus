import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { actionTools } from "./tools/actions";
import { goalTools } from "./tools/goals";
import { projectTools } from "./tools/projects";
import { taskTools } from "./tools/tasks";
import type { MCPServerContext } from "./types";

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
			async (args: unknown) => {
				const result = await tool.handler(args, context);
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
			async (args: unknown) => {
				const result = await tool.handler(args, context);
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
			async (args: unknown) => {
				const result = await tool.handler(args, context);
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
			async (args: unknown) => {
				const result = await tool.handler(args, context);
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

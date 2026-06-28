import { createMcpServer } from "@focus/core/mcp/server";
import type { MCPServerContext } from "@focus/core/mcp/types";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { Hono } from "hono";
import { type AppEnv, getAuthenticatedUser } from "../auth-context";

const SESSION_TTL_MS = 30 * 60 * 1000;

interface SessionEntry {
	transport: WebStandardStreamableHTTPServerTransport;
	createdAt: number;
}

// Lives in the long-lived Node process, so sessions persist reliably across
// requests (unlike the per-request serverless model this replaced).
const transports = new Map<string, SessionEntry>();

function cleanupExpiredSessions() {
	const now = Date.now();
	for (const [sid, entry] of transports) {
		if (now - entry.createdAt > SESSION_TTL_MS) {
			transports.delete(sid);
		}
	}
}

export const mcpRouter = new Hono<AppEnv>();

mcpRouter.post("/", async (c) => {
	try {
		const auth = await getAuthenticatedUser(c);
		if (!auth) {
			return c.json(
				{
					jsonrpc: "2.0",
					error: { code: -32001, message: "Unauthorized" },
					id: null,
				},
				401,
			);
		}

		cleanupExpiredSessions();

		const sessionId = c.req.header("mcp-session-id");

		if (sessionId && transports.has(sessionId)) {
			const entry = transports.get(sessionId)!;
			entry.createdAt = Date.now();
			return entry.transport.handleRequest(c.req.raw);
		}

		const transport = new WebStandardStreamableHTTPServerTransport({
			sessionIdGenerator: () => crypto.randomUUID(),
			onsessioninitialized: (sid) => {
				transports.set(sid, { transport, createdAt: Date.now() });
			},
		});

		const context: MCPServerContext = {
			user: {
				id: auth.user.id,
				name: auth.user.name,
				email: auth.user.email,
				emailVerified: auth.user.emailVerified,
				image: auth.user.image,
				createdAt: auth.user.createdAt,
				updatedAt: auth.user.updatedAt,
			},
			actorType: auth.actorType,
			tokenName: auth.tokenName,
		};

		const server = createMcpServer(context);
		await server.connect(transport);

		return transport.handleRequest(c.req.raw);
	} catch (error) {
		console.error("[MCP] Error handling request:", error);
		return c.json(
			{
				jsonrpc: "2.0",
				error: {
					code: -32603,
					message: "Internal error",
					data: error instanceof Error ? error.message : String(error),
				},
				id: null,
			},
			500,
		);
	}
});

mcpRouter.get("/", (c) => {
	return c.json(
		{
			jsonrpc: "2.0",
			error: {
				code: -32000,
				message: "Streamable HTTP transport only supports POST requests",
			},
			id: null,
		},
		405,
	);
});

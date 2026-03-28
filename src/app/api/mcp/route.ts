import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import type { InferSelectModel } from "drizzle-orm";
import type { NextRequest } from "next/server";
import type { user } from "@/db/schema";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { createMcpServer } from "@/lib/mcp/server";
import type { MCPServerContext } from "@/lib/mcp/types";

const SESSION_TTL_MS = 30 * 60 * 1000;

interface SessionEntry {
	transport: WebStandardStreamableHTTPServerTransport;
	createdAt: number;
}

const transports = new Map<string, SessionEntry>();

function cleanupExpiredSessions() {
	const now = Date.now();
	for (const [sid, entry] of transports) {
		if (now - entry.createdAt > SESSION_TTL_MS) {
			transports.delete(sid);
		}
	}
}

export async function POST(request: NextRequest) {
	try {
		const auth = await getAuthenticatedUser(request);
		if (!auth) {
			return new Response(
				JSON.stringify({
					jsonrpc: "2.0",
					error: { code: -32001, message: "Unauthorized" },
					id: null,
				}),
				{ status: 401, headers: { "Content-Type": "application/json" } },
			);
		}

		cleanupExpiredSessions();

		const sessionId = request.headers.get("mcp-session-id");

		if (sessionId && transports.has(sessionId)) {
			const entry = transports.get(sessionId)!;
			entry.createdAt = Date.now();
			const response = await entry.transport.handleRequest(request);
			return response;
		}

		const transport = new WebStandardStreamableHTTPServerTransport({
			sessionIdGenerator: () => crypto.randomUUID(),
			onsessioninitialized: (sid) => {
				transports.set(sid, { transport, createdAt: Date.now() });
			},
		});

		const dbUser: InferSelectModel<typeof user> = {
			id: auth.user.id,
			name: auth.user.name ?? "",
			email: auth.user.email,
			emailVerified: auth.user.emailVerified,
			image: auth.user.image ?? null,
			createdAt: auth.user.createdAt,
			updatedAt: auth.user.updatedAt,
		};

		const context: MCPServerContext = {
			user: dbUser,
			actorType: auth.actorType,
			tokenName: auth.tokenName,
		};

		const server = createMcpServer(context);
		await server.connect(transport);

		const response = await transport.handleRequest(request);
		return response;
	} catch (error) {
		console.error("[MCP] Error handling request:", error);
		return new Response(
			JSON.stringify({
				jsonrpc: "2.0",
				error: {
					code: -32603,
					message: "Internal error",
					data: error instanceof Error ? error.message : String(error),
				},
				id: null,
			}),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}
}

export async function GET() {
	return new Response(
		JSON.stringify({
			jsonrpc: "2.0",
			error: {
				code: -32000,
				message: "Streamable HTTP transport only supports POST requests",
			},
			id: null,
		}),
		{ status: 405, headers: { "Content-Type": "application/json" } },
	);
}

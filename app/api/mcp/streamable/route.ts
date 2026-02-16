import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { InferSelectModel } from "drizzle-orm";
import type { NextRequest } from "next/server";
import type { user } from "@/db/schema";
import { getAuthenticatedUser } from "@/lib/api-auth";
import {
	createMockIncomingMessage,
	createResponseHandler,
} from "@/lib/mcp/nextjs-adapter";
import { createMcpServer } from "@/lib/mcp/server";
import type { MCPServerContext } from "@/lib/mcp/types";

const transports = new Map<string, StreamableHTTPServerTransport>();

export async function POST(request: NextRequest) {
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

	const sessionId = request.headers.get("mcp-session-id");

	if (sessionId && transports.has(sessionId)) {
		const transport = transports.get(sessionId)!;
		const body = await request.json();
		const mockReq = createMockIncomingMessage(request);
		const { res, getResponse } = createResponseHandler();
		await transport.handleRequest(mockReq, res, body);
		return getResponse();
	}

	const transport = new StreamableHTTPServerTransport({
		sessionIdGenerator: () => crypto.randomUUID(),
		onsessioninitialized: (sid) => {
			transports.set(sid, transport);
			console.log(`[MCP] Session initialized: ${sid}`);
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
	};

	const server = createMcpServer(context);
	await server.connect(transport);

	const body = await request.json();
	const mockReq = createMockIncomingMessage(request);
	const { res, getResponse } = createResponseHandler();
	await transport.handleRequest(mockReq, res, body);
	return getResponse();
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

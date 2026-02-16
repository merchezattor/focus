import type { InferSelectModel } from "drizzle-orm";
import type { NextRequest } from "next/server";
import type { user } from "@/db/schema";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { createMcpServer } from "@/lib/mcp/server";
import type { MCPServerContext } from "@/lib/mcp/types";

interface Session {
	id: string;
	controller: ReadableStreamDefaultController;
	server: ReturnType<typeof createMcpServer>;
}

const sessions = new Map<string, Session>();

export async function GET(request: NextRequest) {
	const auth = await getAuthenticatedUser(request);
	if (!auth) {
		return new Response("Unauthorized", { status: 401 });
	}

	const sessionId = crypto.randomUUID();

	const stream = new ReadableStream({
		start(controller) {
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
			sessions.set(sessionId, { id: sessionId, controller, server });
			console.log(`[MCP] Session created: ${sessionId}`);

			// Send endpoint event
			const endpoint = `/api/mcp?sessionId=${sessionId}`;
			controller.enqueue(
				new TextEncoder().encode(`event: endpoint\ndata: ${endpoint}\n\n`),
			);
		},
		cancel() {
			sessions.delete(sessionId);
			console.log(`[MCP] Session cancelled: ${sessionId}`);
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
		},
	});
}

export async function POST(request: NextRequest) {
	const url = new URL(request.url);
	const sessionId =
		url.searchParams.get("sessionId") || request.headers.get("mcp-session-id");

	if (!sessionId) {
		return Response.json(
			{
				jsonrpc: "2.0",
				error: { code: -32000, message: "Missing sessionId" },
				id: null,
			},
			{ status: 400 },
		);
	}

	const session = sessions.get(sessionId);
	if (!session) {
		return Response.json(
			{
				jsonrpc: "2.0",
				error: { code: -32000, message: "Session not found" },
				id: null,
			},
			{ status: 404 },
		);
	}

	const message = await request.json();
	console.log(`[MCP] Message:`, message.method || message);

	// Handle MCP protocol
	if (message.method === "initialize") {
		const response = {
			jsonrpc: "2.0",
			id: message.id,
			result: {
				protocolVersion: "2024-11-05",
				capabilities: {},
				serverInfo: { name: "focus-mcp", version: "1.0.0" },
			},
		};
		session.controller.enqueue(
			new TextEncoder().encode(
				`event: message\ndata: ${JSON.stringify(response)}\n\n`,
			),
		);
		return new Response("OK");
	}

	if (message.method === "tools/list") {
		const tools = [
			{
				name: "focus_list_tasks",
				description: "List tasks",
				inputSchema: { type: "object" },
			},
			{
				name: "focus_create_task",
				description: "Create task",
				inputSchema: { type: "object" },
			},
		];
		const response = {
			jsonrpc: "2.0",
			id: message.id,
			result: { tools },
		};
		session.controller.enqueue(
			new TextEncoder().encode(
				`event: message\ndata: ${JSON.stringify(response)}\n\n`,
			),
		);
		return new Response("OK");
	}

	return Response.json(
		{ jsonrpc: "2.0", id: message.id, result: {} },
		{ status: 200 },
	);
}

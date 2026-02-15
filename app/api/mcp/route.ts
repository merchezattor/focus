import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import type { InferSelectModel } from "drizzle-orm";
import type { NextRequest } from "next/server";
import type { user } from "@/db/schema";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { createMCPServer } from "@/lib/mcp/server";
import type { MCPServerContext } from "@/lib/mcp/types";

// NOTE: In production (Vercel), this Map is per-isolate, not global.
// For multi-region deployments, use Redis or Vercel KV instead.
// @ts-expect-error - global across requests in Edge Runtime
const transports =
	globalThis.mcpTransports ||
	new Map<string, WebStandardStreamableHTTPServerTransport>();
// @ts-expect-error
globalThis.mcpTransports = transports;

// Edge Runtime config - keeps connections alive
export const runtime = "edge";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes for long-running SSE

export async function GET(request: NextRequest) {
	// Authenticate
	const auth = await getAuthenticatedUser(request);
	if (!auth) {
		return new Response("Unauthorized", { status: 401 });
	}

	// Create transport with session management
	const transport = new WebStandardStreamableHTTPServerTransport({
		sessionIdGenerator: () => crypto.randomUUID(),
		onsessionclosed: (sessionId) => {
			console.log(`[MCP] Session closed: ${sessionId}`);
			transports.delete(sessionId);
		},
	});

	const sessionId = transport.sessionId!;
	transports.set(sessionId, transport);
	console.log(`[MCP] New session: ${sessionId}, total: ${transports.size}`);

	// Create user object with required fields
	const dbUser: InferSelectModel<typeof user> = {
		id: auth.user.id,
		name: auth.user.name ?? "",
		email: auth.user.email,
		emailVerified: auth.user.emailVerified,
		image: auth.user.image ?? null,
		createdAt: auth.user.createdAt,
		updatedAt: auth.user.updatedAt,
	};

	// Create server with auth context
	const context: MCPServerContext = {
		user: dbUser,
		actorType: auth.actorType,
	};
	const server = createMCPServer(context);

	// Connect
	await server.connect(transport);

	// Handle the request and return the response
	return transport.handleRequest(request);
}

export async function POST(request: NextRequest) {
	const sessionId = request.headers.get("mcp-session-id");

	if (!sessionId) {
		return new Response("Missing mcp-session-id header", { status: 400 });
	}

	const transport = transports.get(sessionId);

	if (!transport) {
		console.error(
			`[MCP] Session not found: ${sessionId}, available: ${Array.from(transports.keys()).join(", ")}`,
		);
		return new Response("Session not found - connection may have expired", {
			status: 404,
		});
	}

	// Handle the POST request with the transport
	return transport.handleRequest(request);
}

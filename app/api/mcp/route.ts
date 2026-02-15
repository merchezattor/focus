import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import type { InferSelectModel } from "drizzle-orm";
import type { NextRequest } from "next/server";
import type { user } from "@/db/schema";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { createMCPServer } from "@/lib/mcp/server";
import type { MCPServerContext } from "@/lib/mcp/types";

// In-memory store for active transports
const transports = new Map<string, WebStandardStreamableHTTPServerTransport>();

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
			transports.delete(sessionId);
		},
	});

	transports.set(transport.sessionId!, transport);

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
		return new Response("Session not found", { status: 404 });
	}

	// Handle the POST request with the transport
	return transport.handleRequest(request);
}

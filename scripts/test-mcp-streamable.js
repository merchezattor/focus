#!/usr/bin/env node

const API_URL = process.env.FOCUS_API_URL || "http://localhost:3000/api/mcp";
const API_TOKEN = process.env.FOCUS_API_TOKEN;

async function parseSseResponse(response) {
	const text = await response.text();
	const lines = text.split("\n");
	let currentEvent = null;
	const events = [];

	for (const line of lines) {
		if (line.startsWith("event: ")) {
			currentEvent = { event: line.slice(7), data: "" };
		} else if (line.startsWith("data: ")) {
			if (currentEvent) {
				currentEvent.data = line.slice(6);
				events.push(currentEvent);
			}
		}
	}

	return events;
}

async function testMcpConnection() {
	console.log("🧪 Testing MCP Streamable HTTP connection...\n");
	console.log(`URL: ${API_URL}`);
	console.log(`Auth: ${API_TOKEN ? "Bearer token set" : "No token"}\n`);

	const headers = {
		"Content-Type": "application/json",
		Accept: "application/json, text/event-stream",
	};

	if (API_TOKEN) {
		headers.Authorization = `Bearer ${API_TOKEN}`;
	}

	try {
		console.log("1️⃣ Testing initialize request...");
		const initResponse = await fetch(API_URL, {
			method: "POST",
			headers,
			body: JSON.stringify({
				jsonrpc: "2.0",
				id: 1,
				method: "initialize",
				params: {
					protocolVersion: "2024-11-05",
					capabilities: {},
					clientInfo: { name: "test-client", version: "1.0.0" },
				},
			}),
		});

		if (!initResponse.ok) {
			const errorText = await initResponse.text();
			throw new Error(
				`Initialize failed: ${initResponse.status} - ${errorText}`,
			);
		}

		const contentType = initResponse.headers.get("content-type") || "";
		let initResult;

		if (contentType.includes("text/event-stream")) {
			const events = await parseSseResponse(initResponse);
			const messageEvent = events.find((e) => e.event === "message");
			if (messageEvent) {
				initResult = JSON.parse(messageEvent.data);
			}
		} else {
			initResult = await initResponse.json();
		}

		console.log("✅ Initialize successful");
		console.log(`   Server: ${initResult.result?.serverInfo?.name}`);
		console.log(`   Protocol: ${initResult.result?.protocolVersion}\n`);

		const sessionId = initResponse.headers.get("mcp-session-id");
		if (sessionId) {
			console.log(`   Session ID: ${sessionId}\n`);
			headers["mcp-session-id"] = sessionId;
		}

		console.log("2️⃣ Testing tools/list request...");
		const toolsResponse = await fetch(API_URL, {
			method: "POST",
			headers,
			body: JSON.stringify({
				jsonrpc: "2.0",
				id: 2,
				method: "tools/list",
			}),
		});

		if (!toolsResponse.ok) {
			const errorText = await toolsResponse.text();
			throw new Error(
				`Tools list failed: ${toolsResponse.status} - ${errorText}`,
			);
		}

		const toolsContentType = toolsResponse.headers.get("content-type") || "";
		let toolsResult;

		if (toolsContentType.includes("text/event-stream")) {
			const events = await parseSseResponse(toolsResponse);
			const messageEvent = events.find((e) => e.event === "message");
			if (messageEvent) {
				toolsResult = JSON.parse(messageEvent.data);
			}
		} else {
			toolsResult = await toolsResponse.json();
		}

		const tools = toolsResult.result?.tools || [];
		console.log(`✅ Found ${tools.length} tools:`);
		for (const tool of tools) {
			console.log(`   - ${tool.name}: ${tool.description}`);
		}

		console.log("\n✅ All tests passed!");
		process.exit(0);
	} catch (error) {
		console.error("❌ Test failed:", error.message);
		process.exit(1);
	}
}

testMcpConnection();

#!/usr/bin/env node

/**
 * Test script for MCP Streamable HTTP connection
 *
 * Usage:
 *   export FOCUS_API_TOKEN="your_api_token_here"
 *   export FOCUS_API_URL="http://localhost:3000/api/mcp/streamable"
 *   node scripts/test-mcp.js
 */

const API_URL =
	process.env.FOCUS_API_URL || "http://localhost:3000/api/mcp/streamable";
const API_TOKEN = process.env.FOCUS_API_TOKEN;

async function testMcpConnection() {
	console.log("🧪 Testing MCP Streamable HTTP connection...\n");
	console.log(`URL: ${API_URL}`);
	console.log(
		`Auth: ${API_TOKEN ? "Bearer token set" : "No token (will use session cookie if available)"}\n`,
	);

	const headers = {
		"Content-Type": "application/json",
	};

	if (API_TOKEN) {
		headers.Authorization = `Bearer ${API_TOKEN}`;
	}

	try {
		// Test 1: Initialize connection
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
					clientInfo: {
						name: "test-client",
						version: "1.0.0",
					},
				},
			}),
		});

		if (!initResponse.ok) {
			const errorText = await initResponse.text();
			throw new Error(
				`Initialize failed: ${initResponse.status} - ${errorText}`,
			);
		}

		const initResult = await initResponse.json();
		console.log("✅ Initialize successful");
		console.log(
			`   Server: ${initResult.result?.serverInfo?.name} v${initResult.result?.serverInfo?.version}`,
		);
		console.log(`   Protocol: ${initResult.result?.protocolVersion}\n`);

		// Get session ID from response headers
		const sessionId = initResponse.headers.get("mcp-session-id");
		if (sessionId) {
			console.log(`   Session ID: ${sessionId}\n`);
			headers["mcp-session-id"] = sessionId;
		}

		// Test 2: List tools
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

		const toolsResult = await toolsResponse.json();
		const tools = toolsResult.result?.tools || [];
		console.log(`✅ Found ${tools.length} tools:`);
		for (const tool of tools) {
			console.log(`   - ${tool.name}: ${tool.description}`);
		}
		console.log();

		// Test 3: Call a tool (if available)
		if (tools.length > 0) {
			const listTasksTool = tools.find((t) => t.name === "focus_list_tasks");
			if (listTasksTool) {
				console.log("3️⃣ Testing tool call (focus_list_tasks)...");
				const toolResponse = await fetch(API_URL, {
					method: "POST",
					headers,
					body: JSON.stringify({
						jsonrpc: "2.0",
						id: 3,
						method: "tools/call",
						params: {
							name: "focus_list_tasks",
							arguments: { completed: false },
						},
					}),
				});

				if (!toolResponse.ok) {
					const errorText = await toolResponse.text();
					console.log(
						`⚠️ Tool call failed: ${toolResponse.status} - ${errorText}\n`,
					);
				} else {
					const toolResult = await toolResponse.json();
					console.log("✅ Tool call successful");
					if (toolResult.result?.content?.[0]?.text) {
						const tasks = JSON.parse(toolResult.result.content[0].text);
						console.log(`   Found ${tasks.length || 0} tasks\n`);
					}
				}
			}
		}

		console.log("✅ All tests passed!");
		process.exit(0);
	} catch (error) {
		console.error("❌ Test failed:", error.message);
		process.exit(1);
	}
}

testMcpConnection();

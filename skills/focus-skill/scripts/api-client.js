#!/usr/bin/env node

/**
 * Focus App API Client
 *
 * Usage:
 *   export FOCUS_API_URL="https://todo.michaelukhin.xyz/api"
 *   export FOCUS_API_TOKEN="your_token_here"
 *
 *   node api-client.js <resource> <action> [options]
 *
 * Examples:
 *   node api-client.js tasks list
 *   node api-client.js tasks create '{"title": "Buy milk", "priority": "p1"}'
 *   node api-client.js projects list
 *   node api-client.js actions list '{"actorType": "user"}'
 */

const API_URL = process.env.FOCUS_API_URL;
const API_TOKEN = process.env.FOCUS_API_TOKEN;
const crypto = require("node:crypto");

if (!API_URL || !API_TOKEN) {
	console.error(
		"Error: FOCUS_API_URL and FOCUS_API_TOKEN environment variables must be set.",
	);
	process.exit(1);
}

async function request(endpoint, method = "GET", body = null) {
	const headers = {
		Authorization: `Bearer ${API_TOKEN}`,
		"Content-Type": "application/json",
	};

	const config = {
		method,
		headers,
	};

	if (body) {
		config.body = JSON.stringify(body);
	}

	try {
		const response = await fetch(`${API_URL}${endpoint}`, config);

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`API Error (${response.status}): ${errorText}`);
		}

		const data = await response.json();
		return data;
	} catch (error) {
		console.error("Request failed:", error.message);
		process.exit(1);
	}
}

async function main() {
	const args = process.argv.slice(2);
	const resource = args[0];
	const action = args[1];
	const payload = args[2];

	if (!resource || !action) {
		console.log("Usage: node api-client.js <resource> <action> [json_payload]");
		return;
	}

	try {
		let result;

		// --- PROJECTS ---
		if (resource === "projects") {
			if (action === "list") {
				const data = await request("/projects");
				result = data.projects;
			} else if (action === "create") {
				if (!payload)
					throw new Error("Missing JSON payload for project creation");
				const body = JSON.parse(payload);
				const data = await request("/projects", "POST", body);
				result = data.project;
			} else if (action === "update") {
				const id = args[2];
				const updatePayload = args[3];
				if (!id) throw new Error("Missing project ID for update");
				if (!updatePayload) throw new Error("Missing JSON payload for update");
				const body = JSON.parse(updatePayload);
				// API expects { id, ...data } in body
				const data = await request("/projects", "PUT", { id, ...body });
				result = data;
			} else if (action === "delete") {
				const id = args[2];
				if (!id) throw new Error("Missing project ID for deletion");
				await request(`/projects?id=${id}`, "DELETE");
				result = { success: true };
			} else {
				throw new Error(`Unknown project action: ${action}`);
			}
		}

		// --- GOALS ---
		else if (resource === "goals") {
			if (action === "list") {
				const data = await request("/goals");
				result = data.goals;
			} else if (action === "create") {
				if (!payload) throw new Error("Missing JSON payload for goal creation");
				const body = JSON.parse(payload);
				const data = await request("/goals", "POST", body);
				result = data.goal;
			} else if (action === "update") {
				const id = args[2];
				const updatePayload = args[3];
				if (!id) throw new Error("Missing goal ID for update");
				if (!updatePayload) throw new Error("Missing JSON payload for update");
				const body = JSON.parse(updatePayload);
				// API expects { id, ...data } in body
				const data = await request("/goals", "PUT", { id, ...body });
				result = data;
			} else if (action === "delete") {
				const id = args[2];
				if (!id) throw new Error("Missing goal ID for deletion");
				await request(`/goals?id=${id}`, "DELETE");
				result = { success: true };
			} else {
				throw new Error(`Unknown goal action: ${action}`);
			}
		}

		// --- TASKS ---
		else if (resource === "tasks") {
			if (action === "list") {
				const data = await request("/tasks");
				result = data.tasks;
			} else if (action === "create") {
				if (!payload) throw new Error("Missing JSON payload for task creation");
				const body = JSON.parse(payload);
				const data = await request("/tasks", "POST", body);
				result = data.task;
			} else if (action === "delete") {
				const id = args[2];
				if (!id) throw new Error("Missing task ID for deletion");
				await request(`/tasks/${id}`, "DELETE");
				result = { success: true, message: `Task ${id} deleted` };
			} else if (action === "update") {
				const id = args[2];
				const updatePayload = args[3];
				if (!id) throw new Error("Missing task ID for update");
				if (!updatePayload) throw new Error("Missing JSON payload for update");

				const body = JSON.parse(updatePayload);
				const data = await request(`/tasks/${id}`, "PATCH", body);
				result = data.task;
			} else if (action === "add_comment") {
				const id = args[2];
				const content = args[3];
				if (!id) throw new Error("Missing task ID");
				if (!content) throw new Error("Missing comment content");

				// 1. Fetch existing task to preserve comments

				const listData = await request("/tasks");
				const task = listData.tasks.find((t) => t.id === id);

				if (!task) throw new Error(`Task ${id} not found`);

				const existingComments = task.comments || [];
				const newComment = {
					id: crypto.randomUUID(),
					content: content,
					postedAt: new Date().toISOString(),
				};

				const updatedComments = [...existingComments, newComment];

				const data = await request(`/tasks/${id}`, "PATCH", {
					comments: updatedComments,
				});
				result = data.task;
			} else {
				throw new Error(`Unknown task action: ${action}`);
			}
		}
		
		// --- ACTIONS (Activity Log) ---
		else if (resource === "actions") {
			if (action === "list") {
				// Usage: node api-client.js actions list '{"actorType": "user"}'
				let query = "";
				if (payload) {
					try {
						const filters = JSON.parse(payload);
						const params = new URLSearchParams();
						if (filters.actorType) params.append("actorType", filters.actorType);
						if (filters.limit) params.append("limit", filters.limit);
						query = `?${params.toString()}`;
					} catch (e) {
						console.warn("Invalid JSON payload for filters, ignoring.");
					}
				}
				const data = await request(`/actions${query}`);
				result = data.actions;
			} else if (action === "mark_read") {
				// Usage: node api-client.js actions mark_read '{"ids": ["..."]}'
				if (!payload) throw new Error("Missing JSON payload for marking read");
				const body = JSON.parse(payload);
				if (!body.ids || !Array.isArray(body.ids)) {
					throw new Error("Payload must contain 'ids' array");
				}
				await request("/actions/read", "POST", body);
				result = { success: true };
			} else {
				throw new Error(`Unknown action action: ${action}`);
			}
		} else {
			throw new Error(`Unknown resource: ${resource}`);
		}

		console.log(JSON.stringify(result, null, 2));
	} catch (error) {
		console.error("Error:", error.message);
		process.exit(1);
	}
}

main();

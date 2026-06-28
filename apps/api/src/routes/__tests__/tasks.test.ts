import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => {
	const defaultAuth = {
		user: {
			id: "user-123",
			name: "",
			email: "a@b.c",
			emailVerified: true,
			image: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		actorType: "user" as const,
		tokenName: "web",
	};
	const state: { auth: typeof defaultAuth | null } = { auth: defaultAuth };
	return {
		state,
		defaultAuth,
		storage: {
			searchTasks: vi.fn(),
			createTask: vi.fn(),
			updateTask: vi.fn(),
			getTaskByIdForUser: vi.fn(),
			deleteTask: vi.fn(),
			syncComments: vi.fn(),
		},
	};
});

vi.mock("../../auth-context", () => ({
	requireAuth: async (c: any, next: any) => {
		if (!h.state.auth) return c.json({ error: "Unauthorized" }, 401);
		c.set("auth", h.state.auth);
		await next();
	},
	getAuthenticatedUser: async () => h.state.auth,
}));

vi.mock("@focus/core/storage", () => h.storage);

const { tasksRouter } = await import("../tasks");
const app = new Hono().route("/api/tasks", tasksRouter);

const json = (body: unknown) => ({
	method: "POST",
	headers: { "Content-Type": "application/json" },
	body: JSON.stringify(body),
});

describe("Tasks API (Hono)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		h.state.auth = h.defaultAuth;
	});

	describe("GET /api/tasks", () => {
		it("returns 401 when not authenticated", async () => {
			h.state.auth = null;
			const res = await app.request("/api/tasks");
			expect(res.status).toBe(401);
			expect((await res.json()).error).toBe("Unauthorized");
		});

		it("returns tasks for authenticated user", async () => {
			h.storage.searchTasks.mockResolvedValueOnce([
				{ id: "task-1", title: "Task 1" },
				{ id: "task-2", title: "Task 2" },
			]);
			const res = await app.request("/api/tasks");
			const data = await res.json();
			expect(res.status).toBe(200);
			expect(data.tasks).toHaveLength(2);
			expect(h.storage.searchTasks).toHaveBeenCalledWith("user-123", {
				dueDateStr: undefined,
				lastActionType: undefined,
			});
		});

		it("filters tasks by projectId", async () => {
			h.storage.searchTasks.mockResolvedValueOnce([
				{ id: "task-1", projectId: "project-1" },
				{ id: "task-2", projectId: "project-2" },
			]);
			const res = await app.request("/api/tasks?projectId=project-1");
			const data = await res.json();
			expect(res.status).toBe(200);
			expect(data.tasks).toHaveLength(1);
			expect(data.tasks[0].projectId).toBe("project-1");
		});
	});

	describe("POST /api/tasks", () => {
		it("returns 401 when not authenticated", async () => {
			h.state.auth = null;
			const res = await app.request("/api/tasks", json({ title: "New Task" }));
			expect(res.status).toBe(401);
		});

		it("returns 400 for invalid task data", async () => {
			const res = await app.request("/api/tasks", json({ title: "" }));
			expect(res.status).toBe(400);
		});

		it("creates task with valid data", async () => {
			h.storage.createTask.mockResolvedValueOnce(undefined);
			const res = await app.request(
				"/api/tasks",
				json({
					title: "New Task",
					priority: "p2",
					completed: false,
					projectId: null,
				}),
			);
			const data = await res.json();
			expect(res.status).toBe(201);
			expect(data.task).toBeDefined();
			expect(data.task.title).toBe("New Task");
		});
	});

	describe("PUT /api/tasks", () => {
		it("returns 401 when not authenticated", async () => {
			h.state.auth = null;
			const res = await app.request("/api/tasks", {
				...json({ id: "task-1", title: "Updated" }),
				method: "PUT",
			});
			expect(res.status).toBe(401);
		});

		it("returns 400 when id is missing", async () => {
			const res = await app.request("/api/tasks", {
				...json({ title: "Updated" }),
				method: "PUT",
			});
			expect(res.status).toBe(400);
		});

		it("updates task successfully", async () => {
			h.storage.updateTask.mockResolvedValueOnce(undefined);
			const res = await app.request("/api/tasks", {
				...json({ id: "task-1", title: "Updated Task" }),
				method: "PUT",
			});
			expect(res.status).toBe(200);
			expect(h.storage.updateTask).toHaveBeenCalled();
		});
	});

	describe("DELETE /api/tasks/:id", () => {
		it("deletes a task", async () => {
			h.storage.deleteTask.mockResolvedValueOnce(undefined);
			const res = await app.request("/api/tasks/task-1", { method: "DELETE" });
			expect(res.status).toBe(200);
			expect(h.storage.deleteTask).toHaveBeenCalledWith(
				"task-1",
				"user-123",
				"user",
				"web",
			);
		});
	});
});

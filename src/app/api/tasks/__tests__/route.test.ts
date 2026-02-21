import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST, PUT } from "../route";

const mockGetAuthenticatedUser = vi.fn();
const mockReadTasks = vi.fn();
const mockCreateTask = vi.fn();
const mockUpdateTask = vi.fn();

vi.mock("@/lib/api-auth", () => ({
	getAuthenticatedUser: (...args: unknown[]) =>
		mockGetAuthenticatedUser(...args),
}));

vi.mock("@/lib/storage", () => ({
	readTasks: (...args: unknown[]) => mockReadTasks(...args),
	createTask: (...args: unknown[]) => mockCreateTask(...args),
	updateTask: (...args: unknown[]) => mockUpdateTask(...args),
}));

describe("Tasks API", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("GET /api/tasks", () => {
		it("should return 401 when not authenticated", async () => {
			mockGetAuthenticatedUser.mockResolvedValueOnce(null);

			const request = { url: "http://localhost/api/tasks" } as NextRequest;
			const response = await GET(request);

			expect(response.status).toBe(401);
			const data = await response.json();
			expect(data.error).toBe("Unauthorized");
		});

		it("should return tasks for authenticated user", async () => {
			mockGetAuthenticatedUser.mockResolvedValueOnce({
				user: { id: "user-123" },
				actorType: "user",
			});
			mockReadTasks.mockResolvedValueOnce([
				{ id: "task-1", title: "Task 1" },
				{ id: "task-2", title: "Task 2" },
			]);

			const request = { url: "http://localhost/api/tasks" } as NextRequest;
			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.tasks).toHaveLength(2);
			expect(mockReadTasks).toHaveBeenCalledWith("user-123");
		});

		it("should filter tasks by projectId", async () => {
			mockGetAuthenticatedUser.mockResolvedValueOnce({
				user: { id: "user-123" },
				actorType: "user",
			});
			mockReadTasks.mockResolvedValueOnce([
				{ id: "task-1", title: "Task 1", projectId: "project-1" },
				{ id: "task-2", title: "Task 2", projectId: "project-2" },
			]);

			const request = {
				url: "http://localhost/api/tasks?projectId=project-1",
			} as NextRequest;
			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.tasks).toHaveLength(1);
			expect(data.tasks[0].projectId).toBe("project-1");
		});
	});

	describe("POST /api/tasks", () => {
		it("should return 401 when not authenticated", async () => {
			mockGetAuthenticatedUser.mockResolvedValueOnce(null);

			const request = {
				url: "http://localhost/api/tasks",
				json: async () => ({ title: "New Task" }),
			} as NextRequest;
			const response = await POST(request);

			expect(response.status).toBe(401);
		});

		it("should return 400 for invalid task data", async () => {
			mockGetAuthenticatedUser.mockResolvedValueOnce({
				user: { id: "user-123" },
				actorType: "user",
			});

			const request = {
				url: "http://localhost/api/tasks",
				json: async () => ({ title: "" }),
			} as NextRequest;
			const response = await POST(request);

			expect(response.status).toBe(400);
		});

		it("should create task with valid data", async () => {
			mockGetAuthenticatedUser.mockResolvedValueOnce({
				user: { id: "user-123" },
				actorType: "user",
			});
			mockCreateTask.mockResolvedValueOnce(undefined);

			const request = {
				url: "http://localhost/api/tasks",
				json: async () => ({
					title: "New Task",
					priority: "p2",
					completed: false,
					projectId: null,
				}),
			} as NextRequest;
			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(201);
			expect(data.task).toBeDefined();
			expect(data.task.title).toBe("New Task");
		});
	});

	describe("PUT /api/tasks", () => {
		it("should return 401 when not authenticated", async () => {
			mockGetAuthenticatedUser.mockResolvedValueOnce(null);

			const request = {
				url: "http://localhost/api/tasks",
				json: async () => ({ id: "task-1", title: "Updated" }),
			} as NextRequest;
			const response = await PUT(request);

			expect(response.status).toBe(401);
		});

		it("should return 400 when id is missing", async () => {
			mockGetAuthenticatedUser.mockResolvedValueOnce({
				user: { id: "user-123" },
				actorType: "user",
			});

			const request = {
				url: "http://localhost/api/tasks",
				json: async () => ({ title: "Updated" }),
			} as NextRequest;
			const response = await PUT(request);

			expect(response.status).toBe(400);
		});

		it("should update task successfully", async () => {
			mockGetAuthenticatedUser.mockResolvedValueOnce({
				user: { id: "user-123" },
				actorType: "user",
			});
			mockUpdateTask.mockResolvedValueOnce(undefined);

			const request = {
				url: "http://localhost/api/tasks",
				json: async () => ({ id: "task-1", title: "Updated Task" }),
			} as NextRequest;
			const response = await PUT(request);

			expect(response.status).toBe(200);
			expect(mockUpdateTask).toHaveBeenCalled();
		});
	});
});

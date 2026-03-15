import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Task } from "@/types";

const mockCreateTasksBulk = vi.fn();
const mockCreateTask = vi.fn();
const mockSearchTasks = vi.fn();
const mockUpdateTask = vi.fn();
const mockDeleteTask = vi.fn();
const mockGetTaskById = vi.fn();
const mockGetTaskByIdForUser = vi.fn();
const mockCreateComment = vi.fn();
const mockLogAction = vi.fn();

vi.mock("@/lib/storage", () => ({
	createTasksBulk: (...args: unknown[]) => mockCreateTasksBulk(...args),
	createTask: (...args: unknown[]) => mockCreateTask(...args),
	searchTasks: (...args: unknown[]) => mockSearchTasks(...args),
	updateTask: (...args: unknown[]) => mockUpdateTask(...args),
	deleteTask: (...args: unknown[]) => mockDeleteTask(...args),
	getTaskById: (...args: unknown[]) => mockGetTaskById(...args),
	getTaskByIdForUser: (...args: unknown[]) => mockGetTaskByIdForUser(...args),
	createComment: (...args: unknown[]) => mockCreateComment(...args),
}));

vi.mock("@/lib/actions", () => ({
	logAction: (...args: unknown[]) => mockLogAction(...args),
}));

import {
	createProjectRoadmapTool,
	createTaskTool,
	updateTaskTool,
} from "../tasks";

describe("MCP Task Tools", () => {
	const mockContext = {
		user: {
			id: "user-123",
			name: "Test User",
			email: "test@example.com",
			emailVerified: true,
			image: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		actorType: "agent" as const,
		tokenName: "test-token",
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("createTaskTool", () => {
		it("should propagate orderNum from input to task creation", async () => {
			const args = {
				title: "Test Task",
				priority: "p2" as const,
				orderNum: 5,
			};

			await createTaskTool(args, mockContext);

			expect(mockCreateTask).toHaveBeenCalledOnce();
			const createdTask = mockCreateTask.mock.calls[0][0] as Task;

			expect(createdTask.orderNum).toBe(5);
			expect(createdTask.title).toBe("Test Task");
			expect(createdTask.priority).toBe("p2");
		});

		it("should default orderNum to 0 when not provided", async () => {
			const args = {
				title: "Test Task",
				priority: "p2" as const,
			};

			await createTaskTool(args, mockContext);

			expect(mockCreateTask).toHaveBeenCalledOnce();
			const createdTask = mockCreateTask.mock.calls[0][0] as Task;

			expect(createdTask.orderNum).toBe(0);
		});

		it("should propagate all task fields correctly", async () => {
			const args = {
				title: "Complete Task",
				description: "Task description",
				priority: "p1" as const,
				projectId: "550e8400-e29b-41d4-a716-446655440000",
				parentId: "550e8400-e29b-41d4-a716-446655440001",
				status: "in_progress" as const,
				dueDate: "2026-12-31T23:59:59Z",
				planDate: "2026-12-01T00:00:00Z",
				orderNum: 10,
			};

			await createTaskTool(args, mockContext);

			expect(mockCreateTask).toHaveBeenCalledOnce();
			const createdTask = mockCreateTask.mock.calls[0][0] as Task;

			expect(createdTask.title).toBe("Complete Task");
			expect(createdTask.description).toBe("Task description");
			expect(createdTask.priority).toBe("p1");
			expect(createdTask.projectId).toBe(
				"550e8400-e29b-41d4-a716-446655440000",
			);
			expect(createdTask.parentId).toBe("550e8400-e29b-41d4-a716-446655440001");
			expect(createdTask.status).toBe("in_progress");
			expect(createdTask.dueDate).toBeInstanceOf(Date);
			expect(createdTask.planDate).toBeInstanceOf(Date);
			expect(createdTask.orderNum).toBe(10);
		});
	});

	describe("createProjectRoadmapTool", () => {
		it("should propagate orderNum for subtasks correctly", async () => {
			const args = {
				projectId: "550e8400-e29b-41d4-a716-446655440000",
				sections: [
					{
						title: "Phase 1",
						priority: "p2" as const,
						subtasks: [
							{ title: "Step 1", priority: "p2" as const, orderNum: 1 },
							{ title: "Step 2", priority: "p2" as const, orderNum: 2 },
							{ title: "Step 3", priority: "p2" as const, orderNum: 3 },
						],
					},
				],
			};

			await createProjectRoadmapTool(args, mockContext);

			expect(mockCreateTasksBulk).toHaveBeenCalledOnce();
			const createdTasks = mockCreateTasksBulk.mock.calls[0][0] as Task[];

			expect(createdTasks).toHaveLength(4);

			const sectionTask = createdTasks[0];
			expect(sectionTask.parentId).toBeNull();
			expect(sectionTask.orderNum).toBe(0);

			const subtasks = createdTasks.slice(1);
			expect(subtasks[0].orderNum).toBe(1);
			expect(subtasks[1].orderNum).toBe(2);
			expect(subtasks[2].orderNum).toBe(3);

			subtasks.forEach((subtask) => {
				expect(subtask.parentId).toBe(sectionTask.id);
			});
		});

		it("should default orderNum to 0 for subtasks when not provided", async () => {
			const args = {
				projectId: "550e8400-e29b-41d4-a716-446655440000",
				sections: [
					{
						title: "Phase 1",
						subtasks: [
							{ title: "Task without orderNum" },
							{ title: "Another task" },
						],
					},
				],
			};

			await createProjectRoadmapTool(args, mockContext);

			expect(mockCreateTasksBulk).toHaveBeenCalledOnce();
			const createdTasks = mockCreateTasksBulk.mock.calls[0][0] as Task[];
			const subtasks = createdTasks.slice(1);

			subtasks.forEach((subtask) => {
				expect(subtask.orderNum).toBe(0);
			});
		});

		it("should create multiple sections with subtasks", async () => {
			const args = {
				projectId: "550e8400-e29b-41d4-a716-446655440000",
				sections: [
					{
						title: "Section 1",
						subtasks: [
							{ title: "S1 Task 1", orderNum: 1 },
							{ title: "S1 Task 2", orderNum: 2 },
						],
					},
					{
						title: "Section 2",
						subtasks: [
							{ title: "S2 Task 1", orderNum: 1 },
							{ title: "S2 Task 2", orderNum: 2 },
						],
					},
				],
			};

			await createProjectRoadmapTool(args, mockContext);

			expect(mockCreateTasksBulk).toHaveBeenCalledOnce();
			const createdTasks = mockCreateTasksBulk.mock.calls[0][0] as Task[];

			expect(createdTasks).toHaveLength(6);

			const section1 = createdTasks[0];
			const section2 = createdTasks[3];

			expect(section1.title).toBe("Section 1");
			expect(section2.title).toBe("Section 2");

			expect(createdTasks[1].parentId).toBe(section1.id);
			expect(createdTasks[2].parentId).toBe(section1.id);
			expect(createdTasks[4].parentId).toBe(section2.id);
			expect(createdTasks[5].parentId).toBe(section2.id);
		});
	});

	describe("updateTaskTool", () => {
		it("should propagate orderNum in updates", async () => {
			const args = {
				id: "550e8400-e29b-41d4-a716-446655440000",
				orderNum: 10,
			};

			mockUpdateTask.mockResolvedValueOnce(undefined);

			await updateTaskTool(args, mockContext);

			expect(mockUpdateTask).toHaveBeenCalledOnce();
			const updates = mockUpdateTask.mock.calls[0][1] as Partial<Task>;

			expect(updates.orderNum).toBe(10);
		});

		it("should propagate all update fields correctly", async () => {
			const args = {
				id: "550e8400-e29b-41d4-a716-446655440000",
				title: "Updated Title",
				priority: "p1" as const,
				status: "done" as const,
				orderNum: 15,
			};

			mockUpdateTask.mockResolvedValueOnce(undefined);

			await updateTaskTool(args, mockContext);

			expect(mockUpdateTask).toHaveBeenCalledOnce();
			const updates = mockUpdateTask.mock.calls[0][1] as Partial<Task>;

			expect(updates.title).toBe("Updated Title");
			expect(updates.priority).toBe("p1");
			expect(updates.status).toBe("done");
			expect(updates.orderNum).toBe(15);
		});
	});
});

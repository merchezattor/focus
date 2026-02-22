import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createComment,
	createGoal,
	createProject,
	createTask,
	deleteComment,
	deleteGoal,
	deleteProject,
	deleteTask,
	getTaskById,
	getTaskByIdForUser,
	getTaskCounts,
	readGoals,
	readProjects,
	readTasks,
	searchTasks,
	syncComments,
	updateGoal,
	updateProject,
	updateTask,
} from "../storage";

const mockDb = {
	select: vi.fn(),
	insert: vi.fn(),
	update: vi.fn(),
	delete: vi.fn(),
};

vi.mock("@/db", () => ({
	getDb: vi.fn(() => mockDb),
}));

vi.mock("../actions", () => ({
	logAction: vi.fn(),
}));

describe("Storage Layer", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockDb.select.mockReturnValue({
			from: vi.fn(() => ({
				where: vi.fn(() => ({
					orderBy: vi.fn(() => []),
					returning: vi.fn(() => []),
				})),
			})),
		});
		mockDb.insert.mockReturnValue({
			values: vi.fn(() => ({
				returning: vi.fn(() => []),
			})),
		});
		mockDb.update.mockReturnValue({
			set: vi.fn(() => ({
				where: vi.fn(() => ({
					returning: vi.fn(() => []),
				})),
			})),
		});
		mockDb.delete.mockReturnValue({
			where: vi.fn(() => ({
				returning: vi.fn(() => []),
			})),
		});
	});

	describe("Task Operations", () => {
		describe("readTasks", () => {
			it("should be a function", () => {
				expect(typeof readTasks).toBe("function");
			});

			it("should accept userId parameter", async () => {
				mockDb.select.mockReturnValueOnce({
					from: vi.fn(() => ({
						where: vi.fn(() => ({
							orderBy: vi.fn(() => []),
						})),
					})),
				});

				await readTasks("user-123");
				expect(mockDb.select).toHaveBeenCalled();
			});
		});

		describe("createTask", () => {
			it("should be a function", () => {
				expect(typeof createTask).toBe("function");
			});

			it("should accept task, userId, actorType, and tokenName", async () => {
				const task = {
					id: "task-1",
					title: "Test Task",
					completed: false,
					status: "todo" as const,
					priority: "p2" as const,
					projectId: null,
					dueDate: null,
					comments: [],
					createdAt: new Date(),
					updatedAt: new Date(),
				};

				mockDb.insert.mockReturnValueOnce({
					values: vi.fn(() => ({
						returning: vi.fn(() => [{ id: "task-1" }]),
					})),
				});

				await createTask(task, "user-123", "user", undefined);
				expect(mockDb.insert).toHaveBeenCalled();
			});
		});

		describe("updateTask", () => {
			it("should be a function", () => {
				expect(typeof updateTask).toBe("function");
			});

			it("should accept id, updates, actorId, actorType, and tokenName", async () => {
				mockDb.update.mockReturnValueOnce({
					set: vi.fn(() => ({
						where: vi.fn(() => ({
							returning: vi.fn(() => [{ content: "Updated Task" }]),
						})),
					})),
				});

				await updateTask(
					"task-1",
					{ title: "Updated Task" },
					"user-123",
					"user",
					undefined,
				);
				expect(mockDb.update).toHaveBeenCalled();
			});
		});

		describe("deleteTask", () => {
			it("should be a function", () => {
				expect(typeof deleteTask).toBe("function");
			});

			it("should accept id, actorId, actorType, and tokenName", async () => {
				mockDb.delete.mockReturnValueOnce({
					where: vi.fn(() => ({
						returning: vi.fn(() => [{ content: "Deleted Task" }]),
					})),
				});

				await deleteTask("task-1", "user-123", "user", undefined);
				expect(mockDb.delete).toHaveBeenCalled();
			});
		});

		describe("getTaskById", () => {
			it("should be a function", () => {
				expect(typeof getTaskById).toBe("function");
			});

			it("should return undefined when task not found", async () => {
				mockDb.select.mockReturnValueOnce({
					from: vi.fn(() => ({
						where: vi.fn(() => []),
					})),
				});

				const result = await getTaskById("non-existent");
				expect(result).toBeUndefined();
			});
		});

		describe("getTaskByIdForUser", () => {
			it("should be a function", () => {
				expect(typeof getTaskByIdForUser).toBe("function");
			});

			it("should require both id and userId", async () => {
				mockDb.select.mockReturnValueOnce({
					from: vi.fn(() => ({
						where: vi.fn(() => []),
					})),
				});

				const result = await getTaskByIdForUser("task-1", "user-123");
				expect(result).toBeUndefined();
			});
		});

		describe("searchTasks", () => {
			it("should be a function", () => {
				expect(typeof searchTasks).toBe("function");
			});

			it("should accept userId and filters", async () => {
				mockDb.select.mockReturnValueOnce({
					from: vi.fn(() => ({
						where: vi.fn(() => ({
							orderBy: vi.fn(() => ({
								limit: vi.fn(() => []),
							})),
						})),
					})),
				});

				await searchTasks("user-123", { priority: ["p1", "p2"] });
				expect(mockDb.select).toHaveBeenCalled();
			});
		});

		describe("getTaskCounts", () => {
			it("should be a function", () => {
				expect(typeof getTaskCounts).toBe("function");
			});

			it("should return inbox and today counts", async () => {
				mockDb.select
					.mockReturnValueOnce({
						from: vi.fn(() => ({
							where: vi.fn(() => [{ value: 5 }]),
						})),
					})
					.mockReturnValueOnce({
						from: vi.fn(() => ({
							where: vi.fn(() => [{ value: 3 }]),
						})),
					});

				const result = await getTaskCounts("user-123");
				expect(result).toEqual({ inboxCount: 5, todayCount: 3 });
			});
		});
	});

	describe("Project Operations", () => {
		describe("readProjects", () => {
			it("should be a function", () => {
				expect(typeof readProjects).toBe("function");
			});

			it("should accept userId parameter", async () => {
				mockDb.select.mockReturnValueOnce({
					from: vi.fn(() => ({
						where: vi.fn(() => ({
							orderBy: vi.fn(() => []),
						})),
					})),
				});

				await readProjects("user-123");
				expect(mockDb.select).toHaveBeenCalled();
			});
		});

		describe("createProject", () => {
			it("should be a function", () => {
				expect(typeof createProject).toBe("function");
			});

			it("should accept project, userId, actorType, and tokenName", async () => {
				const project = {
					id: "project-1",
					name: "Test Project",
					color: "#3b82f6",
					description: undefined,
					isFavorite: false,
					parentId: undefined,
					parentType: undefined as "goal" | "project" | undefined,
					viewType: "list" as const,
					createdAt: new Date(),
					updatedAt: new Date(),
				};

				mockDb.insert.mockReturnValueOnce({
					values: vi.fn(() => ({
						returning: vi.fn(() => [{ id: "project-1" }]),
					})),
				});

				await createProject(project, "user-123", "user", undefined);
				expect(mockDb.insert).toHaveBeenCalled();
			});
		});

		describe("updateProject", () => {
			it("should be a function", () => {
				expect(typeof updateProject).toBe("function");
			});

			it("should accept id, updates, actorId, actorType, and tokenName", async () => {
				mockDb.update.mockReturnValueOnce({
					set: vi.fn(() => ({
						where: vi.fn(() => ({
							returning: vi.fn(() => [{ name: "Updated Project" }]),
						})),
					})),
				});

				await updateProject(
					"project-1",
					{ name: "Updated Project" },
					"user-123",
					"user",
					undefined,
				);
				expect(mockDb.update).toHaveBeenCalled();
			});
		});

		describe("deleteProject", () => {
			it("should be a function", () => {
				expect(typeof deleteProject).toBe("function");
			});

			it("should delete associated tasks before deleting project (cascade)", async () => {
				const deleteSpy = vi.fn().mockReturnValue({
					where: vi.fn(() => ({
						returning: vi.fn(() => [{ name: "Deleted Project" }]),
					})),
				});

				mockDb.delete = deleteSpy;

				await deleteProject("project-1", "user-123", "user", undefined);

				expect(deleteSpy).toHaveBeenCalledTimes(2);
			});
		});
	});

	describe("Goal Operations", () => {
		describe("readGoals", () => {
			it("should be a function", () => {
				expect(typeof readGoals).toBe("function");
			});

			it("should accept userId parameter", async () => {
				mockDb.select.mockReturnValueOnce({
					from: vi.fn(() => ({
						where: vi.fn(() => ({
							orderBy: vi.fn(() => []),
						})),
					})),
				});

				await readGoals("user-123");
				expect(mockDb.select).toHaveBeenCalled();
			});
		});

		describe("createGoal", () => {
			it("should be a function", () => {
				expect(typeof createGoal).toBe("function");
			});

			it("should accept goal, userId, actorType, and tokenName", async () => {
				const goal = {
					id: "goal-1",
					name: "Test Goal",
					description: undefined,
					priority: "p2" as const,
					dueDate: undefined,
					color: "#10b981",
					createdAt: new Date(),
					updatedAt: new Date(),
				};

				mockDb.insert.mockReturnValueOnce({
					values: vi.fn(() => ({
						returning: vi.fn(() => [{ id: "goal-1" }]),
					})),
				});

				await createGoal(goal, "user-123", "user", undefined);
				expect(mockDb.insert).toHaveBeenCalled();
			});
		});

		describe("updateGoal", () => {
			it("should be a function", () => {
				expect(typeof updateGoal).toBe("function");
			});

			it("should accept id, updates, actorId, actorType, and tokenName", async () => {
				mockDb.update.mockReturnValueOnce({
					set: vi.fn(() => ({
						where: vi.fn(() => ({
							returning: vi.fn(() => [{ name: "Updated Goal" }]),
						})),
					})),
				});

				await updateGoal(
					"goal-1",
					{ name: "Updated Goal" },
					"user-123",
					"user",
					undefined,
				);
				expect(mockDb.update).toHaveBeenCalled();
			});
		});

		describe("deleteGoal", () => {
			it("should be a function", () => {
				expect(typeof deleteGoal).toBe("function");
			});

			it("should accept id, actorId, actorType, and tokenName", async () => {
				mockDb.delete.mockReturnValueOnce({
					where: vi.fn(() => ({
						returning: vi.fn(() => [{ name: "Deleted Goal" }]),
					})),
				});

				await deleteGoal("goal-1", "user-123", "user", undefined);
				expect(mockDb.delete).toHaveBeenCalled();
			});
		});
	});

	describe("Comment Operations", () => {
		describe("createComment", () => {
			it("should be a function", () => {
				expect(typeof createComment).toBe("function");
			});

			it("should accept taskId and comment", async () => {
				const comment = {
					id: "comment-1",
					content: "Test comment",
					postedAt: new Date(),
				};

				mockDb.insert.mockReturnValueOnce({
					values: vi.fn(() => ({
						returning: vi.fn(() => [{ id: "comment-1" }]),
					})),
				});

				await createComment("task-1", comment);
				expect(mockDb.insert).toHaveBeenCalled();
			});
		});

		describe("deleteComment", () => {
			it("should be a function", () => {
				expect(typeof deleteComment).toBe("function");
			});

			it("should accept commentId", async () => {
				mockDb.delete.mockReturnValueOnce({
					where: vi.fn(() => ({
						returning: vi.fn(() => [{ id: "comment-1" }]),
					})),
				});

				await deleteComment("comment-1");
				expect(mockDb.delete).toHaveBeenCalled();
			});
		});

		describe("syncComments", () => {
			it("should be a function", () => {
				expect(typeof syncComments).toBe("function");
			});

			it("should accept taskId, newComments, actorId, actorType, and tokenName", async () => {
				mockDb.select.mockReturnValueOnce({
					from: vi.fn(() => ({
						where: vi.fn(() => []),
					})),
				});

				await syncComments("task-1", [], "user-123", "user", undefined);
				expect(mockDb.select).toHaveBeenCalled();
			});
		});
	});

	describe("Edge Cases", () => {
		it("should handle empty results gracefully", async () => {
			mockDb.select.mockReturnValueOnce({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						orderBy: vi.fn(() => []),
					})),
				})),
			});

			const result = await readTasks("user-123");
			expect(result).toEqual([]);
		});

		it("should handle database errors", async () => {
			mockDb.select.mockImplementationOnce(() => {
				throw new Error("Database error");
			});

			await expect(readTasks("user-123")).rejects.toThrow("Database error");
		});
	});
});

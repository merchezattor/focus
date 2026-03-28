import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createComment,
	createGoal,
	createMilestone,
	createProject,
	createTask,
	createTasksBulk,
	deleteComment,
	deleteGoal,
	deleteMilestone,
	deleteProject,
	deleteTask,
	getTaskById,
	getTaskByIdForUser,
	getTaskCounts,
	getWorkingActionableProjectStats,
	getWorkingProjectStats,
	readActionableProjects,
	readGoals,
	readMilestones,
	readProjects,
	readTasks,
	searchTasks,
	syncComments,
	updateGoal,
	updateMilestone,
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
	getUnreadActionsCount: vi.fn(() => Promise.resolve(0)),
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
					completedAt: null,
					orderNum: 0,
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

		describe("createTasksBulk", () => {
			it("should be a function", () => {
				expect(typeof createTasksBulk).toBe("function");
			});

			it("should accept tasksList, userId, actorType, and tokenName", async () => {
				const task1 = {
					id: "task-1",
					title: "Test Task 1",
					completed: false,
					status: "todo" as const,
					priority: "p2" as const,
					projectId: "proj-1",
					parentId: null,
					dueDate: null,
					planDate: null,
					completedAt: null,
					orderNum: 0,
					comments: [],
					createdAt: new Date(),
					updatedAt: new Date(),
				};
				const task2 = {
					id: "task-2",
					title: "Test Task 2",
					completed: false,
					status: "todo" as const,
					priority: "p2" as const,
					projectId: "proj-1",
					parentId: "task-1",
					dueDate: null,
					planDate: null,
					completedAt: null,
					orderNum: 0,
					comments: [],
					createdAt: new Date(),
					updatedAt: new Date(),
				};

				mockDb.insert.mockReturnValue({
					values: vi.fn(() => ({
						returning: vi.fn(() => []),
					})),
				});

				await createTasksBulk([task1, task2], "user-123", "user", undefined);
				expect(mockDb.insert).toHaveBeenCalled(); // once for tasks
			});
		});

		describe("updateTask", () => {
			it("should be a function", () => {
				expect(typeof updateTask).toBe("function");
			});

			it("should accept id, updates, actorId, actorType, and tokenName", async () => {
				mockDb.select.mockReturnValueOnce({
					from: vi.fn(() => ({
						where: vi.fn(() => [
							{
								title: "Original Task",
								status: "todo",
								completedAt: null,
							},
						]),
					})),
				});
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
					})
					.mockReturnValueOnce({
						from: vi.fn(() => ({
							where: vi.fn(() => ({
								groupBy: vi.fn(() => [{ projectId: "p1", value: 2 }]),
							})),
						})),
					});

				const result = await getTaskCounts("user-123");
				expect(result).toEqual({
					backlogCount: 5,
					todayCount: 3,
					projectCounts: { p1: 2 },
				});
			});
		});
	});

	describe("Milestone Operations", () => {
		it("exposes milestone CRUD helpers", async () => {
			expect(typeof readMilestones).toBe("function");
			expect(typeof createMilestone).toBe("function");
			expect(typeof updateMilestone).toBe("function");
			expect(typeof deleteMilestone).toBe("function");

			mockDb.select.mockReturnValueOnce({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						orderBy: vi.fn(() => []),
					})),
				})),
			});

			await readMilestones("user-123");
			await createMilestone(
				{
					id: "550e8400-e29b-41d4-a716-446655440000",
					title: "Move to Japan",
					description: "Plan the relocation",
					targetDate: new Date("2026-05-01T00:00:00.000Z"),
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				"user-123",
			);
			await updateMilestone(
				"550e8400-e29b-41d4-a716-446655440000",
				{ title: "Updated title" },
				"user-123",
			);
			await deleteMilestone("550e8400-e29b-41d4-a716-446655440000", "user-123");

			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.insert).toHaveBeenCalled();
			expect(mockDb.update).toHaveBeenCalled();
			expect(mockDb.delete).toHaveBeenCalled();
		});
	});

	describe("Project Reads", () => {
		it("should read actionable projects only", async () => {
			mockDb.select.mockReturnValueOnce({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						orderBy: vi.fn(() => [
							{
								id: "project-1",
								name: "Project 1",
								color: "#ff0000",
								kind: "project",
								priority: "p2",
								description: null,
								status: "working",
								isFavorite: false,
								goalId: null,
								parentProjectId: null,
								view_type: "list",
								createdAt: new Date("2025-01-01"),
								updatedAt: new Date("2025-01-02"),
							},
						]),
					})),
				})),
			});

			const result = await readActionableProjects("user-123");

			expect(result).toEqual([
				{
					id: "project-1",
					name: "Project 1",
					color: "#ff0000",
					kind: "project",
					priority: "p2",
					description: undefined,
					status: "working",
					isFavorite: false,
					goalId: undefined,
					parentProjectId: undefined,
					viewType: "list",
					createdAt: new Date("2025-01-01"),
					updatedAt: new Date("2025-01-02"),
				},
			]);
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
					kind: "project" as const,
					priority: "p4" as const,
					status: "working" as const,
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

				await deleteComment("comment-1", "user-123");
				expect(mockDb.delete).toHaveBeenCalled();
			});
		});

		describe("syncComments", () => {
			it("should be a function", () => {
				expect(typeof syncComments).toBe("function");
			});

			it("should accept taskId, newComments, actorId, actorType, and tokenName and add/delete correctly", async () => {
				// Mock what's already in the DB
				mockDb.select.mockReturnValueOnce({
					from: vi.fn(() => ({
						where: vi.fn(() => [{ id: "comment-delete" }]), // This one will be deleted
					})),
				});

				// Mock getting task for the logAction
				mockDb.select.mockReturnValueOnce({
					from: vi.fn(() => ({
						where: vi.fn(() => [{ title: "Test task" }]),
					})),
				});

				const newComments = [
					{ id: "comment-add", content: "New comment", postedAt: new Date() },
				];

				await syncComments(
					"task-1",
					newComments,
					"user-123",
					"user",
					undefined,
				);

				// Assert delete was called for 'comment-delete'
				expect(mockDb.delete).toHaveBeenCalled();
				// Assert insert was called for 'comment-add'
				expect(mockDb.insert).toHaveBeenCalled();
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

	describe("getWorkingProjectStats", () => {
		it("should be a function", () => {
			expect(typeof getWorkingProjectStats).toBe("function");
		});

		it("should return project stats with correct aggregation for working projects", async () => {
			mockDb.select.mockReturnValueOnce({
				from: vi.fn(() => ({
					leftJoin: vi.fn(() => ({
						where: vi.fn(() => ({
							groupBy: vi.fn(() => ({
								orderBy: vi.fn(() => [
									{
										projectId: "proj-1",
										name: "Project 1",
										color: "#ff0000",
										doneCount: 3,
										inProgressCount: 5,
										backlogCount: 2,
									},
									{
										projectId: "proj-2",
										name: "Project 2",
										color: "#00ff00",
										doneCount: 1,
										inProgressCount: 0,
										backlogCount: 0,
									},
								]),
							})),
						})),
					})),
				})),
			});

			const result = await getWorkingProjectStats("user-123");

			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({
				projectId: "proj-1",
				name: "Project 1",
				color: "#ff0000",
				doneCount: 3,
				inProgressCount: 5,
				backlogCount: 2,
				totalCount: 10,
			});
			expect(result[1]).toEqual({
				projectId: "proj-2",
				name: "Project 2",
				color: "#00ff00",
				doneCount: 1,
				inProgressCount: 0,
				backlogCount: 0,
				totalCount: 1,
			});
		});

		it("should handle projects with zero tasks gracefully", async () => {
			mockDb.select.mockReturnValueOnce({
				from: vi.fn(() => ({
					leftJoin: vi.fn(() => ({
						where: vi.fn(() => ({
							groupBy: vi.fn(() => ({
								orderBy: vi.fn(() => [
									{
										projectId: "proj-empty",
										name: "Empty Project",
										color: "#0000ff",
										doneCount: 0,
										inProgressCount: 0,
										backlogCount: 0,
									},
								]),
							})),
						})),
					})),
				})),
			});

			const result = await getWorkingProjectStats("user-123");

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				projectId: "proj-empty",
				name: "Empty Project",
				color: "#0000ff",
				doneCount: 0,
				inProgressCount: 0,
				backlogCount: 0,
				totalCount: 0,
			});
		});

		it("should filter to only working projects", async () => {
			mockDb.select.mockReturnValueOnce({
				from: vi.fn(() => ({
					leftJoin: vi.fn(() => ({
						where: vi.fn(() => ({
							groupBy: vi.fn(() => ({
								orderBy: vi.fn(() => []),
							})),
						})),
					})),
				})),
			});

			await getWorkingProjectStats("user-123");

			expect(mockDb.select).toHaveBeenCalled();
		});
	});

	describe("getWorkingActionableProjectStats", () => {
		it("should be a function", () => {
			expect(typeof getWorkingActionableProjectStats).toBe("function");
		});

		it("should return project stats for actionable projects", async () => {
			mockDb.select.mockReturnValueOnce({
				from: vi.fn(() => ({
					leftJoin: vi.fn(() => ({
						where: vi.fn(() => ({
							groupBy: vi.fn(() => ({
								orderBy: vi.fn(() => [
									{
										projectId: "proj-actionable",
										name: "Actionable Project",
										color: "#ff0000",
										priority: "p1",
										doneCount: 1,
										inProgressCount: 2,
										backlogCount: 3,
									},
								]),
							})),
						})),
					})),
				})),
			});

			const result = await getWorkingActionableProjectStats("user-123");

			expect(result).toEqual([
				{
					projectId: "proj-actionable",
					name: "Actionable Project",
					color: "#ff0000",
					priority: "p1",
					doneCount: 1,
					inProgressCount: 2,
					backlogCount: 3,
					totalCount: 6,
				},
			]);
		});
	});
});

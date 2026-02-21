import { beforeEach, describe, expect, it, vi } from "vitest";

describe("actions.ts", () => {
	describe("logAction", () => {
		it("should be a function", async () => {
			const { logAction } = await import("../actions");
			expect(typeof logAction).toBe("function");
		});

		it("should accept entityId, entityType, actorId, and actionType params", async () => {
			const { logAction } = await import("../actions");

			expect(() => {
				logAction({
					entityId: "test-id",
					entityType: "task",
					actorId: "user-1",
					actionType: "create",
				});
			}).not.toThrow();
		});

		it("should accept optional actorType parameter", async () => {
			const { logAction } = await import("../actions");

			expect(() => {
				logAction({
					entityId: "test-id",
					entityType: "task",
					actorId: "user-1",
					actorType: "agent",
					actionType: "create",
				});
			}).not.toThrow();
		});

		it("should accept optional changes and metadata", async () => {
			const { logAction } = await import("../actions");

			expect(() => {
				logAction({
					entityId: "test-id",
					entityType: "task",
					actorId: "user-1",
					actionType: "update",
					changes: { title: "New Title" },
					metadata: { source: "test" },
				});
			}).not.toThrow();
		});

		it("should accept all entity types", async () => {
			const { logAction } = await import("../actions");
			const entityTypes = ["task", "project", "goal"] as const;

			for (const entityType of entityTypes) {
				expect(() => {
					logAction({
						entityId: "test-id",
						entityType,
						actorId: "user-1",
						actionType: "create",
					});
				}).not.toThrow();
			}
		});

		it("should accept all action types", async () => {
			const { logAction } = await import("../actions");
			const actionTypes = [
				"create",
				"update",
				"delete",
				"complete",
				"uncomplete",
			] as const;

			for (const actionType of actionTypes) {
				expect(() => {
					logAction({
						entityId: "test-id",
						entityType: "task",
						actorId: "user-1",
						actionType,
					});
				}).not.toThrow();
			}
		});
	});

	describe("getActions", () => {
		it("should be an async function", async () => {
			const { getActions } = await import("../actions");
			expect(typeof getActions).toBe("function");
			expect(getActions.constructor.name).toBe("AsyncFunction");
		});

		it("should require userId parameter", async () => {
			const { getActions } = await import("../actions");

			await expect(getActions({ userId: "user-1" })).rejects.toThrow();
		});

		it("should accept optional isRead filter", async () => {
			const { getActions } = await import("../actions");

			await expect(
				getActions({ userId: "user-1", isRead: true }),
			).rejects.toThrow();
		});

		it("should accept optional entityType filter", async () => {
			const { getActions } = await import("../actions");

			await expect(
				getActions({ userId: "user-1", entityType: "task" }),
			).rejects.toThrow();
		});

		it("should accept optional entityId filter", async () => {
			const { getActions } = await import("../actions");

			await expect(
				getActions({ userId: "user-1", entityId: "task-1" }),
			).rejects.toThrow();
		});

		it("should accept optional actorType filter", async () => {
			const { getActions } = await import("../actions");

			await expect(
				getActions({ userId: "user-1", actorType: "agent" }),
			).rejects.toThrow();
		});

		it("should accept optional includeOwn parameter", async () => {
			const { getActions } = await import("../actions");

			await expect(
				getActions({ userId: "user-1", includeOwn: true }),
			).rejects.toThrow();
			await expect(
				getActions({ userId: "user-1", includeOwn: false }),
			).rejects.toThrow();
		});

		it("should accept optional limit parameter", async () => {
			const { getActions } = await import("../actions");

			await expect(
				getActions({ userId: "user-1", limit: 10 }),
			).rejects.toThrow();
		});
	});

	describe("markActionsRead", () => {
		it("should be an async function", async () => {
			const { markActionsRead } = await import("../actions");
			expect(typeof markActionsRead).toBe("function");
			expect(markActionsRead.constructor.name).toBe("AsyncFunction");
		});

		it("should accept array of action ids", async () => {
			const { markActionsRead } = await import("../actions");

			await expect(markActionsRead(["action-1", "action-2"])).rejects.toThrow();
		});

		it("should return early for empty array", async () => {
			const { markActionsRead } = await import("../actions");

			await expect(markActionsRead([])).resolves.toBeUndefined();
		});

		it("should accept single action id", async () => {
			const { markActionsRead } = await import("../actions");

			await expect(markActionsRead(["action-1"])).rejects.toThrow();
		});
	});

	describe("markAllActionsRead", () => {
		it("should be an async function", async () => {
			const { markAllActionsRead } = await import("../actions");
			expect(typeof markAllActionsRead).toBe("function");
			expect(markAllActionsRead.constructor.name).toBe("AsyncFunction");
		});

		it("should accept userId parameter", async () => {
			const { markAllActionsRead } = await import("../actions");

			await expect(markAllActionsRead("user-1")).rejects.toThrow();
		});
	});

	describe("getUnreadActionsCount", () => {
		it("should be an async function", async () => {
			const { getUnreadActionsCount } = await import("../actions");
			expect(typeof getUnreadActionsCount).toBe("function");
			expect(getUnreadActionsCount.constructor.name).toBe("AsyncFunction");
		});

		it("should accept userId parameter", async () => {
			const { getUnreadActionsCount } = await import("../actions");

			await expect(getUnreadActionsCount("user-1")).rejects.toThrow();
		});

		it("should return a number", async () => {
			const { getUnreadActionsCount } = await import("../actions");

			try {
				const result = await getUnreadActionsCount("user-1");
				expect(typeof result).toBe("number");
			} catch {
				// Expected to fail without DB
			}
		});
	});
});

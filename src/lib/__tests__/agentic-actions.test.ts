import { beforeEach, describe, expect, it, vi } from "vitest";
import { logAction } from "@/lib/actions";
import { focus_create_agentic_action } from "@/lib/mcp/tools/actions";
import type { MCPServerContext } from "@/lib/mcp/types";
import * as storage from "@/lib/storage";

vi.mock("@/db", () => ({
	getDb: vi.fn(() => ({
		insert: vi.fn(() => ({
			values: vi.fn(),
		})),
	})),
}));

describe("Agentic Actions", () => {
	const validTaskId = "550e8400-e29b-41d4-a716-446655440000";
	const validUserId = "550e8400-e29b-41d4-a716-446655440001";

	const mockContext: MCPServerContext = {
		user: {
			id: validUserId,
			email: "test@example.com",
			name: "Test User",
			emailVerified: true,
			createdAt: new Date(),
			updatedAt: new Date(),
			image: null,
		},
		actorType: "agent",
		tokenName: "test-token",
	};

	beforeEach(() => {
		vi.resetAllMocks();
	});

	describe("logAction with comment", () => {
		it("should store comment when provided", () => {
			logAction({
				entityId: validTaskId,
				entityType: "task",
				actorId: validUserId,
				actorType: "agent",
				actionType: "reviewed",
				comment: "This task needs more detail",
			});
		});

		it("should handle long comments up to 2000 characters", () => {
			const longComment = "a".repeat(2000);

			expect(() => {
				logAction({
					entityId: validTaskId,
					entityType: "task",
					actorId: validUserId,
					actorType: "agent",
					actionType: "processed",
					comment: longComment,
				});
			}).not.toThrow();
		});
	});

	describe("logAction without comment (backward compatibility)", () => {
		it("should work without comment parameter", () => {
			expect(() => {
				logAction({
					entityId: validTaskId,
					entityType: "task",
					actorId: validUserId,
					actorType: "agent",
					actionType: "reviewed",
				});
			}).not.toThrow();
		});
	});

	describe("focus_create_agentic_action", () => {
		describe("successful creation", () => {
			it("should create agentic action with actionType 'reviewed'", async () => {
				vi.spyOn(storage, "getTaskByIdForUser").mockResolvedValueOnce({
					id: validTaskId,
					content: "Test Task",
				} as any);

				const result = await focus_create_agentic_action(
					{
						entityId: validTaskId,
						entityType: "task",
						actionType: "reviewed",
					},
					mockContext,
				);

				expect(result.content[0].text).toContain('"success":true');
				expect(result.content[0].text).toContain('"actionType":"reviewed"');
			});

			it("should create agentic action with actionType 'groomed'", async () => {
				vi.spyOn(storage, "getTaskByIdForUser").mockResolvedValueOnce({
					id: validTaskId,
					content: "Test Task",
				} as any);

				const result = await focus_create_agentic_action(
					{
						entityId: validTaskId,
						entityType: "task",
						actionType: "groomed",
					},
					mockContext,
				);

				expect(result.content[0].text).toContain('"success":true');
				expect(result.content[0].text).toContain('"actionType":"groomed"');
			});

			it("should create agentic action with actionType 'processed'", async () => {
				vi.spyOn(storage, "getTaskByIdForUser").mockResolvedValueOnce({
					id: validTaskId,
					content: "Test Task",
				} as any);

				const result = await focus_create_agentic_action(
					{
						entityId: validTaskId,
						entityType: "task",
						actionType: "processed",
					},
					mockContext,
				);

				expect(result.content[0].text).toContain('"success":true');
				expect(result.content[0].text).toContain('"actionType":"processed"');
			});

			it("should create agentic action with optional comment", async () => {
				vi.spyOn(storage, "getTaskByIdForUser").mockResolvedValueOnce({
					id: validTaskId,
					content: "Test Task",
				} as any);

				const result = await focus_create_agentic_action(
					{
						entityId: validTaskId,
						entityType: "task",
						actionType: "reviewed",
						comment: "Good progress on this task",
					},
					mockContext,
				);

				expect(result.content[0].text).toContain('"success":true');
				expect(result.content[0].text).toContain(
					'"comment":"Good progress on this task"',
				);
			});

			it("should trim comment whitespace", async () => {
				vi.spyOn(storage, "getTaskByIdForUser").mockResolvedValueOnce({
					id: validTaskId,
					content: "Test Task",
				} as any);

				const result = await focus_create_agentic_action(
					{
						entityId: validTaskId,
						entityType: "task",
						actionType: "reviewed",
						comment: "  trimmed comment  ",
					},
					mockContext,
				);

				expect(result.content[0].text).toContain('"success":true');
				expect(result.content[0].text).toContain('"comment":"trimmed comment"');
			});
		});

		describe("validation errors", () => {
			it("should reject invalid entityId (not a UUID)", async () => {
				const result = await focus_create_agentic_action(
					{
						entityId: "not-a-uuid",
						entityType: "task",
						actionType: "reviewed",
					},
					mockContext,
				);

				expect(result.isError).toBe(true);
				expect(result.content[0].text).toContain("Invalid arguments");
			});

			it("should reject invalid actionType", async () => {
				const result = await focus_create_agentic_action(
					{
						entityId: validTaskId,
						entityType: "task",
						actionType: "invalid-action" as any,
					},
					mockContext,
				);

				expect(result.isError).toBe(true);
				expect(result.content[0].text).toContain("Invalid arguments");
			});

			it("should reject comment exceeding 2000 characters", async () => {
				vi.spyOn(storage, "getTaskByIdForUser").mockResolvedValueOnce({
					id: validTaskId,
					content: "Test Task",
				} as any);
				const longComment = "a".repeat(2001);

				const result = await focus_create_agentic_action(
					{
						entityId: validTaskId,
						entityType: "task",
						actionType: "reviewed",
						comment: longComment,
					},
					mockContext,
				);

				expect(result.isError).toBe(true);
				expect(result.content[0].text).toContain("Invalid arguments");
			});

			it("should reject empty/whitespace-only comment", async () => {
				vi.spyOn(storage, "getTaskByIdForUser").mockResolvedValueOnce({
					id: validTaskId,
					content: "Test Task",
				} as any);

				const result = await focus_create_agentic_action(
					{
						entityId: validTaskId,
						entityType: "task",
						actionType: "reviewed",
						comment: "   ",
					},
					mockContext,
				);

				expect(result.isError).toBe(true);
				expect(result.content[0].text).toContain(
					"Comment cannot be empty or whitespace-only",
				);
			});
		});

		describe("ownership enforcement", () => {
			it("should reject when task not found (ownership check fails)", async () => {
				vi.spyOn(storage, "getTaskByIdForUser").mockResolvedValue(null as any);

				const result = await focus_create_agentic_action(
					{
						entityId: validTaskId,
						entityType: "task",
						actionType: "reviewed",
					},
					mockContext,
				);
				expect(result.isError).toEqual(true);
				expect(result.content[0].text).toContain("Access denied");
			});

			it("should call getTaskByIdForUser with correct parameters", async () => {
				vi.spyOn(storage, "getTaskByIdForUser").mockResolvedValueOnce({
					id: validTaskId,
					content: "Test Task",
				} as any);

				await focus_create_agentic_action(
					{
						entityId: validTaskId,
						entityType: "task",
						actionType: "groomed",
					},
					mockContext,
				);

				expect(storage.getTaskByIdForUser).toHaveBeenCalledWith(
					validTaskId,
					validUserId,
				);
			});
		});

		describe("comment validation", () => {
			it("should allow comment up to 2000 characters", async () => {
				vi.spyOn(storage, "getTaskByIdForUser").mockResolvedValueOnce({
					id: validTaskId,
					content: "Test Task",
				} as any);

				const result = await focus_create_agentic_action(
					{
						entityId: validTaskId,
						entityType: "task",
						actionType: "processed",
						comment: "a".repeat(2000),
					},
					mockContext,
				);

				expect(result.content[0].text).toContain('"success":true');
			});

			it("should handle comment as undefined (optional)", async () => {
				vi.spyOn(storage, "getTaskByIdForUser").mockResolvedValueOnce({
					id: validTaskId,
					content: "Test Task",
				} as any);

				const result = await focus_create_agentic_action(
					{
						entityId: validTaskId,
						entityType: "task",
						actionType: "reviewed",
						comment: undefined,
					},
					mockContext,
				);

				expect(result.content[0].text).toContain('"success":true');
			});
		});
	});
});

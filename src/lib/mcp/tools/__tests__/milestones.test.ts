import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Milestone } from "@/types";

const mockReadMilestones = vi.fn();
const mockCreateMilestone = vi.fn();
const mockUpdateMilestone = vi.fn();
const mockDeleteMilestone = vi.fn();

vi.mock("@/lib/storage", () => ({
	readMilestones: (...args: unknown[]) => mockReadMilestones(...args),
	createMilestone: (...args: unknown[]) => mockCreateMilestone(...args),
	updateMilestone: (...args: unknown[]) => mockUpdateMilestone(...args),
	deleteMilestone: (...args: unknown[]) => mockDeleteMilestone(...args),
}));

import {
	focusCreateMilestone,
	focusDeleteMilestone,
	focusListMilestones,
	focusUpdateMilestone,
} from "../milestones";

describe("MCP Milestone Tools", () => {
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

	const mockMilestones: Milestone[] = [
		{
			id: "550e8400-e29b-41d4-a716-446655440000",
			title: "Promotion",
			description: "Staff engineer promotion",
			targetDate: new Date("2026-06-01T00:00:00.000Z"),
			createdAt: new Date("2026-01-01T00:00:00.000Z"),
			updatedAt: new Date("2026-01-02T00:00:00.000Z"),
		},
	];

	beforeEach(() => {
		vi.clearAllMocks();
		mockReadMilestones.mockResolvedValue(mockMilestones);
		mockCreateMilestone.mockResolvedValue(undefined);
		mockUpdateMilestone.mockResolvedValue(undefined);
		mockDeleteMilestone.mockResolvedValue(undefined);
	});

	it("lists milestones", async () => {
		const result = await focusListMilestones({}, mockContext);

		expect(mockReadMilestones).toHaveBeenCalledWith("user-123");
		expect(result.isError).toBeUndefined();
		expect(JSON.parse(result.content[0]?.text ?? "{}")).toMatchObject({
			success: true,
			data: expect.arrayContaining([
				expect.objectContaining({ title: "Promotion" }),
			]),
		});
	});

	it("creates milestones", async () => {
		const result = await focusCreateMilestone(
			{
				title: "Move to Japan",
				description: "Relocation milestone",
				targetDate: "2026-09-01T00:00:00.000Z",
			},
			mockContext,
		);

		expect(mockCreateMilestone).toHaveBeenCalledOnce();
		expect(JSON.parse(result.content[0]?.text ?? "{}")).toMatchObject({
			success: true,
			data: expect.objectContaining({ title: "Move to Japan" }),
		});
	});

	it("updates milestones", async () => {
		const result = await focusUpdateMilestone(
			{
				id: "550e8400-e29b-41d4-a716-446655440000",
				title: "Updated milestone",
			},
			mockContext,
		);

		expect(mockUpdateMilestone).toHaveBeenCalledWith(
			"550e8400-e29b-41d4-a716-446655440000",
			expect.objectContaining({ title: "Updated milestone" }),
			"user-123",
			"agent",
			"test-token",
		);
		expect(JSON.parse(result.content[0]?.text ?? "{}")).toMatchObject({
			success: true,
		});
	});

	it("deletes milestones", async () => {
		const result = await focusDeleteMilestone(
			{ id: "550e8400-e29b-41d4-a716-446655440000" },
			mockContext,
		);

		expect(mockDeleteMilestone).toHaveBeenCalledWith(
			"550e8400-e29b-41d4-a716-446655440000",
			"user-123",
			"agent",
			"test-token",
		);
		expect(JSON.parse(result.content[0]?.text ?? "{}")).toMatchObject({
			success: true,
			id: "550e8400-e29b-41d4-a716-446655440000",
		});
	});
});

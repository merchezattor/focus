import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetAuthenticatedUser = vi.fn();
const mockReadMilestones = vi.fn();
const mockCreateMilestone = vi.fn();
const mockUpdateMilestone = vi.fn();
const mockDeleteMilestone = vi.fn();

vi.mock("@/lib/api-auth", () => ({
	getAuthenticatedUser: (...args: unknown[]) =>
		mockGetAuthenticatedUser(...args),
}));

vi.mock("@/lib/storage", () => ({
	readMilestones: (...args: unknown[]) => mockReadMilestones(...args),
	createMilestone: (...args: unknown[]) => mockCreateMilestone(...args),
	updateMilestone: (...args: unknown[]) => mockUpdateMilestone(...args),
	deleteMilestone: (...args: unknown[]) => mockDeleteMilestone(...args),
}));

import { DELETE, GET, POST, PUT } from "../route";

describe("Milestones API", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns milestones for authenticated users", async () => {
		mockGetAuthenticatedUser.mockResolvedValueOnce({
			user: { id: "user-123" },
			actorType: "user",
		});
		mockReadMilestones.mockResolvedValueOnce([
			{ id: "milestone-1", title: "Promotion" },
		]);

		const request = { url: "http://localhost/api/milestones" } as NextRequest;
		const response = await GET(request);

		expect(response.status).toBe(200);
		expect(mockReadMilestones).toHaveBeenCalledWith("user-123");
		expect(await response.json()).toEqual({
			milestones: [{ id: "milestone-1", title: "Promotion" }],
		});
	});

	it("creates milestones", async () => {
		mockGetAuthenticatedUser.mockResolvedValueOnce({
			user: { id: "user-123" },
			actorType: "user",
			tokenName: "web",
		});

		const request = {
			url: "http://localhost/api/milestones",
			json: async () => ({
				title: "Move to Japan",
				description: "Relocation",
				targetDate: "2026-09-01T00:00:00.000Z",
			}),
		} as NextRequest;
		const response = await POST(request);
		const data = await response.json();

		expect(response.status).toBe(201);
		expect(data.milestone.title).toBe("Move to Japan");
		expect(mockCreateMilestone).toHaveBeenCalledOnce();
	});

	it("updates milestones", async () => {
		mockGetAuthenticatedUser.mockResolvedValueOnce({
			user: { id: "user-123" },
			actorType: "user",
			tokenName: "web",
		});

		const request = {
			url: "http://localhost/api/milestones",
			json: async () => ({
				id: "550e8400-e29b-41d4-a716-446655440000",
				title: "Updated milestone",
			}),
		} as NextRequest;
		const response = await PUT(request);

		expect(response.status).toBe(200);
		expect(mockUpdateMilestone).toHaveBeenCalledWith(
			"550e8400-e29b-41d4-a716-446655440000",
			expect.objectContaining({ title: "Updated milestone" }),
			"user-123",
			"user",
			"web",
		);
	});

	it("deletes milestones", async () => {
		mockGetAuthenticatedUser.mockResolvedValueOnce({
			user: { id: "user-123" },
			actorType: "user",
			tokenName: "web",
		});

		const request = {
			url: "http://localhost/api/milestones?id=550e8400-e29b-41d4-a716-446655440000",
		} as NextRequest;
		const response = await DELETE(request);

		expect(response.status).toBe(200);
		expect(mockDeleteMilestone).toHaveBeenCalledWith(
			"550e8400-e29b-41d4-a716-446655440000",
			"user-123",
			"user",
			"web",
		);
	});
});

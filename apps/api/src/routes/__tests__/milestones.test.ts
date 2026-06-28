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
			readMilestones: vi.fn(),
			createMilestone: vi.fn(),
			updateMilestone: vi.fn(),
			deleteMilestone: vi.fn(),
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

const { milestonesRouter } = await import("../milestones");
const app = new Hono().route("/api/milestones", milestonesRouter);

const json = (body: unknown) => ({
	method: "POST",
	headers: { "Content-Type": "application/json" },
	body: JSON.stringify(body),
});

describe("Milestones API (Hono)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		h.state.auth = h.defaultAuth;
	});

	it("returns milestones for authenticated users", async () => {
		h.storage.readMilestones.mockResolvedValueOnce([
			{ id: "milestone-1", title: "Promotion" },
		]);
		const res = await app.request("/api/milestones");
		expect(res.status).toBe(200);
		expect(h.storage.readMilestones).toHaveBeenCalledWith("user-123");
		expect(await res.json()).toEqual({
			milestones: [{ id: "milestone-1", title: "Promotion" }],
		});
	});

	it("creates milestones", async () => {
		h.storage.createMilestone.mockResolvedValueOnce(undefined);
		const res = await app.request(
			"/api/milestones",
			json({
				title: "Move to Japan",
				description: "Relocation",
				targetDate: "2026-09-01T00:00:00.000Z",
			}),
		);
		const data = await res.json();
		expect(res.status).toBe(201);
		expect(data.milestone.title).toBe("Move to Japan");
		expect(h.storage.createMilestone).toHaveBeenCalledOnce();
	});

	it("updates milestones", async () => {
		h.storage.updateMilestone.mockResolvedValueOnce(undefined);
		const res = await app.request("/api/milestones", {
			...json({
				id: "550e8400-e29b-41d4-a716-446655440000",
				title: "Updated milestone",
			}),
			method: "PUT",
		});
		expect(res.status).toBe(200);
		expect(h.storage.updateMilestone).toHaveBeenCalledWith(
			"550e8400-e29b-41d4-a716-446655440000",
			expect.objectContaining({ title: "Updated milestone" }),
			"user-123",
			"user",
			"web",
		);
	});

	it("deletes milestones", async () => {
		h.storage.deleteMilestone.mockResolvedValueOnce(undefined);
		const res = await app.request(
			"/api/milestones?id=550e8400-e29b-41d4-a716-446655440000",
			{ method: "DELETE" },
		);
		expect(res.status).toBe(200);
		expect(h.storage.deleteMilestone).toHaveBeenCalledWith(
			"550e8400-e29b-41d4-a716-446655440000",
			"user-123",
			"user",
			"web",
		);
	});
});

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
			readActionableProjects: vi.fn(),
			createProject: vi.fn(),
			updateProject: vi.fn(),
			deleteProject: vi.fn(),
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

const { projectsRouter } = await import("../projects");
const app = new Hono().route("/api/projects", projectsRouter);

const json = (body: unknown) => ({
	method: "POST",
	headers: { "Content-Type": "application/json" },
	body: JSON.stringify(body),
});

describe("Projects API (Hono)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		h.state.auth = h.defaultAuth;
	});

	it("returns 401 when not authenticated", async () => {
		h.state.auth = null;
		const res = await app.request("/api/projects");
		expect(res.status).toBe(401);
		expect((await res.json()) as any).toEqual({ error: "Unauthorized" });
	});

	it("returns actionable projects only for authenticated users", async () => {
		h.storage.readActionableProjects.mockResolvedValueOnce([
			{ id: "project-1", name: "Actionable Project", kind: "project" },
		]);
		const res = await app.request("/api/projects");
		expect(res.status).toBe(200);
		expect(h.storage.readActionableProjects).toHaveBeenCalledWith("user-123");
		expect((await res.json()) as any).toEqual({
			projects: [
				{ id: "project-1", name: "Actionable Project", kind: "project" },
			],
		});
	});

	it("creates a group project when kind=group is provided", async () => {
		h.storage.createProject.mockResolvedValueOnce(undefined);
		const res = await app.request(
			"/api/projects",
			json({
				name: "Group Node",
				color: "#10b981",
				kind: "group",
				isFavorite: false,
			}),
		);
		const data = (await res.json()) as any;
		expect(res.status).toBe(201);
		expect(data.project.kind).toBe("group");
		expect(h.storage.createProject).toHaveBeenCalledOnce();
		expect(h.storage.createProject.mock.calls[0]?.[0]).toMatchObject({
			name: "Group Node",
			kind: "group",
		});
	});

	it("passes kind updates through to storage", async () => {
		h.storage.updateProject.mockResolvedValueOnce(undefined);
		const res = await app.request("/api/projects", {
			...json({ id: "project-1", kind: "group" }),
			method: "PUT",
		});
		expect(res.status).toBe(200);
		expect(h.storage.updateProject).toHaveBeenCalledWith(
			"project-1",
			expect.objectContaining({ kind: "group" }),
			"user-123",
			"user",
			"web",
		);
	});
});

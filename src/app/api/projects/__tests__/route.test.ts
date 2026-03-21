import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetAuthenticatedUser = vi.fn();
const mockReadActionableProjects = vi.fn();
const mockCreateProject = vi.fn();
const mockUpdateProject = vi.fn();
const mockDeleteProject = vi.fn();

vi.mock("@/lib/api-auth", () => ({
	getAuthenticatedUser: (...args: unknown[]) =>
		mockGetAuthenticatedUser(...args),
}));

vi.mock("@/lib/storage", () => ({
	readActionableProjects: (...args: unknown[]) =>
		mockReadActionableProjects(...args),
	createProject: (...args: unknown[]) => mockCreateProject(...args),
	updateProject: (...args: unknown[]) => mockUpdateProject(...args),
	deleteProject: (...args: unknown[]) => mockDeleteProject(...args),
}));

import { GET, POST, PUT } from "../route";

describe("Projects API", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("GET /api/projects", () => {
		it("returns 401 when not authenticated", async () => {
			mockGetAuthenticatedUser.mockResolvedValueOnce(null);

			const request = { url: "http://localhost/api/projects" } as NextRequest;
			const response = await GET(request);

			expect(response.status).toBe(401);
			expect(await response.json()).toEqual({ error: "Unauthorized" });
		});

		it("returns actionable projects only for authenticated users", async () => {
			mockGetAuthenticatedUser.mockResolvedValueOnce({
				user: { id: "user-123" },
				actorType: "user",
			});
			mockReadActionableProjects.mockResolvedValueOnce([
				{ id: "project-1", name: "Actionable Project", kind: "project" },
			]);

			const request = { url: "http://localhost/api/projects" } as NextRequest;
			const response = await GET(request);

			expect(response.status).toBe(200);
			expect(mockReadActionableProjects).toHaveBeenCalledWith("user-123");
			expect(await response.json()).toEqual({
				projects: [
					{ id: "project-1", name: "Actionable Project", kind: "project" },
				],
			});
		});
	});

	describe("POST /api/projects", () => {
		it("creates a container project when kind=container is provided", async () => {
			mockGetAuthenticatedUser.mockResolvedValueOnce({
				user: { id: "user-123" },
				actorType: "user",
				tokenName: "web",
			});
			mockCreateProject.mockResolvedValueOnce(undefined);

			const request = {
				url: "http://localhost/api/projects",
				json: async () => ({
					name: "Container Node",
					color: "#10b981",
					kind: "container",
					isFavorite: false,
				}),
			} as NextRequest;
			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(201);
			expect(data.project.kind).toBe("container");
			expect(mockCreateProject).toHaveBeenCalledOnce();
			expect(mockCreateProject.mock.calls[0]?.[0]).toMatchObject({
				name: "Container Node",
				kind: "container",
			});
		});
	});

	describe("PUT /api/projects", () => {
		it("passes kind updates through to storage", async () => {
			mockGetAuthenticatedUser.mockResolvedValueOnce({
				user: { id: "user-123" },
				actorType: "user",
				tokenName: "web",
			});
			mockUpdateProject.mockResolvedValueOnce(undefined);

			const request = {
				url: "http://localhost/api/projects",
				json: async () => ({
					id: "project-1",
					kind: "container",
				}),
			} as NextRequest;
			const response = await PUT(request);

			expect(response.status).toBe(200);
			expect(mockUpdateProject).toHaveBeenCalledWith(
				"project-1",
				expect.objectContaining({ kind: "container" }),
				"user-123",
				"user",
				"web",
			);
		});
	});
});

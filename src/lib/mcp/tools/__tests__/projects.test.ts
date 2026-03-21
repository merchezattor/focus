import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Project } from "@/types";

const mockReadProjects = vi.fn();
const mockCreateProject = vi.fn();
const mockUpdateProject = vi.fn();
const mockDeleteProject = vi.fn();

vi.mock("@/lib/storage", () => ({
	readProjects: (...args: unknown[]) => mockReadProjects(...args),
	createProject: (...args: unknown[]) => mockCreateProject(...args),
	updateProject: (...args: unknown[]) => mockUpdateProject(...args),
	deleteProject: (...args: unknown[]) => mockDeleteProject(...args),
}));

import { focusListProjects } from "../projects";

describe("MCP Project Tools", () => {
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

	const mockProjects: Project[] = [
		{
			id: "project-1",
			name: "Actionable Project",
			color: "#ff0000",
			kind: "project",
			priority: "p1",
			status: "working",
			isFavorite: false,
			viewType: "list",
			createdAt: new Date("2025-01-01"),
			updatedAt: new Date("2025-01-02"),
		},
		{
			id: "project-2",
			name: "Container Node",
			color: "#00ff00",
			kind: "container",
			priority: "p2",
			status: "working",
			isFavorite: false,
			viewType: "list",
			createdAt: new Date("2025-01-03"),
			updatedAt: new Date("2025-01-04"),
		},
	];

	beforeEach(() => {
		vi.clearAllMocks();
		mockReadProjects.mockResolvedValue(mockProjects);
	});

	describe("focusListProjects", () => {
		it("returns all projects by default", async () => {
			const result = await focusListProjects({}, mockContext);

			expect(mockReadProjects).toHaveBeenCalledWith("user-123");
			expect(result.isError).toBeUndefined();
			expect(result.content).toHaveLength(1);

			const payload = JSON.parse(result.content[0]?.text ?? "{}");
			expect(payload.success).toBe(true);
			expect(payload.data).toHaveLength(2);
			expect(payload.data.map((project: Project) => project.kind)).toEqual([
				"project",
				"container",
			]);
		});

		it("filters projects by kind when requested", async () => {
			const result = await focusListProjects(
				{ kind: ["project"] },
				mockContext,
			);

			expect(mockReadProjects).toHaveBeenCalledWith("user-123");
			expect(result.isError).toBeUndefined();

			const payload = JSON.parse(result.content[0]?.text ?? "{}");
			expect(payload.success).toBe(true);
			expect(payload.data).toHaveLength(1);
			expect(payload.data[0]?.kind).toBe("project");
			expect(payload.data[0]?.name).toBe("Actionable Project");
		});
	});
});

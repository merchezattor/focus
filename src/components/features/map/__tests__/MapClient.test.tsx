import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import type { Goal, Project, Task } from "@/types";

vi.mock("@xyflow/react", () => ({
	Background: () => null,
	Controls: () => null,
	Handle: () => null,
	Position: {
		Top: "top",
		Bottom: "bottom",
		Left: "left",
		Right: "right",
	},
	ReactFlow: ({
		nodes,
	}: {
		nodes: Array<{ id: string; data?: { label?: string } }>;
	}) => (
		<div data-testid="react-flow-mock">
			{nodes.map((node) => (
				<div key={node.id}>{node.data?.label}</div>
			))}
		</div>
	),
	useEdgesState: (initialEdges: unknown[]) => [initialEdges, vi.fn(), vi.fn()],
	useNodesState: (initialNodes: unknown[]) => [initialNodes, vi.fn(), vi.fn()],
}));

import { MapClient } from "../MapClient";

describe("MapClient", () => {
	it("renders both actionable projects and containers, but excludes archived projects", () => {
		const projects: Project[] = [
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
				parentProjectId: "project-1",
				viewType: "list",
				createdAt: new Date("2025-01-03"),
				updatedAt: new Date("2025-01-04"),
			},
			{
				id: "project-3",
				name: "Archived Project",
				color: "#0000ff",
				kind: "project",
				priority: "p3",
				status: "archived",
				isFavorite: false,
				viewType: "list",
				createdAt: new Date("2025-01-05"),
				updatedAt: new Date("2025-01-06"),
			},
		];

		const goals: Goal[] = [
			{
				id: "goal-1",
				name: "Top Goal",
				description: undefined,
				priority: "p1",
				color: "#f97316",
				createdAt: new Date("2025-01-01"),
				updatedAt: new Date("2025-01-02"),
			},
		];

		const tasks: Task[] = [];

		render(
			<MapClient
				initialProjects={projects}
				initialTasks={tasks}
				initialGoals={goals}
			/>,
		);

		expect(screen.getByText("Top Goal")).toBeInTheDocument();
		expect(screen.getByText("Actionable Project")).toBeInTheDocument();
		expect(screen.getByText("Container Node")).toBeInTheDocument();
		expect(screen.queryByText("Archived Project")).not.toBeInTheDocument();
	});
});

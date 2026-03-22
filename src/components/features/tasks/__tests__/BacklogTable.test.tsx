import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Project, Task } from "@/types";
import { BacklogTable } from "../BacklogTable";

const mockProjects = new Map<string, Project>([
	[
		"project-1",
		{
			id: "project-1",
			name: "Test Project",
			color: "#ff0000",
			kind: "project",
			priority: "p1",
			status: "working",
			isFavorite: false,
			viewType: "list",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	],
]);

const mockTasks: Task[] = [
	{
		id: "task-1",
		title: "Test Task with Project",
		description: "This is a test description",
		status: "cold",
		projectId: "project-1",
		priority: "p1",
		dueDate: null,
		completedAt: null,
		orderNum: 0,
		createdAt: new Date(),
		updatedAt: new Date(),
		comments: [],
	},
	{
		id: "task-2",
		title: "Test Task without Project",
		description: undefined,
		status: "cold",
		projectId: null,
		priority: "p2",
		dueDate: null,
		completedAt: null,
		orderNum: 0,
		createdAt: new Date(),
		updatedAt: new Date(),
		comments: [],
	},
];

const defaultProps = {
	tasks: mockTasks,
	projects: mockProjects,
	onEdit: vi.fn(),
	onTaskUpdated: vi.fn(),
};

describe("BacklogTable", () => {
	describe("Rendering", () => {
		it("renders table with task titles", () => {
			render(<BacklogTable {...defaultProps} />);

			expect(screen.getByText("Test Task with Project")).toBeInTheDocument();
			expect(screen.getByText("Test Task without Project")).toBeInTheDocument();
		});

		it("renders project column with project name", () => {
			render(<BacklogTable {...defaultProps} />);

			expect(screen.getByText("Test Project")).toBeInTheDocument();
		});

		it("renders dash for tasks without project", () => {
			render(<BacklogTable {...defaultProps} />);

			const dashes = screen.getAllByText("—");
			expect(dashes.length).toBeGreaterThan(0);
		});

		it("renders priority badges", () => {
			render(<BacklogTable {...defaultProps} />);

			expect(screen.getByText("P1")).toBeInTheDocument();
			expect(screen.getByText("P2")).toBeInTheDocument();
		});

		it("renders created dates", () => {
			render(<BacklogTable {...defaultProps} />);

			const dateRegex = /[A-Z][a-z]{2} \d{1,2}, \d{4}/;
			const dates = screen.getAllByText(dateRegex);
			expect(dates.length).toBeGreaterThan(0);
		});

		it("renders actions column", () => {
			render(<BacklogTable {...defaultProps} />);

			expect(screen.getByText("Actions")).toBeInTheDocument();
		});
	});

	describe("Actions dropdown", () => {
		it("opens actions menu when clicking the actions button", async () => {
			const user = userEvent.setup();
			render(<BacklogTable {...defaultProps} />);

			const actionButtons = screen
				.getAllByRole("button")
				.filter((btn) => btn.className.includes("h-8 w-8 p-0"));
			await user.click(actionButtons[0]);

			expect(screen.getByText("Edit")).toBeInTheDocument();
			expect(screen.getByText("To work")).toBeInTheDocument();
			expect(screen.getByText("For Today")).toBeInTheDocument();
			expect(screen.getByText("Delete")).toBeInTheDocument();
		});

		it("calls onEdit when clicking Edit", async () => {
			const user = userEvent.setup();
			const onEdit = vi.fn();
			render(<BacklogTable {...defaultProps} onEdit={onEdit} />);

			const actionButtons = screen
				.getAllByRole("button")
				.filter((btn) => btn.className.includes("h-8 w-8 p-0"));
			await user.click(actionButtons[0]);

			await user.click(screen.getByText("Edit"));

			expect(onEdit).toHaveBeenCalled();
		});

		it("shows delete confirmation dialog when clicking Delete", async () => {
			const user = userEvent.setup();
			render(<BacklogTable {...defaultProps} />);

			const actionButtons = screen
				.getAllByRole("button")
				.filter((btn) => btn.className.includes("h-8 w-8 p-0"));
			await user.click(actionButtons[0]);

			await user.click(screen.getByText("Delete"));

			expect(screen.getByText("Delete Task")).toBeInTheDocument();
		});
	});

	describe("Empty state", () => {
		it("renders without crashing when no tasks", () => {
			const { container } = render(
				<BacklogTable {...defaultProps} tasks={[]} />,
			);

			expect(container.querySelector("table")).toBeInTheDocument();
		});
	});
});

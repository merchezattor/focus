import type React from "react";

vi.mock("next-themes", () => ({
	ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
	useTheme: () => ({ setTheme: vi.fn(), theme: "light" }),
}));

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { createProject, createTask } from "@/test/fixtures";
import { render } from "@/test/test-utils";
import { EditTaskDialog } from "../EditTaskDialog";

describe("EditTaskDialog", () => {
	const mockProjects = [
		createProject({
			id: "proj-1",
			name: "Work",
			color: "#ef4444",
			isFavorite: true,
		}),
		createProject({ id: "proj-2", name: "Personal", color: "#3b82f6" }),
	];

	const mockTask = createTask({
		id: "task-123",
		title: "Test Task Title",
		description: "Test description",
		priority: "p2",
		projectId: "proj-1",
		dueDate: new Date("2025-12-31"),
		planDate: new Date("2025-12-25"),
		comments: [
			{
				id: "comment-1",
				content: "Test comment",
				postedAt: new Date("2025-01-15"),
			},
		],
	});

	const defaultProps = {
		task: mockTask,
		projects: mockProjects,
		onTaskUpdated: vi.fn(),
	};

	describe("Dialog open/close", () => {
		it("renders with trigger button when provided", () => {
			const trigger = <button type="button">Edit Task</button>;
			render(<EditTaskDialog {...defaultProps} trigger={trigger} />);

			expect(
				screen.getByRole("button", { name: /edit task/i }),
			).toBeInTheDocument();
		});

		it("opens dialog when trigger is clicked", async () => {
			const user = userEvent.setup();
			render(
				<EditTaskDialog
					{...defaultProps}
					trigger={<button type="button">Edit Task</button>}
				/>,
			);

			await user.click(screen.getByRole("button", { name: /edit task/i }));

			await waitFor(() => {
				expect(screen.getByDisplayValue("Test Task Title")).toBeInTheDocument();
			});
		});

		it("opens dialog when open prop is true", () => {
			render(<EditTaskDialog {...defaultProps} open={true} />);

			expect(screen.getByDisplayValue("Test Task Title")).toBeInTheDocument();
		});

		it("closes dialog when open prop is set to false", () => {
			const { rerender } = render(
				<EditTaskDialog {...defaultProps} open={true} />,
			);

			expect(screen.getByDisplayValue("Test Task Title")).toBeInTheDocument();

			rerender(<EditTaskDialog {...defaultProps} open={false} />);

			expect(
				screen.queryByDisplayValue("Test Task Title"),
			).not.toBeInTheDocument();
		});
	});

	describe("Pre-filled values", () => {
		it("pre-fills title from task prop", () => {
			render(<EditTaskDialog {...defaultProps} open={true} />);

			expect(screen.getByDisplayValue("Test Task Title")).toBeInTheDocument();
		});

		it("pre-fills description from task prop", () => {
			render(<EditTaskDialog {...defaultProps} open={true} />);

			expect(screen.getByDisplayValue("Test description")).toBeInTheDocument();
		});

		it("pre-fills priority from task prop", () => {
			render(<EditTaskDialog {...defaultProps} open={true} />);

			expect(screen.getByText("Priority 2")).toBeInTheDocument();
		});

		it("pre-fills project from task prop", () => {
			render(<EditTaskDialog {...defaultProps} open={true} />);

			expect(screen.getByText("Work")).toBeInTheDocument();
		});

		it("pre-fills due date from task prop", () => {
			render(<EditTaskDialog {...defaultProps} open={true} />);

			expect(screen.getByText(/december 31/i)).toBeInTheDocument();
		});

		it("pre-fills plan date from task prop", () => {
			render(<EditTaskDialog {...defaultProps} open={true} />);

			expect(screen.getByText(/december 25/i)).toBeInTheDocument();
		});

		it("displays comments from task prop", () => {
			render(<EditTaskDialog {...defaultProps} open={true} />);

			expect(screen.getByText("Test comment")).toBeInTheDocument();
		});

		it("displays comment count", () => {
			render(<EditTaskDialog {...defaultProps} open={true} />);

			expect(screen.getByText(/\(1\)/)).toBeInTheDocument();
		});
	});

	describe("Form fields render", () => {
		it("renders title input field", () => {
			render(<EditTaskDialog {...defaultProps} open={true} />);

			expect(screen.getByDisplayValue("Test Task Title")).toBeInTheDocument();
		});

		it("renders description textarea field", () => {
			render(<EditTaskDialog {...defaultProps} open={true} />);

			expect(screen.getByDisplayValue("Test description")).toBeInTheDocument();
		});

		it("renders project selector", () => {
			render(<EditTaskDialog {...defaultProps} open={true} />);

			expect(screen.getByText("Project")).toBeInTheDocument();
		});

		it("renders due date section", () => {
			render(<EditTaskDialog {...defaultProps} open={true} />);

			expect(screen.getByText("Due Date")).toBeInTheDocument();
		});

		it("renders plan date section", () => {
			render(<EditTaskDialog {...defaultProps} open={true} />);

			expect(screen.getByText("Plan Date")).toBeInTheDocument();
		});

		it("renders priority section", () => {
			render(<EditTaskDialog {...defaultProps} open={true} />);

			expect(screen.getByText("Priority")).toBeInTheDocument();
		});

		it("renders complete button", () => {
			render(<EditTaskDialog {...defaultProps} open={true} />);

			expect(
				screen.getByRole("button", { name: /complete/i }),
			).toBeInTheDocument();
		});

		it("renders delete button", () => {
			render(<EditTaskDialog {...defaultProps} open={true} />);

			expect(
				screen.getByRole("button", { name: /delete task/i }),
			).toBeInTheDocument();
		});

		it("renders comment input section", () => {
			render(<EditTaskDialog {...defaultProps} open={true} />);

			expect(screen.getByPlaceholderText("Comment")).toBeInTheDocument();
		});

		it("renders add comment button", () => {
			render(<EditTaskDialog {...defaultProps} open={true} />);

			expect(
				screen.getByRole("button", { name: /comment/i }),
			).toBeInTheDocument();
		});
	});

	describe("Form submission and updates", () => {
		it("allows title to be changed", async () => {
			const user = userEvent.setup();
			render(<EditTaskDialog {...defaultProps} open={true} />);

			const titleInput = screen.getByDisplayValue("Test Task Title");
			await user.clear(titleInput);
			await user.type(titleInput, "Updated Title");

			expect(screen.getByDisplayValue("Updated Title")).toBeInTheDocument();
		});

		it("allows description to be changed", async () => {
			const user = userEvent.setup();
			render(<EditTaskDialog {...defaultProps} open={true} />);

			const descInput = screen.getByDisplayValue("Test description");
			await user.clear(descInput);
			await user.type(descInput, "Updated description");

			expect(
				screen.getByDisplayValue("Updated description"),
			).toBeInTheDocument();
		});
	});

	describe("Cancel action", () => {
		it("can be closed by setting open to false", () => {
			const { rerender } = render(
				<EditTaskDialog {...defaultProps} open={true} />,
			);

			expect(screen.getByDisplayValue("Test Task Title")).toBeInTheDocument();

			rerender(<EditTaskDialog {...defaultProps} open={false} />);

			expect(
				screen.queryByDisplayValue("Test Task Title"),
			).not.toBeInTheDocument();
		});
	});

	describe("Validation errors", () => {
		it("allows empty title in the input field", async () => {
			const user = userEvent.setup();
			render(<EditTaskDialog {...defaultProps} open={true} />);

			const titleInput = screen.getByDisplayValue("Test Task Title");
			await user.clear(titleInput);

			expect(titleInput).toHaveValue("");
		});
	});

	describe("Comments functionality", () => {
		it("can type in comment input", async () => {
			const user = userEvent.setup();
			render(<EditTaskDialog {...defaultProps} open={true} />);

			const commentInput = screen.getByPlaceholderText("Comment");
			await user.type(commentInput, "New test comment");

			expect(screen.getByDisplayValue("New test comment")).toBeInTheDocument();
		});

		it("displays existing comments", () => {
			render(<EditTaskDialog {...defaultProps} open={true} />);

			expect(screen.getByText("Test comment")).toBeInTheDocument();
		});

		it("disables comment button when comment input is empty", () => {
			render(<EditTaskDialog {...defaultProps} open={true} />);

			const addButton = screen.getByRole("button", { name: /comment/i });
			expect(addButton).toBeDisabled();
		});

		it("enables comment button when comment input has content", async () => {
			const user = userEvent.setup();
			render(<EditTaskDialog {...defaultProps} open={true} />);

			const commentInput = screen.getByPlaceholderText("Comment");
			await user.type(commentInput, "New comment");

			const addButton = screen.getByRole("button", { name: /comment/i });
			expect(addButton).not.toBeDisabled();
		});
	});

	describe("Task deletion", () => {
		it("shows delete confirmation dialog", async () => {
			const user = userEvent.setup();
			render(<EditTaskDialog {...defaultProps} open={true} />);

			const deleteButton = screen.getByRole("button", { name: /delete task/i });
			await user.click(deleteButton);

			expect(screen.getByText("Delete Task")).toBeInTheDocument();
			expect(
				screen.getByText(/are you sure you want to delete this task/i),
			).toBeInTheDocument();
		});

		it("shows delete confirmation when delete button is clicked", async () => {
			const user = userEvent.setup();
			render(<EditTaskDialog {...defaultProps} open={true} />);

			const deleteButton = screen.getByRole("button", { name: /delete task/i });
			await user.click(deleteButton);

			expect(screen.getByText("Delete Task")).toBeInTheDocument();
		});
	});

	describe("Task completion", () => {
		it("renders complete button", () => {
			render(<EditTaskDialog {...defaultProps} open={true} />);

			expect(
				screen.getByRole("button", { name: /complete/i }),
			).toBeInTheDocument();
		});
	});

	describe("Resets on dialog open", () => {
		it("resets form when opening a different task", async () => {
			const task1 = createTask({
				id: "task-1",
				title: "First Task",
				description: "First description",
			});
			const task2 = createTask({
				id: "task-2",
				title: "Second Task",
				description: "Second description",
			});

			const { rerender } = render(
				<EditTaskDialog
					task={task1}
					projects={mockProjects}
					onTaskUpdated={vi.fn()}
					open={true}
				/>,
			);

			expect(screen.getByDisplayValue("First Task")).toBeInTheDocument();

			rerender(
				<EditTaskDialog
					task={task2}
					projects={mockProjects}
					onTaskUpdated={vi.fn()}
					open={true}
				/>,
			);

			await waitFor(() => {
				expect(screen.getByDisplayValue("Second Task")).toBeInTheDocument();
			});
		});
	});
});

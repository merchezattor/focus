import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { format } from "date-fns";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTask } from "@/test/fixtures";
import { render } from "@/test/test-utils";
import { TaskItem } from "../TaskItem";

describe("TaskItem", () => {
	const defaultProps = {
		task: createTask({
			id: "test-task-id",
			title: "Test Task Title",
			completed: false,
			priority: "p2",
			dueDate: null,
			comments: [],
		}),
		onToggle: vi.fn(),
		onEdit: vi.fn(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("rendering", () => {
		it("renders with task data", () => {
			render(<TaskItem {...defaultProps} />);

			expect(screen.getByText("Test Task Title")).toBeInTheDocument();
		});

		it("displays task title", () => {
			const task = createTask({ title: "My Custom Task Title" });
			render(<TaskItem {...defaultProps} task={task} />);

			expect(screen.getByText("My Custom Task Title")).toBeInTheDocument();
		});
	});

	describe("completed state", () => {
		it("applies strikethrough and opacity when task is completed", () => {
			const completedTask = createTask({
				completed: true,
				title: "Test Task Title",
			});
			render(<TaskItem {...defaultProps} task={completedTask} />);

			const titleElement = screen.getByText("Test Task Title");
			expect(titleElement).toHaveClass("line-through");
			expect(titleElement).toHaveClass("text-muted-foreground");
		});

		it("does not apply strikethrough when task is not completed", () => {
			const incompleteTask = createTask({
				completed: false,
				title: "Test Task Title",
			});
			render(<TaskItem {...defaultProps} task={incompleteTask} />);

			const titleElement = screen.getByText("Test Task Title");
			expect(titleElement).not.toHaveClass("line-through");
		});
	});

	describe("priority colors", () => {
		it("displays red border for p1 priority", () => {
			const p1Task = createTask({ priority: "p1" });
			render(<TaskItem {...defaultProps} task={p1Task} />);

			const checkbox = screen.getByRole("checkbox");
			expect(checkbox).toHaveStyle({ borderColor: "#ef4444" });
		});

		it("displays orange border for p2 priority", () => {
			const p2Task = createTask({ priority: "p2" });
			render(<TaskItem {...defaultProps} task={p2Task} />);

			const checkbox = screen.getByRole("checkbox");
			expect(checkbox).toHaveStyle({ borderColor: "#f97316" });
		});

		it("displays blue border for p3 priority", () => {
			const p3Task = createTask({ priority: "p3" });
			render(<TaskItem {...defaultProps} task={p3Task} />);

			const checkbox = screen.getByRole("checkbox");
			expect(checkbox).toHaveStyle({ borderColor: "#3b82f6" });
		});

		it("displays gray border for p4 priority", () => {
			const p4Task = createTask({ priority: "p4" });
			render(<TaskItem {...defaultProps} task={p4Task} />);

			const checkbox = screen.getByRole("checkbox");
			expect(checkbox).toHaveStyle({ borderColor: "#6b7280" });
		});
	});

	describe("callbacks", () => {
		it("calls onToggle when checkbox is clicked", async () => {
			const user = userEvent.setup();
			render(<TaskItem {...defaultProps} />);

			const checkbox = screen.getByRole("checkbox");
			await user.click(checkbox);

			expect(defaultProps.onToggle).toHaveBeenCalledWith("test-task-id", true);
		});

		it("calls onEdit when row is clicked", async () => {
			const user = userEvent.setup();
			render(<TaskItem {...defaultProps} />);

			const taskRow = screen.getByText("Test Task Title").closest("div");
			await user.click(taskRow!);

			expect(defaultProps.onEdit).toHaveBeenCalledWith(defaultProps.task);
		});

		it("does not call onEdit when checkbox is clicked", async () => {
			const user = userEvent.setup();
			render(<TaskItem {...defaultProps} />);

			const checkbox = screen.getByRole("checkbox");
			await user.click(checkbox);

			expect(defaultProps.onEdit).not.toHaveBeenCalled();
		});
	});

	describe("comments", () => {
		it("displays comment count when task has comments", () => {
			const taskWithComments = createTask({
				title: "Task with comments",
				comments: [
					{
						id: "comment-1",
						content: "Test comment",
						postedAt: new Date(),
					},
					{
						id: "comment-2",
						content: "Another comment",
						postedAt: new Date(),
					},
				],
			});
			render(<TaskItem {...defaultProps} task={taskWithComments} />);

			expect(screen.getByText("2")).toBeInTheDocument();
		});

		it("does not display comment count when task has no comments", () => {
			const taskWithoutComments = createTask({ comments: [] });
			render(<TaskItem {...defaultProps} task={taskWithoutComments} />);

			expect(screen.queryByText("0")).not.toBeInTheDocument();
		});
	});

	describe("due date", () => {
		it("displays formatted due date", () => {
			const dueDate = new Date("2026-03-15");
			const taskWithDueDate = createTask({ dueDate });
			render(<TaskItem {...defaultProps} task={taskWithDueDate} />);

			const expectedDate = format(dueDate, "MMM d");
			expect(screen.getByText(`Due ${expectedDate}`)).toBeInTheDocument();
		});

		it("displays placeholder when no due date", () => {
			const taskWithoutDueDate = createTask({ dueDate: null });
			render(<TaskItem {...defaultProps} task={taskWithoutDueDate} />);

			expect(screen.getByText("No date")).toBeInTheDocument();
		});
	});
});

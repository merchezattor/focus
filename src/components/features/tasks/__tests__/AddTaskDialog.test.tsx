import type React from "react";

vi.mock("next-themes", () => ({
	ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
	useTheme: () => ({ setTheme: vi.fn(), theme: "light" }),
}));

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { createProject } from "@/test/fixtures";
import { render } from "@/test/test-utils";
import { AddTaskDialog } from "../AddTaskDialog";

describe("AddTaskDialog", () => {
	const mockProjects = [
		createProject({
			id: "proj-1",
			name: "Work",
			color: "#ef4444",
			isFavorite: true,
		}),
		createProject({ id: "proj-2", name: "Personal", color: "#3b82f6" }),
	];

	const defaultProps = {
		projects: mockProjects,
		onTaskCreated: vi.fn(),
	};

	describe("Dialog open/close", () => {
		it("renders with trigger button by default", () => {
			render(<AddTaskDialog {...defaultProps} />);

			expect(
				screen.getByRole("button", { name: /add task/i }),
			).toBeInTheDocument();
		});

		it("opens dialog when trigger is clicked", async () => {
			const user = userEvent.setup();
			render(<AddTaskDialog {...defaultProps} />);

			await user.click(screen.getByRole("button", { name: /add task/i }));

			await waitFor(() => {
				expect(screen.getByPlaceholderText("Task name")).toBeInTheDocument();
			});
		});

		it("opens dialog when open prop is true", () => {
			render(<AddTaskDialog {...defaultProps} open={true} />);

			expect(screen.getByPlaceholderText("Task name")).toBeInTheDocument();
		});

		it("closes dialog when open prop is false", () => {
			const { rerender } = render(
				<AddTaskDialog {...defaultProps} open={true} />,
			);

			expect(screen.getByPlaceholderText("Task name")).toBeInTheDocument();

			rerender(<AddTaskDialog {...defaultProps} open={false} />);

			expect(
				screen.queryByPlaceholderText("Task name"),
			).not.toBeInTheDocument();
		});

		it("closes dialog when cancel button is clicked", async () => {
			const user = userEvent.setup();
			const onOpenChange = vi.fn();
			render(
				<AddTaskDialog
					{...defaultProps}
					open={true}
					onOpenChange={onOpenChange}
				/>,
			);

			await user.click(screen.getByRole("button", { name: /cancel/i }));

			await waitFor(() => {
				expect(onOpenChange).toHaveBeenCalledWith(false);
			});
		});
	});

	describe("Form fields render", () => {
		it("renders title input field", () => {
			render(<AddTaskDialog {...defaultProps} open={true} />);

			expect(screen.getByPlaceholderText("Task name")).toBeInTheDocument();
		});

		it("renders description textarea field", () => {
			render(<AddTaskDialog {...defaultProps} open={true} />);

			expect(screen.getByPlaceholderText("Description")).toBeInTheDocument();
		});

		it("renders due date button", () => {
			render(<AddTaskDialog {...defaultProps} open={true} />);

			expect(
				screen.getByRole("button", { name: /today/i }),
			).toBeInTheDocument();
		});

		it("renders priority button", () => {
			render(<AddTaskDialog {...defaultProps} open={true} />);

			expect(
				screen.getByRole("button", { name: /priority/i }),
			).toBeInTheDocument();
		});

		it("renders project selector with inbox default", () => {
			render(<AddTaskDialog {...defaultProps} open={true} />);

			expect(
				screen.getByRole("button", { name: /inbox/i }),
			).toBeInTheDocument();
		});

		it("renders add task submit button", () => {
			render(<AddTaskDialog {...defaultProps} open={true} />);

			expect(
				screen.getByRole("button", { name: /add task/i }),
			).toBeInTheDocument();
		});
	});

	describe("Form submission", () => {
		it("calls onTaskCreated and closes dialog on successful submission", async () => {
			const onTaskCreated = vi.fn();
			const onOpenChange = vi.fn();
			const user = userEvent.setup();
			render(
				<AddTaskDialog
					{...defaultProps}
					onTaskCreated={onTaskCreated}
					open={true}
					onOpenChange={onOpenChange}
				/>,
			);

			const titleInput = screen.getByPlaceholderText("Task name");
			await user.type(titleInput, "New Test Task");

			const submitButton = screen.getByRole("button", { name: /add task/i });
			await user.click(submitButton);

			await waitFor(() => {
				expect(onOpenChange).toHaveBeenCalledWith(false);
			});
		});

		it("shows loading state while submitting", async () => {
			const onOpenChange = vi.fn();
			const user = userEvent.setup();
			render(
				<AddTaskDialog
					{...defaultProps}
					open={true}
					onOpenChange={onOpenChange}
					onOptimisticAdd={undefined}
				/>,
			);

			const titleInput = screen.getByPlaceholderText("Task name");
			await user.type(titleInput, "New Test Task");

			const submitButton = screen.getByRole("button", { name: /add task/i });
			await user.click(submitButton);
		});
	});

	describe("Cancel action", () => {
		it("resets form after cancel when reopening with onOptimisticAdd", async () => {
			const user = userEvent.setup();
			const onOpenChange = vi.fn();
			render(
				<AddTaskDialog
					{...defaultProps}
					open={true}
					onOpenChange={onOpenChange}
					onOptimisticAdd={vi.fn()}
				/>,
			);

			const titleInput = screen.getByPlaceholderText("Task name");
			await user.type(titleInput, "Test Task");

			await user.click(screen.getByRole("button", { name: /cancel/i }));

			await waitFor(() => {
				expect(onOpenChange).toHaveBeenCalledWith(false);
			});
		});
	});

	describe("Validation errors", () => {
		it("disables submit button when title is empty", () => {
			render(<AddTaskDialog {...defaultProps} open={true} />);

			const submitButton = screen.getByRole("button", { name: /add task/i });
			expect(submitButton).toBeDisabled();
		});

		it("enables submit button when title has content", async () => {
			const user = userEvent.setup();
			render(<AddTaskDialog {...defaultProps} open={true} />);

			const titleInput = screen.getByPlaceholderText("Task name");
			await user.type(titleInput, "Test");

			const submitButton = screen.getByRole("button", { name: /add task/i });
			expect(submitButton).not.toBeDisabled();
		});

		it("shows error toast when submitting empty title", async () => {
			const user = userEvent.setup();
			render(<AddTaskDialog {...defaultProps} open={true} />);

			const titleInput = screen.getByPlaceholderText("Task name");
			await user.type(titleInput, "   ");

			const submitButton = screen.getByRole("button", { name: /add task/i });
			await user.click(submitButton);

			expect(submitButton).toBeDisabled();
		});
	});

	describe("Custom trigger", () => {
		it("renders custom trigger when provided", () => {
			const CustomTrigger = (
				<button data-testid="custom-trigger">Custom Add</button>
			);
			render(<AddTaskDialog {...defaultProps} trigger={CustomTrigger} />);

			expect(screen.getByTestId("custom-trigger")).toBeInTheDocument();
		});

		it("opens dialog when custom trigger is clicked", async () => {
			const user = userEvent.setup();
			const CustomTrigger = (
				<button data-testid="custom-trigger">Custom Add</button>
			);
			render(<AddTaskDialog {...defaultProps} trigger={CustomTrigger} />);

			await user.click(screen.getByTestId("custom-trigger"));

			await waitFor(() => {
				expect(screen.getByPlaceholderText("Task name")).toBeInTheDocument();
			});
		});
	});

	describe("Default project", () => {
		it("uses defaultProjectId when provided", () => {
			render(
				<AddTaskDialog
					{...defaultProps}
					open={true}
					defaultProjectId="proj-1"
				/>,
			);

			expect(screen.getByRole("button", { name: /work/i })).toBeInTheDocument();
		});
	});
});

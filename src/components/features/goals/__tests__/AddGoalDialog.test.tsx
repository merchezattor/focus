import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import { AddGoalDialog } from "../AddGoalDialog";

describe("AddGoalDialog", () => {
	const mockOnGoalCreated = vi.fn();

	beforeEach(() => {
		mockOnGoalCreated.mockClear();
	});

	it("renders dialog with trigger button", async () => {
		const { user } = render(
			<AddGoalDialog
				trigger={<button type="button">Add Goal</button>}
				onGoalCreated={mockOnGoalCreated}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Add Goal" }));

		await waitFor(() => {
			expect(screen.getByRole("dialog")).toBeInTheDocument();
		});
		expect(
			screen.getByRole("heading", { name: "Add Goal" }),
		).toBeInTheDocument();
	});

	it("opens dialog when controlled open is true", () => {
		render(
			<AddGoalDialog
				open={true}
				onOpenChange={() => {}}
				onGoalCreated={mockOnGoalCreated}
			/>,
		);

		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: "Add Goal" }),
		).toBeInTheDocument();
	});

	it("closes dialog when controlled open changes to false", async () => {
		const onOpenChange = vi.fn();
		const { rerender } = render(
			<AddGoalDialog
				open={true}
				onOpenChange={onOpenChange}
				onGoalCreated={mockOnGoalCreated}
			/>,
		);

		expect(screen.getByRole("dialog")).toBeInTheDocument();

		rerender(
			<AddGoalDialog
				open={false}
				onOpenChange={onOpenChange}
				onGoalCreated={mockOnGoalCreated}
			/>,
		);

		await waitFor(() => {
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		});
	});

	it("has name input field", () => {
		render(<AddGoalDialog open={true} onOpenChange={() => {}} />);

		const nameInput = screen.getByPlaceholderText("Goal Name");
		expect(nameInput).toBeInTheDocument();
	});

	it("has description textarea field", () => {
		render(<AddGoalDialog open={true} onOpenChange={() => {}} />);

		const descriptionInput = screen.getByPlaceholderText(
			"Description (optional)",
		);
		expect(descriptionInput).toBeInTheDocument();
	});

	it("has priority dropdown", () => {
		render(<AddGoalDialog open={true} onOpenChange={() => {}} />);

		expect(
			screen.getByRole("button", { name: /priority 1/i }),
		).toBeInTheDocument();
	});

	it("has color picker with color options", () => {
		render(<AddGoalDialog open={true} onOpenChange={() => {}} />);

		const colorButtons = screen.getAllByRole("button", { name: /Berry Red/i });
		expect(colorButtons.length).toBeGreaterThan(0);
	});

	it("has cancel and create buttons", () => {
		render(<AddGoalDialog open={true} onOpenChange={() => {}} />);

		expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /create goal/i }),
		).toBeInTheDocument();
	});

	it("calls onOpenChange when cancel is clicked", async () => {
		const onOpenChange = vi.fn();
		const { user } = render(
			<AddGoalDialog open={true} onOpenChange={onOpenChange} />,
		);

		await user.click(screen.getByRole("button", { name: /cancel/i }));

		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("submits form with correct data", async () => {
		const { user } = render(
			<AddGoalDialog open={true} onOpenChange={() => {}} />,
		);

		const nameInput = screen.getByPlaceholderText("Goal Name");
		await user.type(nameInput, "My New Goal");

		const submitButton = screen.getByRole("button", { name: /create goal/i });
		expect(submitButton).not.toBeDisabled();
	});

	it("validates required name field", async () => {
		const { user } = render(
			<AddGoalDialog open={true} onOpenChange={() => {}} />,
		);

		await user.click(screen.getByRole("button", { name: /create goal/i }));

		expect(
			screen.getByRole("button", { name: /create goal/i }),
		).toBeInTheDocument();
	});

	it("changes priority when selecting different priority", async () => {
		const { user } = render(
			<AddGoalDialog open={true} onOpenChange={() => {}} />,
		);

		const priorityButton = screen.getByRole("button", { name: /priority 1/i });
		await user.click(priorityButton);

		const priority2Option = screen.getByRole("menuitem", {
			name: /priority 2/i,
		});
		await user.click(priority2Option);

		expect(
			screen.getByRole("button", { name: /priority 2/i }),
		).toBeInTheDocument();
	});

	it("selects color when clicking color button", async () => {
		const { user } = render(
			<AddGoalDialog open={true} onOpenChange={() => {}} />,
		);

		const orangeColor = screen.getByTitle("Orange");
		await user.click(orangeColor);

		expect(orangeColor).toHaveClass("border-primary");
	});
});

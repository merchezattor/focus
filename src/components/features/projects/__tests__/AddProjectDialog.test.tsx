import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGoal, createProject } from "@/test/fixtures";
import { render } from "@/test/test-utils";
import { AddProjectDialog } from "../AddProjectDialog";

const mockGoals = [
	createGoal({
		id: "goal-1",
		name: "Test Goal",
		color: "#ef4444",
	}),
];

const mockProjects = [
	createProject({
		id: "project-1",
		name: "Test Project",
		color: "#3b82f6",
	}),
];

describe("AddProjectDialog", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Add Mode", () => {
		it("renders dialog title when open is true", () => {
			render(<AddProjectDialog open={true} onOpenChange={vi.fn()} />);

			expect(
				screen.getByRole("heading", { name: "Add Project" }),
			).toBeInTheDocument();
			expect(screen.getByPlaceholderText("Project name")).toBeInTheDocument();
		});

		it("does not render dialog when open is false", () => {
			render(<AddProjectDialog open={false} onOpenChange={vi.fn()} />);

			expect(
				screen.queryByRole("heading", { name: "Add Project" }),
			).not.toBeInTheDocument();
		});

		it("calls onOpenChange when cancel button is clicked", () => {
			const onOpenChange = vi.fn();
			render(<AddProjectDialog open={true} onOpenChange={onOpenChange} />);

			const cancelButton = screen.getByRole("button", { name: /cancel/i });
			fireEvent.click(cancelButton);

			expect(onOpenChange).toHaveBeenCalledWith(false);
		});
	});

	describe("Form Fields", () => {
		it("renders name input field", () => {
			render(<AddProjectDialog open={true} onOpenChange={vi.fn()} />);

			const nameInput = screen.getByPlaceholderText("Project name");
			expect(nameInput).toBeInTheDocument();
		});

		it("allows typing in name field", async () => {
			const user = userEvent.setup();
			render(<AddProjectDialog open={true} onOpenChange={vi.fn()} />);

			const nameInput = screen.getByPlaceholderText("Project name");
			await user.type(nameInput, "My New Project");

			expect(nameInput).toHaveValue("My New Project");
		});

		it("renders description textarea", () => {
			render(<AddProjectDialog open={true} onOpenChange={vi.fn()} />);

			const descInput = screen.getByPlaceholderText("Description (optional)");
			expect(descInput).toBeInTheDocument();
		});

		it("allows typing in description field", async () => {
			const user = userEvent.setup();
			render(<AddProjectDialog open={true} onOpenChange={vi.fn()} />);

			const descInput = screen.getByPlaceholderText("Description (optional)");
			await user.type(descInput, "Project description");

			expect(descInput).toHaveValue("Project description");
		});

		it("renders view type select", () => {
			render(<AddProjectDialog open={true} onOpenChange={vi.fn()} />);

			expect(screen.getByText("View")).toBeInTheDocument();
		});

		it("renders color picker section", () => {
			render(<AddProjectDialog open={true} onOpenChange={vi.fn()} />);

			expect(screen.getByText("Color")).toBeInTheDocument();
		});
	});

	describe("View Type Selection", () => {
		it("renders view type select field", () => {
			render(<AddProjectDialog open={true} onOpenChange={vi.fn()} />);

			expect(screen.getByText("View")).toBeInTheDocument();
		});
	});

	describe("Parent Goal Selection", () => {
		it("renders parent select field when goals provided", () => {
			render(
				<AddProjectDialog
					open={true}
					onOpenChange={vi.fn()}
					goals={mockGoals}
				/>,
			);

			expect(screen.getByText("Parent")).toBeInTheDocument();
		});

		it("shows goals when dropdown opens", () => {
			render(
				<AddProjectDialog
					open={true}
					onOpenChange={vi.fn()}
					goals={mockGoals}
				/>,
			);

			expect(screen.getByText("Parent")).toBeInTheDocument();
		});

		it("renders parent select when projects provided", () => {
			render(
				<AddProjectDialog
					open={true}
					onOpenChange={vi.fn()}
					projects={mockProjects}
				/>,
			);

			expect(screen.getByText("Parent")).toBeInTheDocument();
		});
	});

	describe("Submit", () => {
		it("submit button is disabled when name is empty", () => {
			render(<AddProjectDialog open={true} onOpenChange={vi.fn()} />);

			const submitButton = screen.getByRole("button", { name: /add project/i });
			expect(submitButton).toBeDisabled();
		});

		it("submit button is enabled when name has value", async () => {
			const user = userEvent.setup();
			render(<AddProjectDialog open={true} onOpenChange={vi.fn()} />);

			const nameInput = screen.getByPlaceholderText("Project name");
			await user.type(nameInput, "Test Project");

			const submitButton = screen.getByRole("button", { name: /add project/i });
			expect(submitButton).not.toBeDisabled();
		});
	});

	describe("Cancel", () => {
		it("cancel button closes the dialog", () => {
			const onOpenChange = vi.fn();
			render(<AddProjectDialog open={true} onOpenChange={onOpenChange} />);

			const cancelButton = screen.getByRole("button", { name: /cancel/i });
			fireEvent.click(cancelButton);

			expect(onOpenChange).toHaveBeenCalledWith(false);
		});
	});
});

describe("AddProjectDialog - Edit Mode", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const projectToEdit = createProject({
		id: "edit-project-1",
		name: "Existing Project",
		color: "#10b981",
		description: "Existing description",
		viewType: "board",
	});

	it("shows Edit Project title when editing", () => {
		render(
			<AddProjectDialog
				open={true}
				onOpenChange={vi.fn()}
				projectToEdit={projectToEdit}
			/>,
		);

		expect(
			screen.getByRole("heading", { name: "Edit Project" }),
		).toBeInTheDocument();
	});

	it("pre-fills form with project data", () => {
		render(
			<AddProjectDialog
				open={true}
				onOpenChange={vi.fn()}
				projectToEdit={projectToEdit}
			/>,
		);

		const nameInput = screen.getByPlaceholderText(
			"Project name",
		) as HTMLInputElement;
		expect(nameInput.value).toBe("Existing Project");

		const descInput = screen.getByPlaceholderText(
			"Description (optional)",
		) as HTMLTextAreaElement;
		expect(descInput.value).toBe("Existing description");
	});

	it("shows Save button instead of Add Project", () => {
		render(
			<AddProjectDialog
				open={true}
				onOpenChange={vi.fn()}
				projectToEdit={projectToEdit}
			/>,
		);

		expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
	});

	it("shows Delete button in edit mode", () => {
		render(
			<AddProjectDialog
				open={true}
				onOpenChange={vi.fn()}
				projectToEdit={projectToEdit}
			/>,
		);

		expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
	});

	it("does not show Delete button in add mode", () => {
		render(<AddProjectDialog open={true} onOpenChange={vi.fn()} />);

		expect(
			screen.queryByRole("button", { name: /delete/i }),
		).not.toBeInTheDocument();
	});

	it("can render with projects for parent selection", () => {
		const projectsWithSelf = [
			projectToEdit,
			createProject({
				id: "other-project",
				name: "Other Project",
				color: "#f97316",
			}),
		];

		render(
			<AddProjectDialog
				open={true}
				onOpenChange={vi.fn()}
				projectToEdit={projectToEdit}
				projects={projectsWithSelf}
			/>,
		);

		expect(screen.getByText("Parent")).toBeInTheDocument();
	});
});

describe("AddProjectDialog - Controlled vs Uncontrolled", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("works as controlled component when open is true", () => {
		render(<AddProjectDialog open={true} onOpenChange={vi.fn()} />);

		expect(
			screen.getByRole("heading", { name: "Add Project" }),
		).toBeInTheDocument();
	});

	it("works as controlled component when open is false", () => {
		render(<AddProjectDialog open={false} onOpenChange={vi.fn()} />);

		expect(
			screen.queryByRole("heading", { name: "Add Project" }),
		).not.toBeInTheDocument();
	});

	it("respects open prop changes", () => {
		const { rerender } = render(
			<AddProjectDialog open={false} onOpenChange={vi.fn()} />,
		);

		expect(
			screen.queryByRole("heading", { name: "Add Project" }),
		).not.toBeInTheDocument();

		rerender(<AddProjectDialog open={true} onOpenChange={vi.fn()} />);

		expect(
			screen.getByRole("heading", { name: "Add Project" }),
		).toBeInTheDocument();
	});
});

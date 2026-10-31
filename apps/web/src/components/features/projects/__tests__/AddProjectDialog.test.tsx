import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

afterEach(() => {
	vi.unstubAllGlobals();
});

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

		it("renders kind select", () => {
			render(<AddProjectDialog open={true} onOpenChange={vi.fn()} />);

			expect(screen.getByText("Kind")).toBeInTheDocument();
			const comboboxes = screen.getAllByRole("combobox");
			expect(comboboxes[1]).toHaveTextContent("Project");
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

	describe("Parent picker", () => {
		const pickerProjects = [
			createProject({ id: "w1", name: "Website", status: "working" }),
			createProject({ id: "f1", name: "Frozen plan", status: "frozen" }),
			createProject({ id: "g1", name: "Platform group", kind: "group" }),
		];

		it("filters options as the user types in the search box", async () => {
			const user = userEvent.setup();
			render(
				<AddProjectDialog
					open={true}
					onOpenChange={vi.fn()}
					goals={mockGoals}
					projects={pickerProjects}
				/>,
			);

			await user.click(screen.getByRole("combobox", { name: /parent/i }));
			expect(
				screen.getByRole("option", { name: /frozen plan/i }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("option", { name: /platform group/i }),
			).toBeInTheDocument();

			await user.type(screen.getByPlaceholderText(/search parent/i), "froz");

			expect(
				screen.getByRole("option", { name: /frozen plan/i }),
			).toBeInTheDocument();
			expect(
				screen.queryByRole("option", { name: /website/i }),
			).not.toBeInTheDocument();
			expect(
				screen.queryByRole("option", { name: /platform group/i }),
			).not.toBeInTheDocument();
		});

		async function pickAndSubmit(optionName: RegExp) {
			const user = userEvent.setup();
			const fetchMock = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ project: { id: "created-1" } }),
			});
			vi.stubGlobal("fetch", fetchMock);

			render(
				<AddProjectDialog
					open={true}
					onOpenChange={vi.fn()}
					goals={mockGoals}
					projects={pickerProjects}
				/>,
			);

			await user.type(screen.getByPlaceholderText("Project name"), "Child");
			await user.click(screen.getByRole("combobox", { name: /parent/i }));
			await user.click(screen.getByRole("option", { name: optionName }));
			await user.click(screen.getByRole("button", { name: /add project/i }));

			await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
			return JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
		}

		it("submits a frozen project as the parent project, with no goal", async () => {
			expect(await pickAndSubmit(/frozen plan/i)).toMatchObject({
				parentProjectId: "f1",
				goalId: null,
			});
		});

		it("submits a group as the parent project, with no goal", async () => {
			expect(await pickAndSubmit(/platform group/i)).toMatchObject({
				parentProjectId: "g1",
				goalId: null,
			});
		});

		it("shows the current parent on open, even when it is a frozen project", () => {
			const edited = createProject({
				id: "edited",
				name: "Edited",
				parentProjectId: "f1",
			});
			render(
				<AddProjectDialog
					open={true}
					onOpenChange={vi.fn()}
					projectToEdit={edited}
					goals={mockGoals}
					projects={[...pickerProjects, edited]}
				/>,
			);

			expect(
				screen.getByRole("combobox", { name: /parent/i }),
			).toHaveTextContent("Frozen plan");
		});

		it("does not offer the edited project or its descendants as a parent", async () => {
			const user = userEvent.setup();
			const edited = createProject({ id: "edited", name: "Edited" });
			const child = createProject({
				id: "child",
				name: "Edited child",
				status: "archived",
				parentProjectId: "edited",
			});
			const grandchildGroup = createProject({
				id: "grandchild",
				name: "Edited grandchild",
				kind: "group",
				parentProjectId: "child",
			});
			render(
				<AddProjectDialog
					open={true}
					onOpenChange={vi.fn()}
					projectToEdit={edited}
					projects={[...pickerProjects, edited, child, grandchildGroup]}
				/>,
			);

			await user.click(screen.getByRole("combobox", { name: /parent/i }));

			expect(
				screen.getByRole("option", { name: /website/i }),
			).toBeInTheDocument();
			expect(
				screen.queryByRole("option", { name: /edited/i }),
			).not.toBeInTheDocument();
		});

		it("submits a goal as the parent, with no parent project", async () => {
			expect(await pickAndSubmit(/test goal/i)).toMatchObject({
				goalId: "goal-1",
				parentProjectId: null,
			});
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

		it("submits default project kind in create mode", async () => {
			const user = userEvent.setup();
			const fetchMock = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					project: { id: "created-project-1" },
				}),
			});
			vi.stubGlobal("fetch", fetchMock);

			render(<AddProjectDialog open={true} onOpenChange={vi.fn()} />);

			await user.type(
				screen.getByPlaceholderText("Project name"),
				"New Project",
			);
			await user.click(screen.getByRole("button", { name: /add project/i }));

			await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
			expect(fetchMock).toHaveBeenCalledWith(
				"/api/projects",
				expect.objectContaining({
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: expect.any(String),
				}),
			);

			const request = fetchMock.mock.calls[0]?.[1];
			expect(request).toBeDefined();
			expect(JSON.parse(String(request?.body))).toMatchObject({
				name: "New Project",
				kind: "project",
			});
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

		const comboboxes = screen.getAllByRole("combobox");
		expect(comboboxes[1]).toHaveTextContent("Project");
	});

	it("shows group kind when editing a group project", () => {
		const groupProject = createProject({
			id: "group-project-1",
			kind: "group",
		});

		render(
			<AddProjectDialog
				open={true}
				onOpenChange={vi.fn()}
				projectToEdit={groupProject}
			/>,
		);

		const comboboxes = screen.getAllByRole("combobox");
		expect(comboboxes[1]).toHaveTextContent("Group");
	});

	it("submits group kind in edit mode", async () => {
		const user = userEvent.setup();
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ success: true }),
		});
		vi.stubGlobal("fetch", fetchMock);
		const projectToEdit = createProject({
			id: "group-project-2",
			kind: "group",
		});

		render(
			<AddProjectDialog
				open={true}
				onOpenChange={vi.fn()}
				projectToEdit={projectToEdit}
			/>,
		);

		await user.click(screen.getByRole("button", { name: /save/i }));

		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
		expect(fetchMock).toHaveBeenCalledWith(
			"/api/projects",
			expect.objectContaining({
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: expect.any(String),
			}),
		);

		const request = fetchMock.mock.calls[0]?.[1];
		expect(request).toBeDefined();
		expect(JSON.parse(String(request?.body))).toMatchObject({
			id: "group-project-2",
			kind: "group",
		});
	});

	it("shows Save button instead of Add Project", () => {
		const projectToEdit = createProject({
			id: "project-edit-1",
		});
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
		const projectToEdit = createProject({
			id: "project-edit-2",
		});
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
		const projectToEdit = createProject({
			id: "project-edit-3",
		});
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

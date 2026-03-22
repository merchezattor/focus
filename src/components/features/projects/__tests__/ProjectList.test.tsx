import { render, screen } from "@testing-library/react";
import { Provider } from "jotai";
import { describe, expect, it } from "vitest";
import { ProjectList } from "@/components/features/projects/ProjectList";
import type { Project } from "@/types";

function createProject(overrides: Partial<Project> = {}): Project {
	return {
		id: "test-project-1",
		name: "Test Project",
		color: "#ef4444",
		kind: "project",
		priority: "p4",
		status: "working",
		isFavorite: false,
		...overrides,
	};
}

function renderWithProviders(ui: React.ReactElement) {
	return render(<Provider>{ui}</Provider>);
}

describe("ProjectList", () => {
	it("renders empty state when no projects", () => {
		renderWithProviders(<ProjectList projects={[]} />);
		expect(screen.getByText("No projects yet")).toBeInTheDocument();
	});

	it("excludes group projects from Working section", () => {
		const groupProject = createProject({
			id: "group-1",
			kind: "group",
			name: "Group 1",
		});
		const regularProject = createProject({
			id: "proj-1",
			kind: "project",
			name: "Regular Project",
			status: "working",
		});

		renderWithProviders(
			<ProjectList projects={[groupProject, regularProject]} />,
		);

		expect(screen.getByText("Working")).toBeInTheDocument();
		const workingSection = screen.getByText("Working").closest("section");
		expect(workingSection).toHaveTextContent("Regular Project");
		expect(workingSection).not.toHaveTextContent("Group 1");
	});

	it("shows group projects in separate Groups section", () => {
		const groupProject = createProject({
			id: "group-1",
			kind: "group",
			name: "My Group",
		});

		renderWithProviders(<ProjectList projects={[groupProject]} />);

		expect(screen.getByText("Groups")).toBeInTheDocument();
		expect(screen.getByText("My Group")).toBeInTheDocument();
	});

	it("renders Groups section at the end of the list", () => {
		const groupProject = createProject({
			id: "group-1",
			kind: "group",
			name: "Group 1",
		});
		const workingProject = createProject({
			id: "proj-1",
			kind: "project",
			name: "Working Project",
			status: "working",
		});

		renderWithProviders(
			<ProjectList projects={[groupProject, workingProject]} />,
		);

		const sections = screen.getAllByRole("heading", { level: 2 });
		const lastSectionTitle = sections[sections.length - 1].textContent;
		expect(lastSectionTitle).toContain("Groups");
	});

	it("excludes group projects from all status sections", () => {
		const groupProject = createProject({
			id: "group-1",
			kind: "group",
			name: "Group 1",
			status: "working",
		});
		const workingProject = createProject({
			id: "proj-1",
			kind: "project",
			name: "Working Project",
			status: "working",
		});
		const archivedProject = createProject({
			id: "proj-2",
			kind: "project",
			name: "Archived Project",
			status: "archived",
		});

		renderWithProviders(
			<ProjectList
				projects={[groupProject, workingProject, archivedProject]}
			/>,
		);

		expect(screen.getByText("Working")).toBeInTheDocument();
		const workingSection = screen.getByText("Working").closest("section");
		expect(workingSection).toHaveTextContent("Working Project");
		expect(workingSection).not.toHaveTextContent("Group 1");

		expect(screen.getByText("Archived")).toBeInTheDocument();
		const archivedSection = screen.getByText("Archived").closest("section");
		expect(archivedSection).toHaveTextContent("Archived Project");
		expect(archivedSection).not.toHaveTextContent("Group 1");
	});
});

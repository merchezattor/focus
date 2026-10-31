import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, Provider } from "jotai";
import { useRouter } from "next/navigation";
import { describe, expect, it, vi } from "vitest";
import { ProjectsTable } from "@/components/features/projects/ProjectsTable";
import { projectToEditAtom } from "@/lib/atoms";
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
		viewType: "list",
		...overrides,
	};
}

function renderTable(projects: Project[], store = createStore()) {
	return render(
		<Provider store={store}>
			<ProjectsTable projects={projects} />
		</Provider>,
	);
}

describe("ProjectsTable", () => {
	it("renders a Group and an Archived project as rows", () => {
		renderTable([
			createProject({ id: "g", kind: "group", name: "My Group" }),
			createProject({ id: "a", name: "Old One", status: "archived" }),
		]);
		expect(screen.getByText("My Group")).toBeInTheDocument();
		expect(screen.getByText("Old One")).toBeInTheDocument();
	});

	it("navigates to the project when Name is clicked", async () => {
		const push = vi.fn();
		vi.mocked(useRouter).mockReturnValue({ push } as never);
		renderTable([createProject({ id: "p-1", name: "Alpha" })]);
		await userEvent.click(screen.getByRole("button", { name: "Alpha" }));
		expect(push).toHaveBeenCalledWith("/?project=p-1");
	});

	it("sets projectToEditAtom from the Edit action", async () => {
		const store = createStore();
		const project = createProject({ id: "p-1", name: "Alpha" });
		renderTable([project], store);
		await userEvent.click(
			screen.getByRole("button", { name: "Project actions" }),
		);
		await userEvent.click(
			await screen.findByRole("menuitem", { name: "Edit" }),
		);
		expect(store.get(projectToEditAtom)).toEqual(project);
	});

	it("shows the description only after expanding the row", async () => {
		renderTable([createProject({ description: "Secret details" })]);
		expect(screen.queryByText("Secret details")).not.toBeInTheDocument();
		await userEvent.click(
			screen.getByRole("button", { name: "Toggle description" }),
		);
		expect(screen.getByText("Secret details")).toBeInTheDocument();
	});

	it("orders rows by status rank, then name", () => {
		renderTable([
			createProject({ id: "1", name: "A Archived", status: "archived" }),
			createProject({ id: "2", name: "B Complete", status: "complete" }),
			createProject({ id: "3", name: "C Frozen", status: "frozen" }),
			createProject({ id: "4", name: "Z Working", status: "working" }),
			createProject({ id: "5", name: "D Working", status: "working" }),
		]);
		const rows = screen.getAllByRole("row").slice(1);
		const names = rows.map((r) =>
			within(r).getAllByRole("button")[1].textContent?.trim(),
		);
		expect(names).toEqual([
			"D Working",
			"Z Working",
			"C Frozen",
			"B Complete",
			"A Archived",
		]);
	});

	it("shows a P4 badge on p4 rows", () => {
		renderTable([createProject({ priority: "p4" })]);
		expect(screen.getByText("P4")).toBeInTheDocument();
	});
});

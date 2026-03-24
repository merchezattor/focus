import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { createGoal, createProject } from "@/test/fixtures";
import { render } from "@/test/test-utils";

vi.mock("@/components/layout/mode-toggle", () => ({
	ModeToggle: () => <div>Mode Toggle</div>,
}));

vi.mock("@/components/layout/nav-user", () => ({
	NavUser: () => <div>Nav User</div>,
}));

function renderSidebar(ui: React.ReactElement) {
	return render(<SidebarProvider>{ui}</SidebarProvider>);
}

describe("AppSidebar", () => {
	it("links the goals menu item to the dedicated goals page", () => {
		renderSidebar(
			<AppSidebar
				goals={[createGoal({ id: "goal-1" })]}
				projects={[]}
				user={{ name: "Test User", email: "test@example.com" }}
				counts={{ backlogCount: 0, todayCount: 0, eventsCount: 0 }}
			/>,
		);

		expect(screen.getByRole("link", { name: "Goals" })).toHaveAttribute(
			"href",
			"/goals",
		);
		expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute(
			"href",
			"/projects",
		);
		expect(screen.getByRole("link", { name: "Milestones" })).toHaveAttribute(
			"href",
			"/milestones",
		);
	});

	it("keeps the Current Projects section and project links", () => {
		const project = createProject({
			id: "project-1",
			name: "Focus Web",
			status: "working",
			color: "#22c55e",
		});

		renderSidebar(
			<AppSidebar
				projects={[project]}
				user={{ name: "Test User", email: "test@example.com" }}
				counts={{ backlogCount: 2, todayCount: 3, eventsCount: 1 }}
			/>,
		);

		expect(
			screen.getByRole("link", { name: "Current Projects" }),
		).toHaveAttribute("href", "/projects");
		expect(screen.getByRole("link", { name: "Focus Web" })).toHaveAttribute(
			"href",
			"/?project=project-1",
		);
	});
});

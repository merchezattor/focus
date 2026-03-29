import { render as rtlRender, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "jotai";
import { ThemeProvider } from "next-themes";
import { describe, expect, it, vi } from "vitest";
import { createTask } from "@/test/fixtures";
import type { Task } from "@/types";
import { TaskList } from "../TaskList";

function TestWrapper({ children }: { children: React.ReactNode }) {
	return (
		<Provider>
			<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
				{children}
			</ThemeProvider>
		</Provider>
	);
}

function render(ui: React.ReactElement) {
	return rtlRender(ui, { wrapper: TestWrapper });
}

describe("TaskList", () => {
	const defaultProjects = new Map<string, { name: string; color: string }>([
		["project-1", { name: "Work", color: "#ef4444" }],
	]);

	it("renders list of tasks", () => {
		const tasks: Task[] = [
			createTask({
				id: "1",
				title: "Task One",
				planDate: new Date("2026-02-21"),
			}),
			createTask({
				id: "2",
				title: "Task Two",
				planDate: new Date("2026-02-21"),
			}),
		];

		render(
			<TaskList
				tasks={tasks}
				projects={defaultProjects}
				onToggle={vi.fn()}
				onEdit={vi.fn()}
			/>,
		);

		expect(screen.getByText("Task One")).toBeInTheDocument();
		expect(screen.getByText("Task Two")).toBeInTheDocument();
	});

	it("renders empty state when no tasks", () => {
		render(
			<TaskList
				tasks={[]}
				projects={defaultProjects}
				onToggle={vi.fn()}
				onEdit={vi.fn()}
			/>,
		);

		expect(screen.getByText("No tasks yet")).toBeInTheDocument();
		expect(
			screen.getByText(/Add your first task to start organizing/i),
		).toBeInTheDocument();
	});

	it("calls onToggle when checkbox is clicked", async () => {
		const onToggle = vi.fn();
		const tasks: Task[] = [
			createTask({
				id: "1",
				title: "Task One",
				planDate: new Date("2026-02-21"),
			}),
		];

		const user = userEvent.setup();
		render(
			<TaskList
				tasks={tasks}
				projects={defaultProjects}
				onToggle={onToggle}
				onEdit={vi.fn()}
			/>,
		);

		const checkbox = screen.getByRole("checkbox");
		await user.click(checkbox);

		expect(onToggle).toHaveBeenCalledWith("1", true);
	});

	it("calls onEdit when task item is clicked", async () => {
		const onEdit = vi.fn();
		const tasks: Task[] = [
			createTask({
				id: "1",
				title: "Task One",
				planDate: new Date("2026-02-21"),
			}),
		];

		const user = userEvent.setup();
		render(
			<TaskList
				tasks={tasks}
				projects={defaultProjects}
				onToggle={vi.fn()}
				onEdit={onEdit}
			/>,
		);

		await user.click(screen.getByText("Task One"));

		expect(onEdit).toHaveBeenCalledWith(tasks[0]);
	});

	it("filters out completed tasks from display", () => {
		const tasks: Task[] = [
			createTask({ id: "1", title: "Incomplete Task", status: "todo" }),
			createTask({ id: "2", title: "Completed Task", status: "done" }),
		];

		render(
			<TaskList
				tasks={tasks}
				projects={defaultProjects}
				onToggle={vi.fn()}
				onEdit={vi.fn()}
			/>,
		);

		expect(screen.getByText("Incomplete Task")).toBeInTheDocument();
		expect(screen.queryByText("Completed Task")).not.toBeInTheDocument();
	});

	it("groups tasks by date", () => {
		const today = new Date("2026-02-21");
		const tomorrow = new Date("2026-02-22");

		const tasks: Task[] = [
			createTask({ id: "1", title: "Task Today", planDate: today }),
			createTask({ id: "2", title: "Task Tomorrow", planDate: tomorrow }),
		];

		render(
			<TaskList
				tasks={tasks}
				projects={defaultProjects}
				onToggle={vi.fn()}
				onEdit={vi.fn()}
			/>,
		);

		expect(screen.getByText(/21 Feb/)).toBeInTheDocument();
		expect(screen.getByText(/22 Feb/)).toBeInTheDocument();
	});

	it("shows tasks without date in 'No date' section", () => {
		const tasks: Task[] = [
			createTask({ id: "1", title: "Task Without Date", planDate: null }),
		];

		render(
			<TaskList
				tasks={tasks}
				projects={defaultProjects}
				onToggle={vi.fn()}
				onEdit={vi.fn()}
			/>,
		);

		expect(
			screen.getByRole("heading", { name: "No date" }),
		).toBeInTheDocument();
		expect(screen.getByText("Task Without Date")).toBeInTheDocument();
	});

	it("hides project name when hideProjectName is true", () => {
		const tasks: Task[] = [
			createTask({
				id: "1",
				title: "Task With Project",
				planDate: new Date("2026-02-21"),
				projectId: "project-1",
			}),
		];

		const projectsWithNames = new Map<string, { name: string; color: string }>([
			["project-1", { name: "Work", color: "#ef4444" }],
		]);

		render(
			<TaskList
				tasks={tasks}
				projects={projectsWithNames}
				onToggle={vi.fn()}
				onEdit={vi.fn()}
				hideProjectName={true}
			/>,
		);

		expect(screen.getByText("Task With Project")).toBeInTheDocument();
	});

	it("renders additional task groups after the dated tasks", () => {
		const today = new Date("2026-02-21");
		const tasks: Task[] = [
			createTask({ id: "1", title: "Task Today", planDate: today }),
		];
		const additionalGroupTasks: Task[] = [
			createTask({ id: "2", title: "Next roadmap task", planDate: null }),
		];

		render(
			<TaskList
				tasks={tasks}
				projects={defaultProjects}
				onToggle={vi.fn()}
				onEdit={vi.fn()}
				additionalGroups={[
					{
						title: "What's next?",
						tasks: additionalGroupTasks,
					},
				]}
			/>,
		);

		expect(
			screen.getByRole("heading", { name: "What's next?" }),
		).toBeInTheDocument();
		expect(screen.getByText("Next roadmap task")).toBeInTheDocument();
	});

	it("does not show the empty state when additional task groups have tasks", () => {
		render(
			<TaskList
				tasks={[]}
				projects={defaultProjects}
				onToggle={vi.fn()}
				onEdit={vi.fn()}
				additionalGroups={[
					{
						title: "What's next?",
						tasks: [createTask({ id: "2", title: "Roadmap task" })],
					},
				]}
			/>,
		);

		expect(screen.queryByText("No tasks yet")).not.toBeInTheDocument();
		expect(screen.getByText("Roadmap task")).toBeInTheDocument();
	});

	it("renders project and parent milestone context for additional groups", () => {
		render(
			<TaskList
				tasks={[]}
				projects={defaultProjects}
				onToggle={vi.fn()}
				onEdit={vi.fn()}
				additionalGroups={[
					{
						title: "What's next?",
						tasks: [createTask({ id: "2", title: "Roadmap task" })],
						contextByTaskId: {
							"2": {
								projectName: "Work",
								projectColor: "#ef4444",
								parentTitle: "Phase 1",
							},
						},
					},
				]}
			/>,
		);

		expect(screen.getByText("Work")).toBeInTheDocument();
		expect(screen.getByText("Phase 1")).toBeInTheDocument();
	});
});

import { describe, expect, it } from "vitest";
import { createProject, createTask } from "@/test/fixtures";
import { getNextTasksByProjectType } from "../task-groups";

describe("getNextTasksByProjectType", () => {
	it("returns the first unfinished roadmap subtask for roadmap projects", () => {
		const roadmapProject = createProject({
			id: "project-roadmap",
			viewType: "roadmap",
			status: "working",
		});

		const tasks = [
			createTask({
				id: "section-1",
				projectId: roadmapProject.id,
				parentId: null,
				orderNum: 0,
				status: "todo",
			}),
			createTask({
				id: "subtask-done",
				title: "Finished",
				projectId: roadmapProject.id,
				parentId: "section-1",
				orderNum: 1,
				status: "done",
			}),
			createTask({
				id: "subtask-next",
				title: "Next roadmap task",
				projectId: roadmapProject.id,
				parentId: "section-1",
				orderNum: 2,
				status: "todo",
			}),
		];

		const result = getNextTasksByProjectType({
			projects: [roadmapProject],
			tasks,
		});

		expect(result.roadmap.map((entry) => entry.task.id)).toEqual([
			"subtask-next",
		]);
	});

	it("selects the highest-priority TODO task for kanban projects", () => {
		const boardProject = createProject({
			id: "project-board",
			viewType: "board",
			status: "working",
		});

		const tasks = [
			createTask({
				id: "board-in-progress",
				projectId: boardProject.id,
				status: "in_progress",
				priority: "p1",
			}),
			createTask({
				id: "board-p2",
				projectId: boardProject.id,
				status: "todo",
				priority: "p2",
			}),
			createTask({
				id: "board-p1",
				projectId: boardProject.id,
				status: "todo",
				priority: "p1",
			}),
		];

		const result = getNextTasksByProjectType({
			projects: [boardProject],
			tasks,
		});

		expect(result.board.map((entry) => entry.task.id)).toEqual(["board-p1"]);
	});

	it("selects list tasks by earliest plan date and falls back to priority", () => {
		const listProject = createProject({
			id: "project-list",
			viewType: "list",
			status: "working",
		});

		const tasks = [
			createTask({
				id: "planned-later",
				projectId: listProject.id,
				planDate: new Date("2026-04-05T00:00:00.000Z"),
				priority: "p1",
			}),
			createTask({
				id: "planned-sooner",
				projectId: listProject.id,
				planDate: new Date("2026-04-01T00:00:00.000Z"),
				priority: "p4",
			}),
		];

		const withPlannedDates = getNextTasksByProjectType({
			projects: [listProject],
			tasks,
		});

		expect(withPlannedDates.list.map((entry) => entry.task.id)).toEqual([
			"planned-sooner",
		]);

		const withoutPlannedDates = getNextTasksByProjectType({
			projects: [listProject],
			tasks: [
				createTask({
					id: "list-p3",
					projectId: listProject.id,
					priority: "p3",
					status: "todo",
				}),
				createTask({
					id: "list-p1",
					projectId: listProject.id,
					priority: "p1",
					status: "todo",
				}),
			],
		});

		expect(withoutPlannedDates.list.map((entry) => entry.task.id)).toEqual([
			"list-p1",
		]);
	});

	it("ignores projects that are not working or have no matching next task", () => {
		const frozenProject = createProject({
			id: "project-frozen",
			viewType: "board",
			status: "frozen",
		});
		const emptyRoadmapProject = createProject({
			id: "project-roadmap-empty",
			viewType: "roadmap",
			status: "working",
		});

		const tasks = [
			createTask({
				id: "frozen-next",
				projectId: frozenProject.id,
				status: "todo",
			}),
			createTask({
				id: "roadmap-section",
				projectId: emptyRoadmapProject.id,
				parentId: null,
				status: "todo",
			}),
		];

		const result = getNextTasksByProjectType({
			projects: [frozenProject, emptyRoadmapProject],
			tasks,
		});

		expect(result.roadmap).toEqual([]);
		expect(result.board).toEqual([]);
		expect(result.list).toEqual([]);
	});
});

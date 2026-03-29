import type { Project, Task } from "@/types";

export interface NextTaskSelection {
	task: Task;
	projectName: string;
	projectColor: string;
	parentTitle?: string;
}

export type NextTaskGroupKey = "roadmap" | "board" | "list";

export type GroupedNextTasks = Record<NextTaskGroupKey, NextTaskSelection[]>;

const priorityOrder = {
	p1: 0,
	p2: 1,
	p3: 2,
	p4: 3,
} as const;

function sortRoadmapTasks(tasks: Task[]) {
	return [...tasks].sort((a, b) => {
		const orderA = a.orderNum ?? 0;
		const orderB = b.orderNum ?? 0;
		if (orderA !== orderB) {
			return orderA - orderB;
		}

		const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
		const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
		return dateA - dateB;
	});
}

function getNextTaskForRoadmapProject(projectTasks: Task[]) {
	const sortedTasks = sortRoadmapTasks(projectTasks);
	const topLevelTasks = sortedTasks.filter(
		(task) =>
			!task.parentId ||
			!sortedTasks.find((parent) => parent.id === task.parentId),
	);

	for (const section of topLevelTasks) {
		const subtasks = sortedTasks.filter((task) => task.parentId === section.id);
		const nextSubtask = subtasks.find((task) => task.status !== "done");

		if (nextSubtask) {
			return nextSubtask;
		}
	}

	return null;
}

function sortByPriorityAndOrder(tasks: Task[]) {
	return [...tasks].sort((a, b) => {
		const priorityA = priorityOrder[a.priority];
		const priorityB = priorityOrder[b.priority];
		if (priorityA !== priorityB) {
			return priorityA - priorityB;
		}

		const orderA = a.orderNum ?? 0;
		const orderB = b.orderNum ?? 0;
		if (orderA !== orderB) {
			return orderA - orderB;
		}

		const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
		const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
		return dateA - dateB;
	});
}

function getNextTaskForBoardProject(projectTasks: Task[]) {
	const todoTasks = projectTasks.filter((task) => task.status === "todo");
	return sortByPriorityAndOrder(todoTasks)[0] ?? null;
}

function getNextTaskForListProject(projectTasks: Task[]) {
	const tasksWithPlanDate = projectTasks
		.filter((task) => Boolean(task.planDate))
		.sort((a, b) => {
			const planA = new Date(a.planDate!).getTime();
			const planB = new Date(b.planDate!).getTime();
			if (planA !== planB) {
				return planA - planB;
			}

			return priorityOrder[a.priority] - priorityOrder[b.priority];
		});

	if (tasksWithPlanDate.length > 0) {
		return tasksWithPlanDate[0];
	}

	return sortByPriorityAndOrder(projectTasks)[0] ?? null;
}

export function getNextTasksByProjectType({
	projects,
	tasks,
}: {
	projects: Project[];
	tasks: Task[];
}): GroupedNextTasks {
	const groupedTasks: GroupedNextTasks = {
		roadmap: [],
		board: [],
		list: [],
	};

	const activeProjects = projects.filter(
		(project) => project.kind === "project" && project.status === "working",
	);

	for (const project of activeProjects) {
		const projectTasks = tasks.filter(
			(task) =>
				task.projectId === project.id &&
				task.status !== "done" &&
				task.status !== "archived",
		);

		if (projectTasks.length === 0) {
			continue;
		}

		const viewType = project.viewType ?? "list";
		const groupKey: NextTaskGroupKey =
			viewType === "roadmap"
				? "roadmap"
				: viewType === "board"
					? "board"
					: "list";

		const nextTask =
			groupKey === "roadmap"
				? getNextTaskForRoadmapProject(projectTasks)
				: groupKey === "board"
					? getNextTaskForBoardProject(projectTasks)
					: getNextTaskForListProject(projectTasks);

		if (!nextTask) {
			continue;
		}

		const parentTask = nextTask.parentId
			? projectTasks.find((task) => task.id === nextTask.parentId)
			: undefined;

		groupedTasks[groupKey].push({
			task: nextTask,
			projectName: project.name,
			projectColor: project.color,
			parentTitle: parentTask?.title,
		});
	}

	return groupedTasks;
}

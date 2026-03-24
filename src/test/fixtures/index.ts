import type { Goal, Milestone, Project, Task } from "@/types";

let taskIdCounter = 1;
let projectIdCounter = 1;
let goalIdCounter = 1;
let milestoneIdCounter = 1;

export function resetCounters(): void {
	taskIdCounter = 1;
	projectIdCounter = 1;
	goalIdCounter = 1;
	milestoneIdCounter = 1;
}

export function createTask(overrides?: Partial<Task>): Task {
	const now = new Date();
	const id = `test-task-${taskIdCounter++}`;

	const defaults: Task = {
		id,
		title: "Test Task",
		description: undefined,
		projectId: null,
		dueDate: null,
		planDate: null,
		completedAt: null,
		priority: "p2",
		status: "todo",
		comments: [],
		orderNum: 0,
		createdAt: now,
		updatedAt: now,
	};

	return { ...defaults, ...overrides };
}

export function createProject(overrides?: Partial<Project>): Project {
	const now = new Date();
	const id = `test-project-${projectIdCounter++}`;

	const defaults: Project = {
		id,
		name: "Test Project",
		color: "#3b82f6",
		kind: "project",
		priority: "p4",
		description: undefined,
		status: "working",
		goalId: null,
		parentProjectId: null,
		viewType: "list",
		isFavorite: false,
		createdAt: now,
		updatedAt: now,
	};

	return { ...defaults, ...overrides };
}

export function createGoal(overrides?: Partial<Goal>): Goal {
	const now = new Date();
	const id = `test-goal-${goalIdCounter++}`;

	const defaults: Goal = {
		id,
		name: "Test Goal",
		description: undefined,
		priority: "p2",
		dueDate: undefined,
		color: "#10b981",
		createdAt: now,
		updatedAt: now,
	};

	return { ...defaults, ...overrides };
}

export function createMilestone(overrides?: Partial<Milestone>): Milestone {
	const now = new Date();
	const id = `550e8400-e29b-41d4-a716-${String(milestoneIdCounter++).padStart(
		12,
		"0",
	)}`;

	const defaults: Milestone = {
		id,
		title: "Test Milestone",
		description: undefined,
		targetDate: new Date("2026-01-15T00:00:00.000Z"),
		createdAt: now,
		updatedAt: now,
	};

	return { ...defaults, ...overrides };
}

export const mockTasks: Task[] = [
	createTask({
		id: "task-1",
		title: "Complete project proposal",
		priority: "p1",
		status: "todo",
	}),
	createTask({
		id: "task-2",
		title: "Review code changes",
		priority: "p2",
		status: "in_progress",
	}),
	createTask({
		id: "task-3",
		title: "Write documentation",
		priority: "p3",
		status: "todo",
	}),
	createTask({
		id: "task-4",
		title: "Fix login bug",
		priority: "p1",
		status: "review",
	}),
	createTask({
		id: "task-5",
		title: "Update dependencies",
		priority: "p4",
		status: "done",
	}),
];

export const mockProjects: Project[] = [
	createProject({
		id: "project-1",
		name: "Work",
		color: "#ef4444",
		isFavorite: true,
	}),
	createProject({ id: "project-2", name: "Personal", color: "#3b82f6" }),
	createProject({ id: "project-3", name: "Learning", color: "#10b981" }),
];

export const mockGoals: Goal[] = [
	createGoal({
		id: "goal-1",
		name: "Launch MVP",
		priority: "p1",
		color: "#ef4444",
	}),
	createGoal({
		id: "goal-2",
		name: "Grow user base",
		priority: "p2",
		color: "#3b82f6",
	}),
];

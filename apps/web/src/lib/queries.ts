import { queryOptions } from "@tanstack/react-query";
import type { ProjectStat } from "@/lib/storage";
import type { Goal, Milestone, Project, Task } from "@/types";
import { apiGet } from "./api";

export interface TaskCounts {
	backlogCount: number;
	todayCount: number;
	projectCounts: Record<string, number>;
}

export const tasksQuery = (status?: "cold" | "done") =>
	queryOptions({
		queryKey: ["tasks", status ?? "active"],
		queryFn: () =>
			apiGet<{ tasks: Task[] }>(
				`/api/tasks${status ? `?status=${status}` : ""}`,
			).then((d) => d.tasks),
	});

export const projectsQuery = (all = false) =>
	queryOptions({
		queryKey: ["projects", all ? "all" : "actionable"],
		queryFn: () =>
			apiGet<{ projects: Project[] }>(
				`/api/projects${all ? "?all=true" : ""}`,
			).then((d) => d.projects),
	});

export const projectStatsQuery = (
	scope: "actionable" | "working" = "actionable",
) =>
	queryOptions({
		queryKey: ["projectStats", scope],
		queryFn: () =>
			apiGet<{ stats: ProjectStat[] }>(
				`/api/projects/stats?scope=${scope}`,
			).then((d) => d.stats),
	});

export const goalsQuery = () =>
	queryOptions({
		queryKey: ["goals"],
		queryFn: () => apiGet<{ goals: Goal[] }>("/api/goals").then((d) => d.goals),
	});

export const milestonesQuery = () =>
	queryOptions({
		queryKey: ["milestones"],
		queryFn: () =>
			apiGet<{ milestones: Milestone[] }>("/api/milestones").then(
				(d) => d.milestones,
			),
	});

export const taskCountsQuery = () =>
	queryOptions({
		queryKey: ["taskCounts"],
		queryFn: () =>
			apiGet<{ counts: TaskCounts }>("/api/tasks/counts").then((d) => d.counts),
	});

export const unreadCountQuery = () =>
	queryOptions({
		queryKey: ["unreadCount"],
		queryFn: () =>
			apiGet<{ count: number }>("/api/actions/unread-count").then(
				(d) => d.count,
			),
	});

export interface ActivityAction {
	id: string;
	entityId: string;
	entityType: string;
	actorId: string;
	actorType: string;
	actionType: string;
	changes?: unknown;
	metadata?: unknown;
	comment?: string | null;
	isRead: boolean;
	createdAt: string;
	userId: string;
}

export const actionsQuery = (params?: {
	limit?: number;
	entityType?: string;
}) =>
	queryOptions({
		queryKey: ["actions", params ?? {}],
		queryFn: () => {
			const sp = new URLSearchParams({ includeOwn: "true" });
			if (params?.limit) sp.set("limit", String(params.limit));
			if (params?.entityType) sp.set("entityType", params.entityType);
			return apiGet<{ actions: ActivityAction[] }>(
				`/api/actions?${sp.toString()}`,
			).then((d) => d.actions);
		},
	});

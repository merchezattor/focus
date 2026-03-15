"use client";

import { isToday } from "date-fns";
import { useAtom } from "jotai";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { FocusProjectsCard } from "@/components/features/dashboard/FocusProjectsCard";
import { LinkKanban } from "@/components/features/projects/LinkKanban";
import { AddTaskDialog } from "@/components/features/tasks/AddTaskDialog";
import { EditTaskDialog } from "@/components/features/tasks/EditTaskDialog";
import { RoadmapView } from "@/components/features/tasks/RoadmapView";
import { TaskList } from "@/components/features/tasks/TaskList";
import { SiteHeader } from "@/components/layout/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { tasksAtom } from "@/lib/atoms";
import type { ProjectStat } from "@/lib/storage";
import type { Project, Task } from "@/types";

interface DashboardClientProps {
	initialTasks: Task[];
	initialProjects: Project[];
	initialProjectStats: ProjectStat[];
	title?: string;
	filterType?: "all" | "today";
}

export function DashboardClient({
	initialTasks,
	initialProjects,
	initialProjectStats,
	title,
	filterType = "all",
}: DashboardClientProps) {
	const [tasks, setTasks] = useAtom(tasksAtom);
	const [projects, setProjects] = useState<Project[]>(initialProjects);
	const [projectStats, setProjectStats] =
		useState<ProjectStat[]>(initialProjectStats);
	const [error, setError] = useState<string | null>(null);
	const [editingTask, setEditingTask] = useState<Task | null>(null);
	const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
	const searchParams = useSearchParams();
	const selectedProjectId = searchParams.get("project");

	// Sync state with props when router.refresh() updates them
	useEffect(() => {
		setTasks(initialTasks);
	}, [initialTasks, setTasks]);

	useEffect(() => {
		setProjects(initialProjects);
	}, [initialProjects]);

	useEffect(() => {
		setProjectStats(initialProjectStats);
	}, [initialProjectStats]);

	// Handle deep linking to task via ?taskId=...
	useEffect(() => {
		const taskId = searchParams.get("taskId");
		if (taskId) {
			const task = tasks.find((t) => t.id === taskId);
			if (task) {
				setEditingTask(task);
			} else {
				// Task not in current list (maybe in another project or inbox), fetch it
				fetch(`/api/tasks/${taskId}`)
					.then((res) => {
						if (res.ok) return res.json();
						throw new Error("Task not found");
					})
					.then((data) => {
						if (data.task) {
							setEditingTask(data.task);
						}
					})
					.catch((err) => {
						console.error("Failed to load deep-linked task:", err);
						toast.error("Task not found");
					});
			}
		}
	}, [searchParams, tasks]);

	const fetchData = useCallback(async () => {
		try {
			const [tasksRes, projectsRes] = await Promise.all([
				fetch("/api/tasks"),
				fetch("/api/projects"),
			]);

			if (!tasksRes.ok || !projectsRes.ok)
				throw new Error("Failed to fetch data");

			const tasksData = await tasksRes.json();
			const projectsData = await projectsRes.json();

			setTasks(tasksData.tasks);
			setProjects(projectsData.projects);
			setError(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		}
	}, [setTasks]);

	const handleToggle = async (taskId: string, done: boolean) => {
		const newStatus = done ? "done" : "todo";
		try {
			// Optimistic update
			setTasks((prev) =>
				prev.map((t) =>
					t.id === taskId ? { ...t, status: newStatus as Task["status"] } : t,
				),
			);

			const res = await fetch(`/api/tasks/${taskId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: newStatus }),
			});

			if (!res.ok) {
				throw new Error("Failed to update task");
			}
		} catch (err) {
			console.error("Failed to toggle task:", err);
			// Revert optimistic update
			fetchData();
		}
	};

	const handleEdit = (task: Task) => {
		setEditingTask(task);
	};

	// Filter tasks
	let filteredTasks = tasks;
	if (selectedProjectId) {
		filteredTasks = tasks.filter((t) => t.projectId === selectedProjectId);
	} else if (filterType === "today") {
		filteredTasks = tasks.filter((t) => {
			if (!t.planDate) return false;
			const date = new Date(t.planDate);
			return isToday(date);
		});
	} else {
		// Inbox view: Show only tasks NOT assigned to any project
		filteredTasks = tasks.filter((t) => !t.projectId);
	}

	const activeProject = projects.find((p) => p.id === selectedProjectId);
	const isBoardView = activeProject?.viewType === "board";
	const isRoadmapView = activeProject?.viewType === "roadmap";

	const handleBoardTaskUpdate = async (taskId: string, newStatus: string) => {
		// Optimistic update
		setTasks((prev) =>
			prev.map((t) =>
				t.id === taskId ? { ...t, status: newStatus as Task["status"] } : t,
			),
		);

		try {
			const res = await fetch(`/api/tasks`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: taskId, status: newStatus }),
			});
			if (!res.ok) throw new Error("Failed to update task status");
		} catch (e) {
			console.error(e);
			toast.error("Failed to save task status");
			fetchData(); // Revert
		}
	};

	if (error) {
		return (
			<>
				<SiteHeader pageTitle="Error" />
				<div className="flex-1 flex items-center justify-center">
					<div className="text-red-500">Error: {error}</div>
				</div>
			</>
		);
	}

	return (
		<>
			<SiteHeader pageTitle={title || activeProject?.name || "Inbox"} />
			<div className="flex flex-1 flex-col p-4 md:p-6">
				<div className="@container/main flex flex-1 flex-col gap-2 h-full">
					{!selectedProjectId && (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							<FocusProjectsCard projects={projectStats} />
							<Card>
								<CardHeader className="pb-2">
									<CardTitle className="text-sm">Placeholder 1</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
										<p className="text-xs">Future widget here</p>
									</div>
								</CardContent>
							</Card>
							<Card>
								<CardHeader className="pb-2">
									<CardTitle className="text-sm">Placeholder 2</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
										<p className="text-xs">Future widget here</p>
									</div>
								</CardContent>
							</Card>
						</div>
					)}
					{isBoardView && selectedProjectId ? (
						<LinkKanban
							tasks={filteredTasks}
							onTaskUpdate={handleBoardTaskUpdate}
							onTaskClick={handleEdit}
						/>
					) : isRoadmapView && selectedProjectId ? (
						<RoadmapView
							tasks={filteredTasks}
							projects={new Map(projects.map((p) => [p.id, p]))}
							onToggle={handleToggle}
							onEdit={handleEdit}
							hideProjectName={true}
						/>
					) : (
						<TaskList
							tasks={filteredTasks}
							projects={new Map(projects.map((p) => [p.id, p]))}
							onToggle={handleToggle}
							onEdit={handleEdit}
							hideProjectName={!!selectedProjectId}
						/>
					)}
				</div>
			</div>

			<AddTaskDialog
				projects={projects}
				onTaskCreated={fetchData}
				onOptimisticAdd={(task) => setTasks((prev) => [task, ...prev])}
				open={isAddTaskOpen}
				onOpenChange={setIsAddTaskOpen}
				trigger={null}
				defaultProjectId={selectedProjectId || undefined}
			/>

			{editingTask && (
				<EditTaskDialog
					task={editingTask}
					projects={projects}
					onTaskUpdated={fetchData}
					open={true}
					onOpenChange={(open) => !open && setEditingTask(null)}
					trigger={null}
				/>
			)}
		</>
	);
}

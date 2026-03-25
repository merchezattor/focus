"use client";

import { useAtomValue } from "jotai";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BacklogTable } from "@/components/features/tasks/BacklogTable";
import { EditTaskDialog } from "@/components/features/tasks/EditTaskDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { refreshBacklogAtom } from "@/lib/atoms";
import type { Project, Task } from "@/types";

interface BacklogClientProps {
	initialTasks: Task[];
	initialProjects: Project[];
}

export function BacklogClient({
	initialTasks,
	initialProjects,
}: BacklogClientProps) {
	const [hasMounted, setHasMounted] = useState(false);
	const [tasks, setTasks] = useState<Task[]>(initialTasks);
	const [projects, setProjects] = useState<Project[]>(initialProjects);
	const [editingTask, setEditingTask] = useState<Task | null>(null);
	const refreshTrigger = useAtomValue(refreshBacklogAtom);

	useEffect(() => {
		setHasMounted(true);
	}, []);

	const fetchData = useCallback(async () => {
		try {
			const [tasksRes, projectsRes] = await Promise.all([
				fetch("/api/tasks?status=cold"),
				fetch("/api/projects"),
			]);

			if (!tasksRes.ok || !projectsRes.ok)
				throw new Error("Failed to fetch data");

			const tasksData = await tasksRes.json();
			const projectsData = await projectsRes.json();

			setTasks(tasksData.tasks);
			setProjects(projectsData.projects);
		} catch (err) {
			console.error("Failed to refresh backlog data:", err);
		}
	}, []);

	useEffect(() => {
		if (refreshTrigger > 0) {
			fetchData();
		}
	}, [refreshTrigger, fetchData]);

	const handleEdit = (task: Task) => {
		setEditingTask(task);
	};

	const handleTaskUpdated = () => {
		fetchData();
	};

	const projectsMap = useMemo(
		() => new Map(projects.map((p) => [p.id, p])),
		[projects],
	);

	return (
		<div className="@container/main flex flex-1 flex-col gap-4 h-full">
			{hasMounted ? (
				<BacklogTable
					tasks={tasks}
					projects={projectsMap}
					onEdit={handleEdit}
					onTaskUpdated={handleTaskUpdated}
				/>
			) : (
				<div className="rounded-lg border">
					<div className="flex items-center justify-between gap-3 border-b px-4 py-3">
						<div className="flex gap-2">
							<Skeleton className="h-8 w-48" />
							<Skeleton className="h-8 w-24" />
						</div>
						<div className="flex gap-2">
							<Skeleton className="h-8 w-24" />
							<Skeleton className="h-8 w-28" />
						</div>
					</div>
					<div className="space-y-3 p-4">
						{Array.from({ length: 6 }, (_, index) => (
							<div
								key={`backlog-skeleton-${index + 1}`}
								className="grid grid-cols-[2.5fr_1.3fr_0.9fr_1fr_56px] gap-3"
							>
								<Skeleton className="h-10 w-full" />
								<Skeleton className="h-10 w-full" />
								<Skeleton className="h-10 w-full" />
								<Skeleton className="h-10 w-full" />
								<Skeleton className="h-10 w-full" />
							</div>
						))}
					</div>
				</div>
			)}

			{editingTask && (
				<EditTaskDialog
					task={editingTask}
					projects={projects}
					onTaskUpdated={handleTaskUpdated}
					open={true}
					onOpenChange={(open) => !open && setEditingTask(null)}
					trigger={null}
				/>
			)}
		</div>
	);
}

"use client";

import { useAtomValue } from "jotai";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BacklogTable } from "@/components/features/tasks/BacklogTable";
import { EditTaskDialog } from "@/components/features/tasks/EditTaskDialog";
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
	const [tasks, setTasks] = useState<Task[]>(initialTasks);
	const [projects, setProjects] = useState<Project[]>(initialProjects);
	const [editingTask, setEditingTask] = useState<Task | null>(null);
	const refreshTrigger = useAtomValue(refreshBacklogAtom);

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
			<BacklogTable
				tasks={tasks}
				projects={projectsMap}
				onEdit={handleEdit}
				onTaskUpdated={handleTaskUpdated}
			/>

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

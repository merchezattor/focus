"use client";

import { useState } from "react";
import { BacklogTable } from "@/components/features/tasks/BacklogTable";
import { EditTaskDialog } from "@/components/features/tasks/EditTaskDialog";
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

	const fetchData = async () => {
		try {
			const [tasksRes, projectsRes] = await Promise.all([
				fetch("/api/tasks?status=cold"), // We need an API endpoint to fetch cold tasks
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
	};

	const handleEdit = (task: Task) => {
		setEditingTask(task);
	};

	// When a task is marked as something else, we might want to reload or optimistic remove
	const handleTaskUpdated = () => {
		fetchData();
	};

	return (
		<div className="@container/main flex flex-1 flex-col gap-4 h-full">
			<BacklogTable
				tasks={tasks}
				projects={new Map(projects.map((p) => [p.id, p]))}
				onEdit={handleEdit}
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

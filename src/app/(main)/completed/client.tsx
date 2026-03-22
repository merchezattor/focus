"use client";

import { useAtomValue } from "jotai";
import { Archive, Calendar } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { refreshCompletedAtom } from "@/lib/atoms";
import type { Project, Task } from "@/types";

interface CompletedClientProps {
	initialTasks: Task[];
	initialProjects: Project[];
}

export function CompletedClient({
	initialTasks,
	initialProjects,
}: CompletedClientProps) {
	const [tasks, setTasks] = useState<Task[]>(initialTasks);
	const [projects, setProjects] = useState<Project[]>(initialProjects);
	const [unarchivingId, setUnarchivingId] = useState<string | null>(null);
	const refreshTrigger = useAtomValue(refreshCompletedAtom);

	const fetchData = useCallback(async () => {
		try {
			const [tasksRes, projectsRes] = await Promise.all([
				fetch("/api/tasks/search?archived=true"),
				fetch("/api/projects"),
			]);

			if (!tasksRes.ok || !projectsRes.ok)
				throw new Error("Failed to fetch data");

			const tasksData = await tasksRes.json();
			const projectsData = await projectsRes.json();

			setTasks(tasksData.tasks);
			setProjects(projectsData.projects);
		} catch (err) {
			console.error("Failed to refresh completed data:", err);
		}
	}, []);

	useEffect(() => {
		if (refreshTrigger > 0) {
			fetchData();
		}
	}, [refreshTrigger, fetchData]);

	const handleUnarchive = async (taskId: string) => {
		setUnarchivingId(taskId);
		try {
			const response = await fetch("/api/tasks", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					id: taskId,
					archived: false,
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to unarchive task");
			}

			toast.success("Task moved back to active");
			fetchData();
		} catch (err) {
			console.error("Failed to unarchive task:", err);
			toast.error("Failed to unarchive task");
		} finally {
			setUnarchivingId(null);
		}
	};

	const projectsMap = useMemo(
		() => new Map(projects.map((p) => [p.id, p])),
		[projects],
	);

	const formatDate = (date: Date | null | undefined) => {
		if (!date) return "—";
		return new Date(date).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	};

	if (tasks.length === 0) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center gap-4 py-12 text-center">
				<div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
					<Archive className="h-8 w-8 text-muted-foreground" />
				</div>
				<div className="space-y-2">
					<h3 className="text-lg font-semibold">No archived tasks</h3>
					<p className="text-sm text-muted-foreground">
						Completed tasks that you archive will appear here.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="@container/main flex flex-1 flex-col gap-4 h-full">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-[300px]">Task</TableHead>
						<TableHead>Project</TableHead>
						<TableHead>Completed</TableHead>
						<TableHead className="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{tasks.map((task) => {
						const project = task.projectId
							? projectsMap.get(task.projectId)
							: null;
						return (
							<TableRow key={task.id}>
								<TableCell className="font-medium">{task.title}</TableCell>
								<TableCell>
									{project ? (
										<div className="flex items-center gap-2">
											<div
												className="h-2 w-2 rounded-full"
												style={{ backgroundColor: project.color }}
											/>
											{project.name}
										</div>
									) : (
										<span className="text-muted-foreground">Inbox</span>
									)}
								</TableCell>
								<TableCell>
									<div className="flex items-center gap-1 text-muted-foreground">
										<Calendar className="h-3 w-3" />
										{formatDate(task.archivedAt)}
									</div>
								</TableCell>
								<TableCell className="text-right">
									<Button
										variant="outline"
										size="sm"
										onClick={() => handleUnarchive(task.id)}
										disabled={unarchivingId === task.id}
									>
										{unarchivingId === task.id ? (
											"Unarchiving..."
										) : (
											<>
												<Archive className="mr-2 h-4 w-4" />
												Unarchive
											</>
										)}
									</Button>
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
}

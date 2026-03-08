"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";
import { TaskItem } from "./TaskItem";

interface RoadmapViewProps {
	tasks: Task[];
	projects: Map<string, { name: string; color: string }>;
	onToggle: (id: string, done: boolean) => void;
	onEdit: (task: Task) => void;
	hideProjectName?: boolean;
}

export function RoadmapView({
	tasks,
	projects,
	onToggle,
	onEdit,
	hideProjectName,
}: RoadmapViewProps) {
	const sortedTasks = useMemo(() => {
		return [...tasks].sort((a, b) => {
			const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
			const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
			return dateA - dateB;
		});
	}, [tasks]);

	const topLevelTasks = useMemo(() => {
		return sortedTasks.filter(
			(t) => !t.parentId || !tasks.find((p) => p.id === t.parentId),
		);
	}, [sortedTasks, tasks]);

	const getSubtasks = (parentId: string) => {
		return sortedTasks.filter((t) => t.parentId === parentId);
	};

	if (tasks.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-center">
				<div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="32"
						height="32"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="text-muted-foreground"
					>
						<path d="M12 2v20" />
						<path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
					</svg>
				</div>
				<h3 className="text-lg font-medium mb-2">Roadmap is empty</h3>
				<p className="text-muted-foreground max-w-sm">
					Add your first milestone or task to start building your roadmap.
				</p>
			</div>
		);
	}

	return (
		<div className="py-2 px-2 w-full space-y-6">
			{topLevelTasks.map((milestone, mIndex) => {
				const subtasks = getSubtasks(milestone.id);

				return (
					<div key={milestone.id} className="space-y-3">
						{/* Milestone Header */}
						<div className="flex items-center gap-3">
							<div
								className={cn(
									"w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm",
									milestone.status === "done"
										? "bg-primary"
										: "bg-muted-foreground",
								)}
							>
								{mIndex + 1}
							</div>
							<h2 className="text-xl font-semibold tracking-tight">
								<button
									type="button"
									className={cn(
										"text-left cursor-pointer hover:text-primary transition-colors focus-visible:outline-none focus-visible:underline",
										milestone.status === "done" &&
											"line-through text-muted-foreground hover:text-muted-foreground",
									)}
									onClick={() => onEdit(milestone)}
								>
									{milestone.title}
								</button>
							</h2>
						</div>

						{/* Subtasks timeline */}
						{subtasks.length > 0 && (
							<div className="relative border-l border-muted ml-4 pl-8 py-0 space-y-1 mt-2">
								{subtasks.map((task, index) => {
									const isCompleted = task.status === "done";
									const isNext =
										!isCompleted &&
										index === subtasks.findIndex((t) => t.status !== "done");
									const isLast = index === subtasks.length - 1;

									return (
										<div key={task.id} className="relative py-1">
											{/* Node dot */}
											<div
												className={cn(
													"absolute -left-[37px] top-[14px] w-2 h-2 rounded-full border transition-colors duration-300 z-10",
													isCompleted
														? "bg-primary border-primary"
														: isNext
															? "bg-background border-primary ring-2 ring-primary/30 animate-pulse"
															: "bg-background border-muted",
												)}
											/>

											{/* Colored line segment if completed */}
											{isCompleted && !isLast && (
												<div className="absolute -left-[36px] top-[22px] -bottom-[14px] w-[1px] bg-primary z-0" />
											)}

											<div
												className={cn(
													"transition-opacity duration-300",
													!isCompleted && !isNext && "opacity-70",
												)}
											>
												<TaskItem
													task={task}
													onToggle={onToggle}
													onEdit={onEdit}
													compact={true}
													projectColor={
														projects.get(task.projectId || "")?.color
													}
													projectName={
														hideProjectName
															? undefined
															: projects.get(task.projectId || "")?.name
													}
												/>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}

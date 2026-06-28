"use client";

import { format } from "date-fns";
import { useSetAtom } from "jotai";
import { Check, Flag, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { EditTaskDialog } from "@/components/features/tasks/EditTaskDialog";
import {
	CalendarBody,
	CalendarDate,
	CalendarDatePagination,
	CalendarDatePicker,
	CalendarHeader,
	CalendarItem,
	CalendarMonthPicker,
	CalendarProvider,
	CalendarYearPicker,
	type Feature,
} from "@/components/ui/calendar-full";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuRadioGroup,
	ContextMenuRadioItem,
	ContextMenuSeparator,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { milestoneToEditAtom } from "@/lib/atoms";
import { PRIORITY_BG_CLASSES, PRIORITY_COLORS } from "@/lib/priority-colors";
import type { Milestone, Project, Task } from "@/types";

export function UpcomingClient({
	tasks,
	projects,
	milestones,
}: {
	tasks: Task[];
	projects: Project[];
	milestones: Milestone[];
}) {
	const router = useRouter();
	const [editingTask, setEditingTask] = useState<Task | null>(null);
	const setMilestoneToEdit = useSetAtom(milestoneToEditAtom);

	const features: Feature[] = useMemo(() => {
		const taskFeatures = tasks
			.filter((t) => t.status !== "done" && (t.planDate || t.dueDate))
			.map((t) => ({
				id: t.id,
				name: t.title,
				startAt: new Date(t.planDate || t.dueDate!),
				endAt: new Date(t.planDate || t.dueDate!),
				kind: "task" as const,
				description: t.description,
				dateLabel: `${t.planDate ? "Planned" : "Due"} ${format(new Date(t.planDate || t.dueDate!), "PPP")}`,
				metaLabel: `Task ${t.priority.toUpperCase()}`,
				status: {
					id: t.priority,
					name: t.priority,
					color:
						PRIORITY_COLORS[t.priority as keyof typeof PRIORITY_COLORS] ||
						PRIORITY_COLORS.p4,
				},
			}));

		const milestoneFeatures = milestones.map((milestone) => ({
			id: milestone.id,
			name: milestone.title,
			startAt: new Date(milestone.targetDate),
			endAt: new Date(milestone.targetDate),
			kind: "milestone" as const,
			description: milestone.description,
			dateLabel: `Target ${format(new Date(milestone.targetDate), "PPP")}`,
			metaLabel: "Milestone",
			status: {
				id: "milestone",
				name: "milestone",
				color: "#d97706",
			},
		}));

		return [...taskFeatures, ...milestoneFeatures];
	}, [milestones, tasks]);

	const handleTaskClick = (taskId: string) => {
		const task = tasks.find((t) => t.id === taskId);
		if (task) {
			setEditingTask(task);
		}
	};

	const handleMilestoneClick = (milestoneId: string) => {
		const milestone = milestones.find((item) => item.id === milestoneId);
		if (milestone) {
			setMilestoneToEdit(milestone);
		}
	};

	const handleTaskUpdated = () => {
		router.refresh();
	};

	const handleComplete = async (taskId: string) => {
		try {
			await fetch(`/api/tasks/${taskId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: "done" }),
			});
			router.refresh();
		} catch (error) {
			console.error("Failed to complete task:", error);
		}
	};

	const handleSetPriority = async (taskId: string, priority: string) => {
		try {
			await fetch(`/api/tasks/${taskId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ priority }),
			});
			router.refresh();
		} catch (error) {
			console.error("Failed to update priority:", error);
		}
	};

	const handleDelete = async (taskId: string) => {
		if (!confirm("Are you sure you want to delete this task?")) return;
		try {
			await fetch(`/api/tasks/${taskId}`, {
				method: "DELETE",
			});
			router.refresh();
		} catch (error) {
			console.error("Failed to delete task:", error);
		}
	};

	return (
		<div className="h-full w-full flex flex-col">
			<CalendarProvider
				className="flex-1 border rounded-lg overflow-hidden bg-background shadow-sm"
				startDay={1} // 1 = Monday
			>
				<CalendarDate>
					<CalendarDatePicker>
						<CalendarMonthPicker />
						<CalendarYearPicker start={2024} end={2030} />
					</CalendarDatePicker>
					<CalendarDatePagination />
				</CalendarDate>
				<CalendarHeader />
				<CalendarBody features={features}>
					{({ feature }) =>
						feature.kind === "milestone" ? (
							<CalendarItem
								key={feature.id}
								feature={feature}
								onClick={() => handleMilestoneClick(feature.id)}
								className="pl-1"
							/>
						) : (
							<ContextMenu key={feature.id}>
								<ContextMenuTrigger>
									<CalendarItem
										feature={feature}
										onClick={() => handleTaskClick(feature.id)}
									/>
								</ContextMenuTrigger>
								<ContextMenuContent className="w-64">
									<ContextMenuItem
										inset
										onClick={() => handleComplete(feature.id)}
									>
										<Check className="mr-2 h-4 w-4" />
										Complete Task
									</ContextMenuItem>
									<ContextMenuSeparator />
									<ContextMenuSub>
										<ContextMenuSubTrigger inset>
											<Flag className="mr-2 h-4 w-4" />
											Priority
										</ContextMenuSubTrigger>
										<ContextMenuSubContent className="w-48">
											<ContextMenuRadioGroup value={feature.status.name}>
												<ContextMenuRadioItem
													value="p1"
													onClick={() => handleSetPriority(feature.id, "p1")}
												>
													<span
														className={`mr-2 flex h-2 w-2 rounded-full ${PRIORITY_BG_CLASSES.p1}`}
													/>
													Priority 1
												</ContextMenuRadioItem>
												<ContextMenuRadioItem
													value="p2"
													onClick={() => handleSetPriority(feature.id, "p2")}
												>
													<span
														className={`mr-2 flex h-2 w-2 rounded-full ${PRIORITY_BG_CLASSES.p2}`}
													/>
													Priority 2
												</ContextMenuRadioItem>
												<ContextMenuRadioItem
													value="p3"
													onClick={() => handleSetPriority(feature.id, "p3")}
												>
													<span
														className={`mr-2 flex h-2 w-2 rounded-full ${PRIORITY_BG_CLASSES.p3}`}
													/>
													Priority 3
												</ContextMenuRadioItem>
												<ContextMenuRadioItem
													value="p4"
													onClick={() => handleSetPriority(feature.id, "p4")}
												>
													<span
														className={`mr-2 flex h-2 w-2 rounded-full ${PRIORITY_BG_CLASSES.p4}`}
													/>
													Priority 4
												</ContextMenuRadioItem>
											</ContextMenuRadioGroup>
										</ContextMenuSubContent>
									</ContextMenuSub>
									<ContextMenuSeparator />
									<ContextMenuItem
										inset
										onClick={() => handleDelete(feature.id)}
										className="text-destructive focus:text-destructive"
									>
										<Trash className="mr-2 h-4 w-4" />
										Delete Task
									</ContextMenuItem>
								</ContextMenuContent>
							</ContextMenu>
						)
					}
				</CalendarBody>
			</CalendarProvider>

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

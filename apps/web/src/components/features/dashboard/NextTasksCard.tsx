"use client";

import { TaskItem } from "@/components/features/tasks/TaskItem";
import { Card, CardContent } from "@/components/ui/card";
import type {
	GroupedNextTasks,
	NextTaskGroupKey,
	NextTaskSelection,
} from "./task-groups";

interface NextTasksCardProps {
	groups: GroupedNextTasks;
	onToggle: (id: string, done: boolean) => void;
	onEdit: (task: NextTaskSelection["task"]) => void;
}

const groupLabels: Record<NextTaskGroupKey, string> = {
	roadmap: "Roadmaps",
	board: "Kanban",
	list: "List",
};

const groupOrder: NextTaskGroupKey[] = ["roadmap", "board", "list"];

export function NextTasksCard({
	groups,
	onToggle,
	onEdit,
}: NextTasksCardProps) {
	const visibleGroups = groupOrder.filter(
		(groupKey) => groups[groupKey].length > 0,
	);
	const hasTasks = visibleGroups.length > 0;

	return (
		<Card className="min-h-0 flex-1">
			<CardContent className="min-h-0 flex-1 overflow-y-auto pt-3">
				{!hasTasks ? (
					<div className="py-8 text-sm text-muted-foreground">
						No upcoming tasks yet.
					</div>
				) : (
					<div className="space-y-8">
						{visibleGroups.map((groupKey) => (
							<section key={groupKey}>
								<h2 className="mb-4 border-b px-1 pb-2 text-sm font-bold">
									{groupLabels[groupKey]}
								</h2>
								<div className="space-y-3">
									{groups[groupKey].map((entry) => (
										<TaskItem
											key={entry.task.id}
											task={entry.task}
											onToggle={onToggle}
											onEdit={onEdit}
											projectName={entry.projectName}
											projectColor={entry.projectColor}
											parentTitle={entry.parentTitle}
											showOrigin={true}
										/>
									))}
								</div>
							</section>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

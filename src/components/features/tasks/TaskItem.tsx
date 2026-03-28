"use client";

import { format } from "date-fns";
import { MessageSquare } from "lucide-react";
import { memo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { PRIORITY_COLORS } from "@/lib/priority-colors";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

interface TaskItemProps {
	task: Task;
	projectName?: string;
	projectColor?: string;
	onToggle: (id: string, done: boolean) => void;
	onEdit: (task: Task) => void;
	compact?: boolean;
}

export const TaskItem = memo(function TaskItem({
	task,
	projectName,
	projectColor,
	onToggle,
	onEdit,
	compact,
}: TaskItemProps) {
	return (
		<div
			className={cn(
				"group flex items-start gap-3 rounded-lg px-3 transition-all text-left",
				compact ? "py-1" : "py-2.5",
				"hover:bg-accent/50 cursor-pointer",
				task.status === "done" && "opacity-50",
			)}
			onClick={() => onEdit(task)}
		>
			<Checkbox
				checked={task.status === "done"}
				onCheckedChange={(checked) => onToggle(task.id, !!checked)}
				onClick={(e) => e.stopPropagation()}
				className="rounded-full w-5 h-5 border-2 transition-colors data-[state=checked]:border-none data-[state=checked]:text-white"
				style={{
					borderColor: PRIORITY_COLORS[task.priority],
					backgroundColor:
						task.status === "done"
							? PRIORITY_COLORS[task.priority]
							: "transparent",
				}}
			/>
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<span
						className={cn(
							"text-sm font-medium line-clamp-1",
							task.status === "done" && "line-through text-muted-foreground",
						)}
					>
						{task.title}
					</span>
					{task.comments && task.comments.length > 0 && (
						<div className="flex items-center gap-1 text-muted-foreground">
							<MessageSquare className="h-3 w-3" />
							<span className="text-xs">{task.comments.length}</span>
						</div>
					)}
				</div>
				<div
					className={cn(
						"flex items-center gap-2 mt-0.5",
						!compact && "min-h-[1.25rem]",
					)}
				>
					{task.dueDate && (
						<span className="text-xs text-muted-foreground">
							Due {format(new Date(task.dueDate), "MMM d")}
						</span>
					)}

					{/* Spacer for height consistency if empty */}
					{!compact && !task.dueDate && (
						<span className="text-xs text-muted-foreground invisible">
							No date
						</span>
					)}
				</div>
			</div>
		</div>
	);
});

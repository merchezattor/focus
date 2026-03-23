"use client";

import { format } from "date-fns";
import { useSetAtom } from "jotai";
import { Calendar, Flag, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { goalToEditAtom } from "@/lib/atoms";
import { cn } from "@/lib/utils";
import type { Goal } from "@/types";

interface GoalItemProps {
	goal: Goal;
}

const priorityColors = {
	p1: "#ef4444",
	p2: "#f97316",
	p3: "#3b82f6",
	p4: "#6b7280",
} as const;

export function GoalItem({ goal }: GoalItemProps) {
	const setGoalToEdit = useSetAtom(goalToEditAtom);

	return (
		<div
			className={cn(
				"group flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-all",
				"hover:bg-accent/50",
			)}
		>
			<div className="flex min-w-0 flex-1 items-center gap-3">
				<div
					className="h-3 w-3 shrink-0 rounded-full"
					style={{ backgroundColor: goal.color }}
				/>
				<div className="flex min-w-0 flex-1 flex-col justify-center">
					<div className="flex items-center gap-2">
						<span className="line-clamp-1 text-sm font-medium">
							{goal.name}
						</span>
						<Flag
							className="h-3 w-3 shrink-0"
							style={{ color: priorityColors[goal.priority] }}
						/>
					</div>
					{goal.description && (
						<div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
							{goal.description}
						</div>
					)}
				</div>
			</div>

			<div className="flex shrink-0 items-center gap-2">
				{goal.dueDate && (
					<div className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-[10px] text-muted-foreground">
						<Calendar className="h-3 w-3" />
						<span>{format(new Date(goal.dueDate), "MMM d")}</span>
					</div>
				)}
				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
					onClick={() => setGoalToEdit(goal)}
				>
					<Pencil className="h-3 w-3 text-muted-foreground" />
					<span className="sr-only">Edit Goal</span>
				</Button>
			</div>
		</div>
	);
}

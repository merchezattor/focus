"use client";

import { format } from "date-fns";
import { useSetAtom } from "jotai";
import { Calendar, Pencil } from "lucide-react";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { milestoneToEditAtom } from "@/lib/atoms";
import { cn } from "@/lib/utils";
import type { Milestone } from "@/types";

interface MilestoneItemProps {
	milestone: Milestone;
}

export const MilestoneItem = memo(function MilestoneItem({
	milestone,
}: MilestoneItemProps) {
	const setMilestoneToEdit = useSetAtom(milestoneToEditAtom);

	return (
		<div
			className={cn(
				"group flex items-center justify-between gap-3 rounded-lg border px-3 py-3 transition-all",
				"hover:bg-accent/50",
			)}
		>
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<span className="line-clamp-1 text-sm font-medium">
						{milestone.title}
					</span>
				</div>
				{milestone.description ? (
					<p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
						{milestone.description}
					</p>
				) : null}
				<div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
					<span className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1">
						<Calendar className="h-3 w-3" />
						{format(new Date(milestone.targetDate), "PPP")}
					</span>
					<span>
						Created {format(new Date(milestone.createdAt), "MMM d, yyyy")}
					</span>
				</div>
			</div>

			<Button
				variant="ghost"
				size="icon"
				className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
				onClick={() => setMilestoneToEdit(milestone)}
			>
				<Pencil className="h-3.5 w-3.5 text-muted-foreground" />
				<span className="sr-only">Edit Milestone</span>
			</Button>
		</div>
	);
});

"use client";

import { IconPlus } from "@tabler/icons-react";
import { isBefore, startOfDay } from "date-fns";
import { useSetAtom } from "jotai";
import { Button } from "@/components/ui/button";
import { isAddMilestoneOpenAtom } from "@/lib/atoms";
import type { Milestone } from "@/types";
import { MilestoneItem } from "./MilestoneItem";

interface MilestoneListProps {
	milestones: Milestone[];
}

function getUpcomingCutoff() {
	return startOfDay(new Date());
}

export function MilestoneList({ milestones }: MilestoneListProps) {
	const setAddMilestoneOpen = useSetAtom(isAddMilestoneOpenAtom);
	const upcomingCutoff = getUpcomingCutoff();

	const upcoming = milestones
		.filter(
			(milestone) =>
				!isBefore(startOfDay(new Date(milestone.targetDate)), upcomingCutoff),
		)
		.sort(
			(a, b) =>
				new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime(),
		);

	const past = milestones
		.filter((milestone) =>
			isBefore(startOfDay(new Date(milestone.targetDate)), upcomingCutoff),
		)
		.sort(
			(a, b) =>
				new Date(b.targetDate).getTime() - new Date(a.targetDate).getTime(),
		);

	if (milestones.length === 0) {
		return (
			<div className="flex h-full flex-col items-center justify-center py-16 text-center">
				<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
					<IconPlus className="h-8 w-8 text-muted-foreground" />
				</div>
				<h3 className="mb-2 text-lg font-medium">No milestones yet</h3>
				<p className="mb-6 max-w-sm text-muted-foreground">
					Add major moments you want to track over time.
				</p>
				<Button onClick={() => setAddMilestoneOpen(true)}>
					<IconPlus className="mr-2 h-4 w-4" />
					Add Milestone
				</Button>
			</div>
		);
	}

	const renderSection = (title: string, items: Milestone[]) => {
		if (items.length === 0) return null;

		return (
			<section className="mb-8">
				<h2 className="mb-4 flex items-center justify-between border-b px-1 pb-2 text-sm font-bold">
					<span>{title}</span>
					<span className="text-xs font-normal text-muted-foreground">
						{items.length}
					</span>
				</h2>
				<div className="space-y-2">
					{items.map((milestone) => (
						<MilestoneItem key={milestone.id} milestone={milestone} />
					))}
				</div>
			</section>
		);
	};

	return (
		<div className="space-y-4">
			{renderSection("Upcoming", upcoming)}
			{renderSection("Past", past)}
		</div>
	);
}

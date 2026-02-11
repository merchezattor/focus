"use client";

import { format } from "date-fns";
import { useMemo } from "react";
// Import types from a shared location if possible, or define interface matching the data
import type { ActionType, ActorType, EntityType } from "@/lib/actions";
import { ActionItem } from "./ActionItem";

interface Action {
	id: string;
	entityId: string;
	entityType: EntityType;
	actorId: string;
	actorType: ActorType;
	actionType: ActionType;
	changes: any;
	createdAt: Date;
	isRead: boolean;
}

interface ActionListProps {
	actions: Action[];
}

export function ActionList({ actions }: ActionListProps) {
	const groupedActions = useMemo(() => {
		const groups: Record<string, Action[]> = {};

		actions.forEach((action) => {
			const dateKey = format(new Date(action.createdAt), "yyyy-MM-dd");
			if (!groups[dateKey]) {
				groups[dateKey] = [];
			}
			groups[dateKey].push(action);
		});

		const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a)); // Newest first

		return { dates: sortedDates, groups };
	}, [actions]);

	if (actions.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
				<p>No activity recorded yet.</p>
			</div>
		);
	}

	return (
		<div className="space-y-8 max-w-3xl mx-auto py-6">
			<div className="flex items-center justify-between px-1">
				<h1 className="text-2xl font-bold">Activity Log</h1>
			</div>

			{groupedActions.dates.map((date) => (
				<section key={date}>
					<h2 className="text-sm font-bold border-b pb-2 mb-4 px-1 sticky top-0 bg-background z-10">
						{format(new Date(date), "d MMM")}{" "}
						<span className="text-muted-foreground font-normal">
							· {format(new Date(date), "EEEE")}
						</span>
					</h2>
					<div className="space-y-1">
						{groupedActions.groups[date].map((action) => (
							<ActionItem key={action.id} action={action} />
						))}
					</div>
				</section>
			))}
		</div>
	);
}

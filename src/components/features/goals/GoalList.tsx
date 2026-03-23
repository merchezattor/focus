"use client";

import { IconPlus } from "@tabler/icons-react";
import { useSetAtom } from "jotai";
import { Button } from "@/components/ui/button";
import type { Goal } from "@/types";
import { isAddGoalOpenAtom } from "./GlobalAddGoalDialog";
import { GoalItem } from "./GoalItem";

interface GoalListProps {
	goals: Goal[];
}

export function GoalList({ goals }: GoalListProps) {
	const setAddGoalOpen = useSetAtom(isAddGoalOpenAtom);

	if (goals.length === 0) {
		return (
			<div className="flex h-full flex-col items-center justify-center py-16 text-center">
				<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
					<IconPlus className="h-8 w-8 text-muted-foreground" />
				</div>
				<h3 className="mb-2 text-lg font-medium">No goals yet</h3>
				<p className="mb-6 max-w-sm text-muted-foreground">
					Create your first goal to define the outcomes your projects support.
				</p>
				<Button onClick={() => setAddGoalOpen(true)}>
					<IconPlus className="mr-2 h-4 w-4" />
					Add Goal
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{goals.map((goal) => (
				<GoalItem key={goal.id} goal={goal} />
			))}
		</div>
	);
}

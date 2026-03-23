"use client";

import { IconPlus } from "@tabler/icons-react";
import { useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import type { Goal } from "@/types";
import { isAddGoalOpenAtom } from "./GlobalAddGoalDialog";
import { GoalList } from "./GoalList";

interface GoalsPageClientProps {
	initialGoals: Goal[];
}

export function GoalsPageClient({ initialGoals }: GoalsPageClientProps) {
	const [goals, setGoals] = useState<Goal[]>(initialGoals);
	const setAddGoalOpen = useSetAtom(isAddGoalOpenAtom);

	useEffect(() => {
		setGoals(initialGoals);
	}, [initialGoals]);

	return (
		<>
			<SiteHeader pageTitle="Goals" />
			<div className="mx-auto flex w-full max-w-4xl flex-1 flex-col p-4 md:p-6">
				<div className="mb-6 flex items-center justify-between">
					<h1 className="text-2xl font-bold">All Goals</h1>
					<Button onClick={() => setAddGoalOpen(true)} size="sm">
						<IconPlus className="mr-2 h-4 w-4" />
						Add Goal
					</Button>
				</div>
				<GoalList goals={goals} />
			</div>
		</>
	);
}

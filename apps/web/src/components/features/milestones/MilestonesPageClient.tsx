"use client";

import { IconPlus } from "@tabler/icons-react";
import { useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { isAddMilestoneOpenAtom } from "@/lib/atoms";
import type { Milestone } from "@/types";
import { MilestoneList } from "./MilestoneList";

interface MilestonesPageClientProps {
	initialMilestones: Milestone[];
}

export function MilestonesPageClient({
	initialMilestones,
}: MilestonesPageClientProps) {
	const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);
	const setAddMilestoneOpen = useSetAtom(isAddMilestoneOpenAtom);

	useEffect(() => {
		setMilestones(initialMilestones);
	}, [initialMilestones]);

	return (
		<>
			<SiteHeader pageTitle="Milestones" />
			<div className="mx-auto flex w-full max-w-4xl flex-1 flex-col p-4 md:p-6">
				<div className="mb-6 flex items-center justify-between">
					<h1 className="text-2xl font-bold">All Milestones</h1>
					<Button onClick={() => setAddMilestoneOpen(true)} size="sm">
						<IconPlus className="mr-2 h-4 w-4" />
						Add Milestone
					</Button>
				</div>
				<MilestoneList milestones={milestones} />
			</div>
		</>
	);
}

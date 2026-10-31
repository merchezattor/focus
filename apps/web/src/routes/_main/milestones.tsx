import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { MilestonesPageClient } from "@/components/features/milestones/MilestonesPageClient";
import { milestonesQuery } from "@/lib/queries";

export const Route = createFileRoute("/_main/milestones")({
	component: Milestones,
});

function Milestones() {
	const milestones = useQuery(milestonesQuery());
	if (!milestones.data) {
		return <div className="flex-1 p-6">Loading milestones...</div>;
	}
	return <MilestonesPageClient initialMilestones={milestones.data} />;
}

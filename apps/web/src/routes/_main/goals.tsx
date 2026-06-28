import { GoalsPageClient } from "@/components/features/goals/GoalsPageClient";
import { goalsQuery } from "@/lib/queries";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_main/goals")({
	component: Goals,
});

function Goals() {
	const goals = useQuery(goalsQuery());
	if (!goals.data) {
		return <div className="flex-1 p-6">Loading goals...</div>;
	}
	return <GoalsPageClient initialGoals={goals.data} />;
}

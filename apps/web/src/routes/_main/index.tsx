import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardClient } from "@/components/features/dashboard/DashboardClient";
import {
	milestonesQuery,
	projectStatsQuery,
	projectsQuery,
	tasksQuery,
} from "@/lib/queries";

export const Route = createFileRoute("/_main/")({
	component: Dashboard,
});

function Dashboard() {
	const tasks = useQuery(tasksQuery());
	const projects = useQuery(projectsQuery(false));
	const stats = useQuery(projectStatsQuery("actionable"));
	const milestones = useQuery(milestonesQuery());

	if (!tasks.data || !projects.data || !stats.data || !milestones.data) {
		return <div className="flex-1 p-6">Loading today's tasks...</div>;
	}

	return (
		<DashboardClient
			initialTasks={tasks.data}
			initialProjects={projects.data}
			initialProjectStats={stats.data}
			initialMilestones={milestones.data}
			title="Today"
			filterType="today"
		/>
	);
}

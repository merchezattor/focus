import { SiteHeader } from "@/components/layout/site-header";
import { UpcomingClient } from "@/components/features/upcoming/upcoming-client";
import { milestonesQuery, projectsQuery, tasksQuery } from "@/lib/queries";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_main/upcoming")({
	component: Upcoming,
});

function Upcoming() {
	const tasks = useQuery(tasksQuery());
	const projects = useQuery(projectsQuery(false));
	const milestones = useQuery(milestonesQuery());

	return (
		<>
			<SiteHeader pageTitle="Upcoming" />
			<div className="flex flex-1 flex-col p-4 md:p-6">
				{!tasks.data || !projects.data || !milestones.data ? (
					<div className="p-2">Loading...</div>
				) : (
					<UpcomingClient
						tasks={tasks.data}
						projects={projects.data}
						milestones={milestones.data}
					/>
				)}
			</div>
		</>
	);
}

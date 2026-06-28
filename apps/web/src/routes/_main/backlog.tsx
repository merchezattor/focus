import { SiteHeader } from "@/components/layout/site-header";
import { BacklogClient } from "@/pages/BacklogClient";
import { projectsQuery, tasksQuery } from "@/lib/queries";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_main/backlog")({
	component: Backlog,
});

function Backlog() {
	const tasks = useQuery(tasksQuery("cold"));
	const projects = useQuery(projectsQuery(false));

	return (
		<>
			<SiteHeader pageTitle="Backlog" />
			<div className="flex flex-1 flex-col p-4 md:p-6 pb-[120px]">
				{!tasks.data || !projects.data ? (
					<div className="p-2">Loading backlog...</div>
				) : (
					<BacklogClient
						initialTasks={tasks.data}
						initialProjects={projects.data}
					/>
				)}
			</div>
		</>
	);
}

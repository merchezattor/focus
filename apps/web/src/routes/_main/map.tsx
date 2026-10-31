import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { MapClient } from "@/components/features/map/MapClient";
import { goalsQuery, projectsQuery, tasksQuery } from "@/lib/queries";

export const Route = createFileRoute("/_main/map")({
	component: MapPage,
});

function MapPage() {
	const projects = useQuery(projectsQuery(true));
	const tasks = useQuery(tasksQuery());
	const goals = useQuery(goalsQuery());

	return (
		<div className="flex flex-col h-full w-full">
			<div className="flex items-center justify-between p-4 border-b">
				<h1 className="text-xl font-semibold">Project Map</h1>
			</div>
			<div className="flex-1 bg-muted/10">
				{!projects.data || !tasks.data || !goals.data ? (
					<div className="p-4">Loading map...</div>
				) : (
					<MapClient
						initialProjects={projects.data}
						initialTasks={tasks.data}
						initialGoals={goals.data}
					/>
				)}
			</div>
		</div>
	);
}

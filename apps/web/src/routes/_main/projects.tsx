import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ProjectsPageClient } from "@/components/features/projects/ProjectsPageClient";
import { projectsQuery } from "@/lib/queries";

export const Route = createFileRoute("/_main/projects")({
	component: Projects,
});

function Projects() {
	const projects = useQuery(projectsQuery(true));
	if (!projects.data) {
		return <div className="flex-1 p-6">Loading projects...</div>;
	}
	return <ProjectsPageClient initialProjects={projects.data} />;
}

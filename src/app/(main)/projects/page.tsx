import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ProjectsPageClient } from "@/components/features/projects/ProjectsPageClient";
import { auth } from "@/lib/auth";
import { readActionableProjects } from "@/lib/storage";

export default async function ProjectsPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/login");
	}

	const projects = await readActionableProjects(session.user.id);

	return (
		<Suspense fallback={<div className="flex-1 p-6">Loading projects...</div>}>
			<ProjectsPageClient initialProjects={projects} />
		</Suspense>
	);
}

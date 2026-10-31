"use client";

import { IconPlus } from "@tabler/icons-react";
import { useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { isAddProjectOpenAtom } from "@/lib/atoms";
import type { Project } from "@/types";
import { ProjectsTable } from "./ProjectsTable";

interface ProjectsPageClientProps {
	initialProjects: Project[];
}

export function ProjectsPageClient({
	initialProjects,
}: ProjectsPageClientProps) {
	const [projects, setProjects] = useState<Project[]>(initialProjects);
	const setAddProjectOpen = useSetAtom(isAddProjectOpenAtom);

	// Sync state with props when router.refresh() updates them
	useEffect(() => {
		setProjects(initialProjects);
	}, [initialProjects]);

	// Use an interval or simple event bus if we need real-time sync,
	// but normally mutations refresh the router or we refetch.
	// For now relying on router.refresh() to pass new initialProjects.

	return (
		<>
			<SiteHeader pageTitle="Projects" />
			<div className="flex flex-1 flex-col p-4 md:p-6 w-full">
				<div className="flex items-center justify-between mb-6">
					<h1 className="text-2xl font-bold">All Projects</h1>
					<Button onClick={() => setAddProjectOpen(true)} size="sm">
						<IconPlus className="w-4 h-4 mr-2" />
						Add Project
					</Button>
				</div>
				{projects.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-16 text-center h-full">
						<div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
							<IconPlus className="text-muted-foreground w-8 h-8" />
						</div>
						<h3 className="text-lg font-medium mb-2">No projects yet</h3>
						<p className="text-muted-foreground max-w-sm mb-6">
							Create your first project to start organizing your work.
						</p>
						<Button onClick={() => setAddProjectOpen(true)}>
							<IconPlus className="w-4 h-4 mr-2" />
							Add Project
						</Button>
					</div>
				) : (
					<ProjectsTable projects={projects} />
				)}
			</div>
		</>
	);
}

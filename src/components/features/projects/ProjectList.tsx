"use client";

import { IconPlus } from "@tabler/icons-react";
import { useSetAtom } from "jotai";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { isAddProjectOpenAtom } from "@/lib/atoms";
import type { Project } from "@/types";
import { ProjectItem } from "./ProjectItem";

interface ProjectListProps {
	projects: Project[];
}

export function ProjectList({ projects }: ProjectListProps) {
	const setAddProjectOpen = useSetAtom(isAddProjectOpenAtom);

	const groupedProjects = useMemo(() => {
		const groups: Record<string, Project[]> = {
			working: [],
			complete: [],
			frozen: [],
			archived: [],
		};

		projects.forEach((project) => {
			const status = project.status || "working";
			if (!groups[status]) {
				groups[status] = [];
			}
			groups[status].push(project);
		});

		return groups;
	}, [projects]);

	if (projects.length === 0) {
		return (
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
		);
	}

	const renderGroup = (title: string, groupKey: string, count: number) => {
		const items = groupedProjects[groupKey];
		if (!items || items.length === 0) return null;

		return (
			<section key={groupKey} className="mb-8">
				<h2 className="text-sm font-bold border-b pb-2 mb-4 px-1 flex items-center justify-between">
					<span>{title}</span>
					<span className="text-muted-foreground font-normal text-xs">
						{count}
					</span>
				</h2>
				<div className="space-y-2">
					{items.map((project) => (
						<ProjectItem key={project.id} project={project} />
					))}
				</div>
			</section>
		);
	};

	return (
		<div className="space-y-4">
			{renderGroup("Working", "working", groupedProjects.working.length)}
			{renderGroup("Frozen", "frozen", groupedProjects.frozen.length)}
			{renderGroup("Complete", "complete", groupedProjects.complete.length)}
			{renderGroup("Archived", "archived", groupedProjects.archived.length)}
		</div>
	);
}

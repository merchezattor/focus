"use client";

import {
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectSeparator,
} from "@/components/ui/select";
import type { Project } from "@/types";

export const NO_PROJECT_VALUE = "__no_project__";

function isSelectableProject(project: Project) {
	return project.kind !== "group";
}

export function findSelectableProject(
	projects: Project[],
	projectId: string | null | undefined,
) {
	if (!projectId) return undefined;

	const project = projects.find((candidate) => candidate.id === projectId);
	return project && isSelectableProject(project) ? project : undefined;
}

export function normalizeSelectableProjectId(
	projects: Project[],
	projectId: string | null | undefined,
) {
	return findSelectableProject(projects, projectId)?.id ?? null;
}

export function TaskProjectSelectItems({
	projects,
	includeNoProject = true,
}: {
	projects: Project[];
	includeNoProject?: boolean;
}) {
	const selectableProjects = projects.filter(isSelectableProject);
	const workingProjects = selectableProjects.filter(
		(project) => project.status === "working",
	);
	const otherProjects = selectableProjects.filter(
		(project) => project.status !== "working",
	);
	const hasProjectGroups =
		workingProjects.length > 0 || otherProjects.length > 0;

	return (
		<>
			{includeNoProject && (
				<SelectItem value={NO_PROJECT_VALUE}>
					<div className="flex items-center gap-2">
						<span className="w-2 h-2 rounded-full bg-black dark:bg-white" />
						No project
					</div>
				</SelectItem>
			)}
			{includeNoProject && hasProjectGroups && <SelectSeparator />}

			{workingProjects.length > 0 && (
				<SelectGroup>
					<SelectLabel>Working Projects</SelectLabel>
					{workingProjects.map((project) => (
						<SelectItem key={project.id} value={project.id}>
							<div className="flex items-center gap-2">
								<span
									className="w-2 h-2 rounded-full"
									style={{ backgroundColor: project.color }}
								/>
								{project.name}
							</div>
						</SelectItem>
					))}
				</SelectGroup>
			)}

			{workingProjects.length > 0 && otherProjects.length > 0 && (
				<SelectSeparator />
			)}

			{otherProjects.length > 0 && (
				<SelectGroup>
					<SelectLabel>Other Projects</SelectLabel>
					{otherProjects.map((project) => (
						<SelectItem key={project.id} value={project.id}>
							<div className="flex items-center gap-2">
								<span
									className="w-2 h-2 rounded-full"
									style={{ backgroundColor: project.color }}
								/>
								{project.name}
							</div>
						</SelectItem>
					))}
				</SelectGroup>
			)}
		</>
	);
}

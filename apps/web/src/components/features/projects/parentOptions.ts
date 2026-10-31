import type { Goal, Project } from "@/types";

export interface ParentOption {
	/** Encoded value: "none" | "goal:<uuid>" | "project:<uuid>" */
	value: string;
	label: string;
	color?: string;
}

export interface ParentSection {
	label: string;
	options: ParentOption[];
}

const STATUS_SECTIONS: Array<{ status: Project["status"]; label: string }> = [
	{ status: "working", label: "Working projects" },
	{ status: "frozen", label: "Frozen projects" },
	{ status: "complete", label: "Complete" },
	{ status: "archived", label: "Archived" },
];

function byName<T extends { name: string }>(a: T, b: T) {
	return a.name.localeCompare(b.name);
}

function projectOption(project: Project): ParentOption {
	return {
		value: `project:${project.id}`,
		label: project.name,
		color: project.color,
	};
}

/** The project itself plus every project reachable below it, at any depth. */
function collectSelfAndDescendantIds(projects: Project[], rootId: string) {
	const excluded = new Set<string>([rootId]);
	let grew = true;
	while (grew) {
		grew = false;
		for (const project of projects) {
			if (
				project.parentProjectId &&
				excluded.has(project.parentProjectId) &&
				!excluded.has(project.id)
			) {
				excluded.add(project.id);
				grew = true;
			}
		}
	}
	return excluded;
}

export function buildParentSections({
	goals,
	projects: allProjects,
	editingProjectId,
}: {
	goals: Goal[];
	projects: Project[];
	editingProjectId?: string;
}): ParentSection[] {
	const excluded = editingProjectId
		? collectSelfAndDescendantIds(allProjects, editingProjectId)
		: new Set<string>();
	const projects = allProjects.filter((p) => !excluded.has(p.id));

	const sections: ParentSection[] = [
		{ label: "No Parent", options: [{ value: "none", label: "No Parent" }] },
		{
			label: "Goals",
			options: [...goals].sort(byName).map((goal) => ({
				value: `goal:${goal.id}`,
				label: goal.name,
				color: goal.color,
			})),
		},
		{
			label: "Groups",
			options: projects
				.filter((p) => p.kind === "group")
				.sort(byName)
				.map(projectOption),
		},
		...STATUS_SECTIONS.map(({ status, label }) => ({
			label,
			options: projects
				.filter((p) => p.kind !== "group" && p.status === status)
				.sort(byName)
				.map(projectOption),
		})),
	];

	return sections.filter((section) => section.options.length > 0);
}

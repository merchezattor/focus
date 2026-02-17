"use client";

import { useAtom } from "jotai";
import { projectToEditAtom } from "@/lib/atoms";
import type { Goal, Project } from "@/types";
import { AddProjectDialog } from "./AddProjectDialog";

export function GlobalEditProjectDialog({
	goals,
	projects,
}: {
	goals?: Goal[];
	projects?: Project[];
}) {
	const [projectToEdit, setProjectToEdit] = useAtom(projectToEditAtom);

	return (
		<AddProjectDialog
			open={!!projectToEdit}
			onOpenChange={(open) => {
				if (!open) setProjectToEdit(null);
			}}
			projectToEdit={projectToEdit}
			goals={goals}
			projects={projects}
		/>
	);
}

"use client"

import { useAtom } from "jotai"
import { projectToEditAtom } from "@/lib/atoms"
import { AddProjectDialog } from "./AddProjectDialog"
import { type Goal, type Project } from "@/types"

export function GlobalEditProjectDialog({ goals, projects }: { goals?: Goal[]; projects?: Project[] }) {
    const [projectToEdit, setProjectToEdit] = useAtom(projectToEditAtom)

    return (
        <AddProjectDialog
            open={!!projectToEdit}
            onOpenChange={(open) => {
                if (!open) setProjectToEdit(null)
            }}
            projectToEdit={projectToEdit}
            goals={goals}
            projects={projects}
        />
    )
}

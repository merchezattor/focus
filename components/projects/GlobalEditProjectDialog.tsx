"use client"

import { useAtom } from "jotai"
import { projectToEditAtom } from "@/lib/atoms"
import { AddProjectDialog } from "./AddProjectDialog"
import { type Goal } from "@/types"

export function GlobalEditProjectDialog({ goals }: { goals?: Goal[] }) {
    const [projectToEdit, setProjectToEdit] = useAtom(projectToEditAtom)

    return (
        <AddProjectDialog
            open={!!projectToEdit}
            onOpenChange={(open) => {
                if (!open) setProjectToEdit(null)
            }}
            projectToEdit={projectToEdit}
            goals={goals}
        />
    )
}

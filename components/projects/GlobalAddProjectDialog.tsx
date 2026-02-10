"use client"

import { useAtom } from "jotai"
import { isAddProjectOpenAtom } from "@/lib/atoms"
import { AddProjectDialog } from "@/components/projects/AddProjectDialog"
import { type Goal, type Project } from "@/types"

export function GlobalAddProjectDialog({ goals, projects }: { goals?: Goal[]; projects?: Project[] }) {
    const [isOpen, setIsOpen] = useAtom(isAddProjectOpenAtom)

    return (
        <AddProjectDialog
            open={isOpen}
            onOpenChange={setIsOpen}
            goals={goals}
            projects={projects}
        />
    )
}

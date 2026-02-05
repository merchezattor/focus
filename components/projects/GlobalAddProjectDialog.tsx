"use client"

import { useAtom } from "jotai"
import { isAddProjectOpenAtom } from "@/lib/atoms"
import { AddProjectDialog } from "@/components/projects/AddProjectDialog"
import { type Goal } from "@/types"

export function GlobalAddProjectDialog({ goals }: { goals?: Goal[] }) {
    const [isOpen, setIsOpen] = useAtom(isAddProjectOpenAtom)

    return (
        <AddProjectDialog
            open={isOpen}
            onOpenChange={setIsOpen}
            goals={goals}
        />
    )
}

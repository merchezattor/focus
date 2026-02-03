"use client"

import { useAtom } from "jotai"
import { isAddProjectOpenAtom } from "@/lib/atoms"
import { AddProjectDialog } from "@/components/projects/AddProjectDialog"

export function GlobalAddProjectDialog() {
    const [isOpen, setIsOpen] = useAtom(isAddProjectOpenAtom)

    return (
        <AddProjectDialog
            open={isOpen}
            onOpenChange={setIsOpen}
        />
    )
}

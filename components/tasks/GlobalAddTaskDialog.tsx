"use client"

import { useAtom } from "jotai"
import { isAddTaskOpenAtom } from "@/lib/atoms"
import { AddTaskDialog } from "@/components/tasks/AddTaskDialog"
import type { Project } from "@/types"
import { useRouter } from "next/navigation"

export function GlobalAddTaskDialog({ projects }: { projects: Project[] }) {
    const [isOpen, setIsOpen] = useAtom(isAddTaskOpenAtom)
    const router = useRouter()

    return (
        <AddTaskDialog
            open={isOpen}
            onOpenChange={setIsOpen}
            projects={projects}
            onTaskCreated={() => {
                router.refresh()
            }}
            trigger={null}
        />
    )
}

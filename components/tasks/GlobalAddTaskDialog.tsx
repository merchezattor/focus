"use client"

import { useAtom, useSetAtom } from "jotai"
import { isAddTaskOpenAtom, tasksAtom } from "@/lib/atoms"
import { AddTaskDialog } from "@/components/tasks/AddTaskDialog"
import type { Project } from "@/types"
import { useRouter } from "next/navigation"

export function GlobalAddTaskDialog({ projects }: { projects: Project[] }) {
    const [isOpen, setIsOpen] = useAtom(isAddTaskOpenAtom)
    const setTasks = useSetAtom(tasksAtom)
    const router = useRouter()

    return (
        <AddTaskDialog
            open={isOpen}
            onOpenChange={setIsOpen}
            projects={projects}
            onOptimisticAdd={(task) => setTasks(prev => [task, ...prev])}
            onTaskCreated={() => {
                router.refresh()
            }}
            trigger={null}
        />
    )
}

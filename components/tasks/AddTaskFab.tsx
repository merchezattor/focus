"use client"

import { useSetAtom } from "jotai"
import { isAddTaskOpenAtom } from "@/lib/atoms"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AddTaskFab() {
    const setAddTaskOpen = useSetAtom(isAddTaskOpenAtom)

    return (
        <Button
            onClick={() => setAddTaskOpen(true)}
            className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-[#db4c3f] shadow-lg hover:bg-[#b03d32] text-white p-0 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
            size="icon"
            aria-label="Add task"
        >
            <Plus className="h-8 w-8" />
        </Button>
    )
}

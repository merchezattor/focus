"use client"

import {
    CalendarBody,
    CalendarDate,
    CalendarDatePagination,
    CalendarDatePicker,
    CalendarHeader,
    CalendarItem,
    CalendarMonthPicker,
    CalendarProvider,
    CalendarYearPicker,
    type Feature,
} from "@/components/ui/calendar-full";
import type { Task, Project } from "@/types";
import { useMemo, useState } from "react";
import { EditTaskDialog } from "@/components/tasks/EditTaskDialog";
import { useRouter } from "next/navigation";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuRadioGroup,
    ContextMenuRadioItem,
    ContextMenuSeparator,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { Check, Flag, Trash } from "lucide-react"

const priorityColors = {
    p1: "#ef4444", // Red
    p2: "#f97316", // Orange
    p3: "#3b82f6", // Blue
    p4: "#6b7280", // Grey
};

export function UpcomingClient({ tasks, projects }: { tasks: Task[], projects: Project[] }) {
    const router = useRouter();
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const features: Feature[] = useMemo(() => {
        return tasks
            .filter((t) => !t.completed && (t.planDate || t.dueDate))
            .map((t) => ({
                id: t.id,
                name: t.title,
                startAt: new Date(t.planDate || t.dueDate!),
                endAt: new Date(t.planDate || t.dueDate!),
                status: {
                    id: t.priority,
                    name: t.priority,
                    color: priorityColors[t.priority as keyof typeof priorityColors] || "#6b7280",
                },
            }));
    }, [tasks]);

    const handleTaskClick = (taskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            setEditingTask(task);
        }
    };

    const handleTaskUpdated = () => {
        router.refresh();
    };

    const handleComplete = async (taskId: string) => {
        try {
            await fetch(`/api/tasks/${taskId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ completed: true }),
            });
            router.refresh();
        } catch (error) {
            console.error("Failed to complete task:", error);
        }
    };

    const handleSetPriority = async (taskId: string, priority: string) => {
        try {
            await fetch(`/api/tasks/${taskId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ priority }),
            });
            router.refresh();
        } catch (error) {
            console.error("Failed to update priority:", error);
        }
    };

    const handleDelete = async (taskId: string) => {
        if (!confirm("Are you sure you want to delete this task?")) return;
        try {
            await fetch(`/api/tasks/${taskId}`, {
                method: "DELETE",
            });
            router.refresh();
        } catch (error) {
            console.error("Failed to delete task:", error);
        }
    };

    return (
        <div className="h-full w-full flex flex-col">
            <CalendarProvider
                className="flex-1 border rounded-lg overflow-hidden bg-background shadow-sm"
                startDay={1} // 1 = Monday
            >
                <CalendarDate>
                    <CalendarDatePicker>
                        <CalendarMonthPicker />
                        <CalendarYearPicker start={2024} end={2030} />
                    </CalendarDatePicker>
                    <CalendarDatePagination />
                </CalendarDate>
                <CalendarHeader />
                <CalendarBody features={features}>
                    {({ feature }) => (
                        <ContextMenu key={feature.id}>
                            <ContextMenuTrigger>
                                <CalendarItem
                                    feature={feature}
                                    onClick={() => handleTaskClick(feature.id)}
                                />
                            </ContextMenuTrigger>
                            <ContextMenuContent className="w-64">
                                <ContextMenuItem inset onClick={() => handleComplete(feature.id)}>
                                    <Check className="mr-2 h-4 w-4" />
                                    Complete Task
                                </ContextMenuItem>
                                <ContextMenuSeparator />
                                <ContextMenuSub>
                                    <ContextMenuSubTrigger inset>
                                        <Flag className="mr-2 h-4 w-4" />
                                        Priority
                                    </ContextMenuSubTrigger>
                                    <ContextMenuSubContent className="w-48">
                                        <ContextMenuRadioGroup value={feature.status.name}>
                                            <ContextMenuRadioItem value="p1" onClick={() => handleSetPriority(feature.id, "p1")}>
                                                <span className="flex h-2 w-2 rounded-full mr-2 bg-[#ef4444]" />
                                                Priority 1
                                            </ContextMenuRadioItem>
                                            <ContextMenuRadioItem value="p2" onClick={() => handleSetPriority(feature.id, "p2")}>
                                                <span className="flex h-2 w-2 rounded-full mr-2 bg-[#f97316]" />
                                                Priority 2
                                            </ContextMenuRadioItem>
                                            <ContextMenuRadioItem value="p3" onClick={() => handleSetPriority(feature.id, "p3")}>
                                                <span className="flex h-2 w-2 rounded-full mr-2 bg-[#3b82f6]" />
                                                Priority 3
                                            </ContextMenuRadioItem>
                                            <ContextMenuRadioItem value="p4" onClick={() => handleSetPriority(feature.id, "p4")}>
                                                <span className="flex h-2 w-2 rounded-full mr-2 bg-[#6b7280]" />
                                                Priority 4
                                            </ContextMenuRadioItem>
                                        </ContextMenuRadioGroup>
                                    </ContextMenuSubContent>
                                </ContextMenuSub>
                                <ContextMenuSeparator />
                                <ContextMenuItem inset onClick={() => handleDelete(feature.id)} className="text-destructive focus:text-destructive">
                                    <Trash className="mr-2 h-4 w-4" />
                                    Delete Task
                                </ContextMenuItem>
                            </ContextMenuContent>
                        </ContextMenu>
                    )}
                </CalendarBody>
            </CalendarProvider>

            {editingTask && (
                <EditTaskDialog
                    task={editingTask}
                    projects={projects}
                    onTaskUpdated={handleTaskUpdated}
                    open={true}
                    onOpenChange={(open) => !open && setEditingTask(null)}
                    trigger={null}
                />
            )}
        </div>
    );
}

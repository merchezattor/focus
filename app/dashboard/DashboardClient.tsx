"use client"

import { useState, useCallback } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { TaskList } from "@/components/tasks/TaskList"
import { AddTaskDialog } from "@/components/tasks/AddTaskDialog"
import { EditTaskDialog } from "@/components/tasks/EditTaskDialog"
import type { Task, Project } from "@/types"

interface DashboardClientProps {
    initialTasks: Task[]
    initialProjects: Project[]
}

export function DashboardClient({ initialTasks, initialProjects }: DashboardClientProps) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks)
    const [projects, setProjects] = useState<Project[]>(initialProjects)
    const [error, setError] = useState<string | null>(null)
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
    const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)

    const fetchData = useCallback(async () => {
        try {
            const [tasksRes, projectsRes] = await Promise.all([
                fetch('/api/tasks'),
                fetch('/api/projects'),
            ])

            if (!tasksRes.ok || !projectsRes.ok) throw new Error('Failed to fetch data')

            const tasksData = await tasksRes.json()
            const projectsData = await projectsRes.json()

            setTasks(tasksData.tasks)
            setProjects(projectsData.projects)
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        }
    }, [])

    const handleToggle = async (taskId: string, completed: boolean) => {
        try {
            // Optimistic update
            setTasks(prev => prev.map(t =>
                t.id === taskId ? { ...t, completed } : t
            ))

            const res = await fetch(`/api/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed }),
            })

            if (!res.ok) {
                throw new Error('Failed to update task')
            }
        } catch (err) {
            console.error('Failed to toggle task:', err)
            // Revert optimistic update
            fetchData()
        }
    }

    const handleEdit = (task: Task) => {
        setEditingTask(task)
    }

    // Filter tasks by selected project
    const filteredTasks = selectedProjectId
        ? tasks.filter(t => t.projectId === selectedProjectId)
        : tasks

    if (error) {
        return (
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <SiteHeader />
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-red-500">Error: {error}</div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        )
    }

    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            <AppSidebar
                projects={projects}
                selectedProjectId={selectedProjectId}
                onSelectProject={setSelectedProjectId}
                onAddTask={() => setIsAddTaskOpen(true)}
            />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                            <TaskList
                                tasks={filteredTasks}
                                projects={new Map(projects.map(p => [p.id, p]))}
                                onToggle={handleToggle}
                                onEdit={handleEdit}
                            />
                        </div>
                    </div>
                </div>
            </SidebarInset>

            <AddTaskDialog
                projects={projects}
                onTaskCreated={fetchData}
                open={isAddTaskOpen}
                onOpenChange={setIsAddTaskOpen}
                trigger={null}
            />

            {editingTask && (
                <EditTaskDialog
                    task={editingTask}
                    projects={projects}
                    onTaskUpdated={fetchData}
                    open={true}
                    onOpenChange={(open) => !open && setEditingTask(null)}
                    trigger={null}
                />
            )}
        </SidebarProvider>
    )
}

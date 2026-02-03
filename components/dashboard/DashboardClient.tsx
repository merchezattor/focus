"use client"

import { useState, useCallback, useEffect } from "react"
import { SiteHeader } from "@/components/site-header"
import { useSearchParams } from "next/navigation"

import { TaskList } from "@/components/tasks/TaskList"
import { AddTaskDialog } from "@/components/tasks/AddTaskDialog"
import { EditTaskDialog } from "@/components/tasks/EditTaskDialog"
import type { Task, Project } from "@/types"

import { isToday, isPast, isSameDay } from "date-fns"

interface DashboardClientProps {
    initialTasks: Task[]
    initialProjects: Project[]
    title?: string
    filterType?: 'all' | 'today'
}

export function DashboardClient({ initialTasks, initialProjects, title, filterType = 'all' }: DashboardClientProps) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks)
    const [projects, setProjects] = useState<Project[]>(initialProjects)
    const [error, setError] = useState<string | null>(null)
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
    const searchParams = useSearchParams()
    const selectedProjectId = searchParams.get('project')

    // Sync state with props when router.refresh() updates them
    useEffect(() => {
        setTasks(initialTasks)
    }, [initialTasks])

    useEffect(() => {
        setProjects(initialProjects)
    }, [initialProjects])

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

    // Filter tasks
    let filteredTasks = tasks
    if (selectedProjectId) {
        filteredTasks = tasks.filter(t => t.projectId === selectedProjectId)
    } else if (filterType === 'today') {
        filteredTasks = tasks.filter(t => {
            if (!t.dueDate) return false
            const date = new Date(t.dueDate)
            return isToday(date) || (isPast(date) && !isSameDay(date, new Date()) && !t.completed) // Optionally show overdue? User said "Todays tasks". Usually implies Due Today. I'll stick to isToday for now.
            // Actually, Todoist Today view usually shows Overdue tasks too. I'll include overdue.
            // Wait, isPast includes today if time matches? isToday is safer.
            // Let's stick to strict Today for now or Today + Overdue.
            // User request: "show list of todays tasks". I'll default to isToday(date).
            return isToday(date)
        })
    }

    if (error) {
        return (
            <>
                <SiteHeader pageTitle="Error" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-red-500">Error: {error}</div>
                </div>
            </>
        )
    }

    return (
        <>
            <SiteHeader pageTitle={title || projects.find(p => p.id === selectedProjectId)?.name || "Inbox"} />
            <div className="flex flex-1 flex-col p-4 md:p-6">
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <TaskList
                        tasks={filteredTasks}
                        projects={new Map(projects.map(p => [p.id, p]))}
                        onToggle={handleToggle}
                        onEdit={handleEdit}
                    />
                </div>
            </div>

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
        </>
    )
}

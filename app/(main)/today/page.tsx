import { Suspense } from "react";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { readProjects, readTasks } from "@/lib/storage";
import { isToday } from "date-fns";

export default async function TodayPage() {
    const [tasks, projects] = await Promise.all([
        readTasks(),
        readProjects(),
    ]);

    // Pre-filter on server for initial render, though DashboardClient re-filters.
    // DashboardClient expects full tasks for refetching consistency, 
    // but better to pass full tasks and let it filter.

    return (
        <Suspense fallback={<div className="flex-1 p-6">Loading today's tasks...</div>}>
            <DashboardClient
                initialTasks={tasks}
                initialProjects={projects}
                title="Today"
                filterType="today"
            />
        </Suspense>
    );
}

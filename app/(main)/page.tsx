import { Suspense } from "react";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { readProjects, readTasks } from "@/lib/storage";

export default async function InboxPage() {
    const [tasks, projects] = await Promise.all([
        readTasks(),
        readProjects(),
    ]);

    return (
        <Suspense fallback={<div className="flex-1 p-6">Loading tasks...</div>}>
            <DashboardClient initialTasks={tasks} initialProjects={projects} />
        </Suspense>
    );
}

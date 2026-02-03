import { readProjects, readTasks } from "@/lib/storage";
import { UpcomingClient } from "@/components/upcoming/upcoming-client";
import { SiteHeader } from "@/components/site-header";
import { Suspense } from "react";

export default async function UpcomingPage() {
    const [tasks, projects] = await Promise.all([
        readTasks(),
        readProjects(),
    ]);

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SiteHeader pageTitle="Upcoming" />
            <div className="flex flex-1 flex-col p-4 md:p-6">
                <UpcomingClient tasks={tasks} projects={projects} />
            </div>
        </Suspense>
    );
}

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { readProjects, readTasks } from "@/lib/storage";
import { MapClient } from "@/components/map/MapClient";

export default async function MapPage() {
    // 1. Auth Check
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/");
    }

    // 2. Fetch Data
    const [projects, tasks] = await Promise.all([
        readProjects(session.user.id),
        readTasks(session.user.id),
    ]);

    // 3. Render Client Component
    return (
        <div className="flex flex-col h-full w-full">
            <div className="flex items-center justify-between p-4 border-b">
                <h1 className="text-xl font-semibold">Project Map</h1>
            </div>
            <div className="flex-1 bg-muted/10">
                <MapClient initialProjects={projects} initialTasks={tasks} />
            </div>
        </div>
    );
}

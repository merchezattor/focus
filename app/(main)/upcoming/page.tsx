import { readTasks } from "@/lib/storage";
import { UpcomingClient } from "@/components/upcoming/upcoming-client";
import { SiteHeader } from "@/components/site-header";

export default async function UpcomingPage() {
    const tasks = await readTasks();

    return (
        <>
            <SiteHeader pageTitle="Upcoming" />
            <div className="flex flex-1 flex-col p-4 md:p-6">
                <UpcomingClient tasks={tasks} />
            </div>
        </>
    );
}

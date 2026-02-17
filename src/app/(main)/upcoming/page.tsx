import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { UpcomingClient } from "@/components/features/upcoming/upcoming-client";
import { auth } from "@/lib/auth";
import { readProjects, readTasks } from "@/lib/storage";

export default async function UpcomingPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/login");
	}

	const [tasks, projects] = await Promise.all([
		readTasks(session.user.id),
		readProjects(session.user.id),
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

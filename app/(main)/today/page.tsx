import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { auth } from "@/lib/auth";
import { readProjects, readTasks } from "@/lib/storage";

export default async function TodayPage() {
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

	// Pre-filter on server for initial render, though DashboardClient re-filters.
	// DashboardClient expects full tasks for refetching consistency,
	// but better to pass full tasks and let it filter.

	return (
		<Suspense
			fallback={<div className="flex-1 p-6">Loading today's tasks...</div>}
		>
			<DashboardClient
				initialTasks={tasks}
				initialProjects={projects}
				title="Today"
				filterType="today"
			/>
		</Suspense>
	);
}

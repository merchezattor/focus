import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DashboardClient } from "@/components/features/dashboard/DashboardClient";
import { auth } from "@/lib/auth";
import {
	getWorkingActionableProjectStats,
	readActionableProjects,
	readMilestones,
	readTasks,
} from "@/lib/storage";

export default async function TodayPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/login");
	}

	const [tasks, projects, projectStats, milestones] = await Promise.all([
		readTasks(session.user.id),
		readActionableProjects(session.user.id),
		getWorkingActionableProjectStats(session.user.id),
		readMilestones(session.user.id),
	]);

	return (
		<Suspense
			fallback={<div className="flex-1 p-6">Loading today's tasks...</div>}
		>
			<DashboardClient
				initialTasks={tasks}
				initialProjects={projects}
				initialProjectStats={projectStats}
				initialMilestones={milestones}
				title="Today"
				filterType="today"
			/>
		</Suspense>
	);
}

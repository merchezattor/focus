import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { auth } from "@/lib/auth";
import { readProjects, readTasks } from "@/lib/storage";

// Define props interface for Next.js 15+/16 page
interface PageProps {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function InboxPage(props: PageProps) {
	const searchParams = await props.searchParams;
	const projectId =
		typeof searchParams.project === "string" ? searchParams.project : undefined;

	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/login");
	}

	const [allTasks, projects] = await Promise.all([
		readTasks(session.user.id),
		readProjects(session.user.id),
	]);

	// Filter tasks:
	// - If project selected: show project tasks
	// - If no project (Inbox): show ALL tasks (as per user request)
	const tasks = allTasks.filter((task) => {
		if (projectId) {
			return task.projectId === projectId;
		}
		return true;
	});

	return (
		<Suspense fallback={<div className="flex-1 p-6">Loading tasks...</div>}>
			<DashboardClient initialTasks={tasks} initialProjects={projects} />
		</Suspense>
	);
}

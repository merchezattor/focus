import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { auth } from "@/lib/auth";
import { getBacklogTasks, readActionableProjects } from "@/lib/storage";
import { BacklogClient } from "./client";

export const metadata: Metadata = {
	title: "Backlog | Focus",
	description: "View and manage your backlog of cold tasks.",
};

export default async function BacklogPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/login");
	}

	const [tasks, projects] = await Promise.all([
		getBacklogTasks(session.user.id),
		readActionableProjects(session.user.id),
	]);

	return (
		<>
			<SiteHeader pageTitle="Backlog" />
			<div className="flex flex-1 flex-col p-4 md:p-6 pb-[120px]">
				<BacklogClient initialTasks={tasks} initialProjects={projects} />
			</div>
		</>
	);
}

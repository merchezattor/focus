import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { auth } from "@/lib/auth";
import { getCompletedTasks, readProjects } from "@/lib/storage";
import { CompletedClient } from "./client";

export const metadata: Metadata = {
	title: "Completed | Focus",
	description: "View your completed tasks.",
};

export default async function CompletedPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/login");
	}

	const [tasks, projects] = await Promise.all([
		getCompletedTasks(session.user.id),
		readProjects(session.user.id),
	]);

	return (
		<>
			<SiteHeader pageTitle="Completed" />
			<div className="flex flex-1 flex-col p-4 md:p-6 pb-[120px]">
				<CompletedClient initialTasks={tasks} initialProjects={projects} />
			</div>
		</>
	);
}

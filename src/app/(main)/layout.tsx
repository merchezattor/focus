import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { CSSProperties } from "react";
import { GlobalAddGoalDialog } from "@/components/features/goals/GlobalAddGoalDialog";
import { GlobalEditGoalDialog } from "@/components/features/goals/GlobalEditGoalDialog";
import { GlobalAddProjectDialog } from "@/components/features/projects/GlobalAddProjectDialog";
import { GlobalEditProjectDialog } from "@/components/features/projects/GlobalEditProjectDialog";
import { AddTaskFab } from "@/components/features/tasks/AddTaskFab";
import { GlobalAddTaskDialog } from "@/components/features/tasks/GlobalAddTaskDialog";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getUnreadActionsCount } from "@/lib/actions";
import { auth } from "@/lib/auth";
import { getTaskCounts, readGoals, readProjects } from "@/lib/storage";

export default async function MainLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/login");
	}

	const [projects, counts, goals, unreadActionsCount] = await Promise.all([
		readProjects(session.user.id),
		getTaskCounts(session.user.id),
		readGoals(session.user.id),
		getUnreadActionsCount(session.user.id),
	]);

	return (
		<SidebarProvider
			suppressHydrationWarning
			style={
				{
					"--sidebar-width": "calc(var(--spacing) * 72)",
					"--header-height": "calc(var(--spacing) * 12)",
				} as CSSProperties
			}
		>
			<AppSidebar
				projects={projects}
				user={session.user}
				counts={{ ...counts, eventsCount: unreadActionsCount }}
				goals={goals}
			/>
			<GlobalAddTaskDialog projects={projects} />
			<GlobalAddProjectDialog goals={goals} projects={projects} />
			<GlobalEditProjectDialog goals={goals} projects={projects} />
			<GlobalAddGoalDialog />
			<GlobalEditGoalDialog />
			<AddTaskFab />
			<SidebarInset>{children}</SidebarInset>
		</SidebarProvider>
	);
}

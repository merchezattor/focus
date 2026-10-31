import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { GlobalAddGoalDialog } from "@/components/features/goals/GlobalAddGoalDialog";
import { GlobalEditGoalDialog } from "@/components/features/goals/GlobalEditGoalDialog";
import { GlobalAddMilestoneDialog } from "@/components/features/milestones/GlobalAddMilestoneDialog";
import { GlobalEditMilestoneDialog } from "@/components/features/milestones/GlobalEditMilestoneDialog";
import { GlobalAddProjectDialog } from "@/components/features/projects/GlobalAddProjectDialog";
import { GlobalEditProjectDialog } from "@/components/features/projects/GlobalEditProjectDialog";
import { AddTaskFab } from "@/components/features/tasks/AddTaskFab";
import { GlobalAddTaskDialog } from "@/components/features/tasks/GlobalAddTaskDialog";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import {
	goalsQuery,
	projectsQuery,
	taskCountsQuery,
	unreadCountQuery,
} from "@/lib/queries";

export const Route = createFileRoute("/_main")({
	beforeLoad: async () => {
		const { data } = await authClient.getSession();
		if (!data) {
			throw redirect({ to: "/login" });
		}
		return { user: data.user };
	},
	component: MainLayout,
});

function MainLayout() {
	const { user } = Route.useRouteContext();

	const { data: actionableProjects = [] } = useQuery(projectsQuery(false));
	const { data: allProjects = [] } = useQuery(projectsQuery(true));
	const { data: goals = [] } = useQuery(goalsQuery());
	const { data: counts } = useQuery(taskCountsQuery());
	const { data: unreadCount = 0 } = useQuery(unreadCountQuery());

	return (
		<SidebarProvider
			style={
				{
					"--sidebar-width": "calc(var(--spacing) * 72)",
					"--header-height": "calc(var(--spacing) * 12)",
				} as CSSProperties
			}
		>
			<AppSidebar
				projects={actionableProjects}
				user={user}
				counts={{
					backlogCount: counts?.backlogCount ?? 0,
					todayCount: counts?.todayCount ?? 0,
					eventsCount: unreadCount,
					projectCounts: counts?.projectCounts,
				}}
				goals={goals}
			/>
			<GlobalAddTaskDialog projects={actionableProjects} />
			<GlobalAddProjectDialog goals={goals} projects={allProjects} />
			<GlobalEditProjectDialog goals={goals} projects={allProjects} />
			<GlobalAddGoalDialog />
			<GlobalEditGoalDialog />
			<GlobalAddMilestoneDialog />
			<GlobalEditMilestoneDialog />
			<AddTaskFab />
			<SidebarInset>
				<Outlet />
			</SidebarInset>
		</SidebarProvider>
	);
}

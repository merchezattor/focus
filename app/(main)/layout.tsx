import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { readProjects, getTaskCounts, readGoals } from "@/lib/storage";
import { CSSProperties } from "react";
import { GlobalAddTaskDialog } from "@/components/tasks/GlobalAddTaskDialog";
import { GlobalAddProjectDialog } from "@/components/projects/GlobalAddProjectDialog";
import { GlobalEditProjectDialog } from "@/components/projects/GlobalEditProjectDialog";
import { GlobalAddGoalDialog } from "@/components/goals/GlobalAddGoalDialog";

export default async function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/login");
    }

    const [projects, counts, goals] = await Promise.all([
        readProjects(session.user.id),
        getTaskCounts(session.user.id),
        readGoals(session.user.id)
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
            <AppSidebar projects={projects} user={session.user} counts={counts} goals={goals} />
            <GlobalAddTaskDialog projects={projects} />
            <GlobalAddProjectDialog goals={goals} />
            <GlobalEditProjectDialog goals={goals} />
            <GlobalAddGoalDialog />
            <SidebarInset>
                {children}
            </SidebarInset>
        </SidebarProvider>
    );
}

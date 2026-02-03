import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { readProjects } from "@/lib/storage";
import { CSSProperties } from "react";
import { GlobalAddTaskDialog } from "@/components/tasks/GlobalAddTaskDialog";

export default async function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const projects = await readProjects();

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
            <AppSidebar projects={projects} />
            <GlobalAddTaskDialog projects={projects} />
            <SidebarInset>
                {children}
            </SidebarInset>
        </SidebarProvider>
    );
}

"use client";

import {
	IconCalendar,
	IconCheck,
	IconClock,
	IconMap,
	IconPlus,
	IconSearch,
} from "@tabler/icons-react";
import { useSetAtom } from "jotai";
import { Activity, Archive, Flag, MoreHorizontal } from "lucide-react";
import { isAddGoalOpenAtom } from "@/components/features/goals/GlobalAddGoalDialog";
import { ModeToggle } from "@/components/layout/mode-toggle";
import { NavUser } from "@/components/layout/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInput,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
	goalToEditAtom,
	isAddProjectOpenAtom,
	projectToEditAtom,
} from "@/lib/atoms";
import type { Goal, Project } from "@/types";

const data = {
	navMain: [
		{
			title: "Today",
			url: "/",
			icon: IconClock,
			count: 5,
		},
		{
			title: "Upcoming",
			url: "/upcoming",
			icon: IconCalendar,
			count: 0,
		},
		{
			title: "Backlog",
			url: "/backlog",
			icon: Archive,
			count: 0,
		},
		{
			title: "Map",
			url: "/map",
			icon: IconMap,
		},
		{
			title: "Completed",
			url: "#",
			icon: IconCheck,
		},
		{
			title: "Events",
			url: "/events",
			icon: Activity,
		},
	],
};

interface AppSidebarProps {
	variant?: "sidebar" | "inset" | "floating";

	projects?: Project[];
	goals?: Goal[];
	selectedProjectId?: string | null;
	onSelectProject?: (projectId: string | null) => void;
	user: {
		name: string;
		email: string;
		image?: string | null;
	};
	counts: {
		backlogCount: number;
		todayCount: number;
		eventsCount?: number;
		projectCounts?: Record<string, number>;
	};
}

export function AppSidebar({
	variant = "sidebar",
	projects = [],
	goals = [],
	selectedProjectId,
	onSelectProject,
	user,
	counts,
}: AppSidebarProps) {
	const setAddProjectOpen = useSetAtom(isAddProjectOpenAtom);
	const setAddGoalOpen = useSetAtom(isAddGoalOpenAtom);
	const setProjectToEdit = useSetAtom(projectToEditAtom);
	const setGoalToEdit = useSetAtom(goalToEditAtom);

	const navMainWithCounts = data.navMain.map((item) => {
		if (item.title === "Backlog")
			return { ...item, count: counts?.backlogCount ?? 0 };
		if (item.title === "Today")
			return { ...item, count: counts?.todayCount ?? 0 };
		if (item.title === "Events")
			return { ...item, count: counts?.eventsCount ?? 0 };
		return item;
	});

	return (
		<Sidebar variant={variant}>
			<SidebarHeader className="flex flex-row items-center justify-between px-2 py-3">
				<div className="flex items-center gap-2 ml-1">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
						F
					</div>
					<span className="font-semibold text-lg">Focus</span>
				</div>
				<ModeToggle />
			</SidebarHeader>

			<SidebarContent>
				<div className="px-3 pb-3">
					<div className="relative">
						<IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
						<SidebarInput
							placeholder="Search"
							className="pl-8 bg-background/50"
						/>
					</div>
				</div>

				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{navMainWithCounts.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton asChild className="w-full justify-start">
										<a href={item.url} className="flex items-center gap-2">
											<item.icon className="h-4 w-4" />
											<span>{item.title}</span>
											{/* @ts-ignore */}
											{!!item.count && (
												<span className="ml-auto text-xs bg-secondary rounded-full px-2 py-0.5">
													{item.count}
												</span>
											)}
										</a>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				<SidebarGroup>
					<SidebarGroupLabel className="flex items-center justify-between px-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer">
						<a href="/map" className="flex items-center w-full">
							<span>Goals</span>
						</a>
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{goals.map((goal) => (
								<SidebarMenuItem key={goal.id}>
									<SidebarMenuButton asChild className="w-full justify-start">
										<a href={`/map`} className="flex items-center gap-2">
											<Flag className="h-4 w-4" style={{ color: goal.color }} />
											<span>{goal.name}</span>
										</a>
									</SidebarMenuButton>
									<SidebarMenuAction
										showOnHover
										onClick={() => setGoalToEdit(goal)}
									>
										<MoreHorizontal className="h-4 w-4" />
										<span className="sr-only">Edit Goal</span>
									</SidebarMenuAction>
								</SidebarMenuItem>
							))}
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									className="w-full justify-start text-muted-foreground cursor-pointer"
									onClick={() => setAddGoalOpen(true)}
								>
									<span className="flex items-center gap-2">
										<IconPlus className="h-4 w-4" />
										<span>Add goal</span>
									</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				<SidebarGroup>
					<SidebarGroupLabel
						asChild
						className="flex items-center justify-between px-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
					>
						<a
							href="/projects"
							className="flex items-center w-full cursor-pointer"
						>
							<span>My Projects</span>
						</a>
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{projects
								.filter((p) => p.kind === "project" && p.status === "working")
								.slice(0, 5)
								.map((project) => (
									<SidebarMenuItem key={project.id}>
										<SidebarMenuButton
											asChild
											className={`w-full justify-start ${selectedProjectId === project.id ? "bg-accent" : ""}`}
										>
											<a
												href={`/?project=${project.id}`}
												className="flex items-center gap-2 w-full"
											>
												<div
													className="h-2 w-2 rounded-full"
													style={{ backgroundColor: project.color }}
												/>
												<span>{project.name}</span>
											</a>
										</SidebarMenuButton>
										<SidebarMenuAction
											showOnHover
											onClick={() => setProjectToEdit(project)}
										>
											<MoreHorizontal className="h-4 w-4" />
											<span className="sr-only">Edit Project</span>
										</SidebarMenuAction>
									</SidebarMenuItem>
								))}
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									className="w-full justify-start text-muted-foreground cursor-pointer"
									onClick={() => setAddProjectOpen(true)}
								>
									<span className="flex items-center gap-2">
										<IconPlus className="h-4 w-4" />
										<span>Add project</span>
									</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter>
				<NavUser user={user} />
			</SidebarFooter>
		</Sidebar>
	);
}

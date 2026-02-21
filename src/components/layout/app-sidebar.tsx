"use client";

import {
	IconCalendar,
	IconCheck,
	IconClock,
	IconInbox,
	IconMap,
	IconPlus,
	IconSearch,
} from "@tabler/icons-react";
import { useSetAtom } from "jotai";
import { Activity, ChevronDown, Flag, MoreHorizontal } from "lucide-react";
import { isAddGoalOpenAtom } from "@/components/features/goals/GlobalAddGoalDialog";
import { ModeToggle } from "@/components/layout/mode-toggle";
import { NavUser } from "@/components/layout/nav-user";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
			title: "Inbox",
			url: "/",
			icon: IconInbox,
			count: 12,
		},
		{
			title: "Today",
			url: "/today",
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
		inboxCount: number;
		todayCount: number;
		eventsCount?: number;
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
		if (item.title === "Inbox")
			return { ...item, count: counts?.inboxCount ?? 0 };
		if (item.title === "Today")
			return { ...item, count: counts?.todayCount ?? 0 };
		if (item.title === "Events")
			return { ...item, count: counts?.eventsCount ?? 0 };
		return item;
	});

	return (
		<Sidebar variant={variant}>
			<SidebarHeader className="flex flex-row items-center justify-between px-2 py-3">
				<div className="flex items-center gap-2">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
						F
					</div>
					<span className="font-semibold">Focus</span>
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

				<Collapsible defaultOpen className="group/collapsible">
					<SidebarGroup>
						<SidebarGroupLabel
							asChild
							className="flex items-center justify-between px-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:opacity-0"
						>
							<CollapsibleTrigger>
								<span>Goals</span>
								<ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
							</CollapsibleTrigger>
						</SidebarGroupLabel>
						<CollapsibleContent>
							<SidebarGroupContent>
								<SidebarMenu>
									{goals.map((goal) => (
										<SidebarMenuItem key={goal.id}>
											<SidebarMenuButton
												asChild
												className="w-full justify-start"
											>
												<a href={`/map`} className="flex items-center gap-2">
													{/* For now link to map, or maybe filtering by goal later? User said displayed same way as projects list. */}
													{/* But what happens when you click? "Goal -> Project (s) -> Task (s)" hierarchy. */}
													{/* Maybe filter tasks by goal? Currently no page for Goal details. Map is the view. */}
													<Flag
														className="h-4 w-4"
														style={{ color: goal.color }}
													/>
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
						</CollapsibleContent>
					</SidebarGroup>
				</Collapsible>

				<Collapsible defaultOpen className="group/collapsible">
					<SidebarGroup>
						<SidebarGroupLabel
							asChild
							className="flex items-center justify-between px-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:opacity-0"
						>
							<CollapsibleTrigger>
								<span>My Projects</span>
								<ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
							</CollapsibleTrigger>
						</SidebarGroupLabel>
						<CollapsibleContent>
							<SidebarGroupContent>
								<SidebarMenu>
									{projects
										.filter((p) => !p.isFavorite)
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
						</CollapsibleContent>
					</SidebarGroup>
				</Collapsible>
			</SidebarContent>

			<SidebarFooter>
				<NavUser user={user} />
			</SidebarFooter>
		</Sidebar>
	);
}

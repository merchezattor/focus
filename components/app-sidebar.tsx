"use client"

import * as React from "react"
import {
  IconCalendar,
  IconCheck,
  IconClock,
  IconInbox,
  IconMap,
  IconPlus,
  IconSearch,
} from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarInput,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import type { Project, Goal } from "@/types"
import { ModeToggle } from "@/components/mode-toggle"
import { useSetAtom } from "jotai"
import { isAddProjectOpenAtom, projectToEditAtom } from "@/lib/atoms"
import { isAddGoalOpenAtom } from "@/components/goals/GlobalAddGoalDialog"
import { NavUser } from "@/components/nav-user"
import { Flag, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  ],
}

interface AppSidebarProps {
  variant?: "sidebar" | "inset" | "floating"

  projects?: Project[]
  goals?: Goal[]
  selectedProjectId?: string | null
  onSelectProject?: (projectId: string | null) => void
  user: {
    name: string
    email: string
    image?: string | null
  }
  counts: {
    inboxCount: number
    todayCount: number
  }
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
  const setAddProjectOpen = useSetAtom(isAddProjectOpenAtom)
  const setAddGoalOpen = useSetAtom(isAddGoalOpenAtom)
  const setProjectToEdit = useSetAtom(projectToEditAtom)
  const router = useRouter()

  const navMainWithCounts = data.navMain.map(item => {
    if (item.title === "Inbox") return { ...item, count: counts?.inboxCount ?? 0 }
    if (item.title === "Today") return { ...item, count: counts?.todayCount ?? 0 }
    return item
  })

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
                      {!!item.count && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {item.count}
                        </Badge>
                      )}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between px-2">
            <span>Goals</span>
          </SidebarGroupLabel>
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
                      <Flag className="h-4 w-4" style={{ color: goal.color }} />
                      <span>{goal.name}</span>
                    </a>
                  </SidebarMenuButton>
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
          <SidebarGroupLabel className="flex items-center justify-between px-2">
            <span>My Projects</span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {projects.filter(p => !p.isFavorite).map((project) => (
                <SidebarMenuItem key={project.id}>
                  <SidebarMenuButton
                    asChild
                    className={`w-full justify-start ${selectedProjectId === project.id ? 'bg-accent' : ''}`}
                  >
                    <a
                      href={`/?project=${project.id}`}
                      className="flex items-center gap-2 w-full"
                    >
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: project.color }} />
                      <span>{project.name}</span>
                    </a>
                  </SidebarMenuButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction showOnHover>
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">More</span>
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start">
                      <DropdownMenuItem onClick={() => setProjectToEdit(project)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        <span>Edit Project</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!confirm("Are you sure you want to delete this project?")) return;

                          try {
                            const res = await fetch(`/api/projects?id=${project.id}`, { method: 'DELETE' });
                            if (!res.ok) throw new Error("Failed to delete");
                            toast.success("Project deleted");
                            router.refresh();
                            router.push('/');
                          } catch (err) {
                            toast.error("Failed to delete project");
                            console.error(err);
                          }
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete Project</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
  )
}

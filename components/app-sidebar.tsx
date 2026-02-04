"use client"

import * as React from "react"
import {
  IconCalendar,
  IconCheck,
  IconClock,
  IconFilter,
  IconInbox,
  IconPlus,
  IconSearch,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
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
  SidebarInput,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import type { Project } from "@/types"
import { ModeToggle } from "@/components/mode-toggle"
import { useSetAtom } from "jotai"
import { isAddTaskOpenAtom, isAddProjectOpenAtom } from "@/lib/atoms"
import { NavUser } from "@/components/nav-user"

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
      title: "Filters & Labels",
      url: "#",
      icon: IconFilter,
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
  selectedProjectId,
  onSelectProject,
  user,
  counts,
}: AppSidebarProps) {
  const setAddTaskOpen = useSetAtom(isAddTaskOpenAtom)
  const setAddProjectOpen = useSetAtom(isAddProjectOpenAtom)

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
          <Button
            className="w-full justify-start gap-2 bg-primary hover:bg-primary/90"
            size="sm"
            onClick={() => setAddTaskOpen(true)}
          >
            <IconPlus className="h-4 w-4" />
            Add task
          </Button>
        </div>

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
            <span>Favorites</span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {projects.filter(p => p.isFavorite).map((project) => (
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
                </SidebarMenuItem>
              ))}
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

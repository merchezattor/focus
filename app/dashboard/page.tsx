import { DashboardClient } from "./DashboardClient"
import { readTasks, readProjects } from "@/lib/storage"

export const dynamic = 'force-dynamic'

export default async function Page() {
  const [tasks, projects] = await Promise.all([
    readTasks(),
    readProjects(),
  ])

  return (
    <DashboardClient initialTasks={tasks} initialProjects={projects} />
  )
}

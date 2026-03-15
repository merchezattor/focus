"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SegmentedProgress } from "@/components/ui/segmented-progress";
import type { ProjectStat } from "@/lib/storage";

export interface FocusProjectsCardProps {
	projects: ProjectStat[];
}

export function FocusProjectsCard({ projects }: FocusProjectsCardProps) {
	const router = useRouter();

	const handleProjectClick = (projectId: string) => {
		router.push(`/?project=${projectId}`);
	};

	if (projects.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Projects</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-12 w-12 mb-4 opacity-50"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
							/>
						</svg>
						<p className="text-sm font-medium">No active projects</p>
						<p className="text-xs mt-1">Create a project to get started</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	const formatCount = (count: number, label: string) => {
		return `${count} ${label}${count !== 1 ? "s" : ""}`;
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Projects</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="max-h-[400px] overflow-y-auto space-y-3">
					{projects.map((project) => (
						<button
							type="button"
							key={project.projectId}
							onClick={() => handleProjectClick(project.projectId)}
							className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
						>
							<div className="flex items-center gap-2 mb-2">
								<span
									className="w-3 h-3 rounded-full flex-shrink-0"
									style={{ backgroundColor: project.color }}
								/>
								<span className="font-medium text-sm truncate">
									{project.name}
								</span>
							</div>

							<SegmentedProgress
								done={project.doneCount}
								inProgress={project.inProgressCount}
								backlog={project.backlogCount}
								className="mb-2"
							/>

							<div className="text-xs text-muted-foreground">
								{project.doneCount > 0 &&
									formatCount(project.doneCount, "done")}
								{project.doneCount > 0 &&
									(project.inProgressCount > 0 || project.backlogCount > 0) &&
									", "}
								{project.inProgressCount > 0 &&
									formatCount(project.inProgressCount, "in progress")}
								{project.inProgressCount > 0 &&
									project.backlogCount > 0 &&
									", "}
								{project.backlogCount > 0 &&
									formatCount(project.backlogCount, "backlog")}
								{project.totalCount === 0 && "No tasks"}
							</div>
						</button>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

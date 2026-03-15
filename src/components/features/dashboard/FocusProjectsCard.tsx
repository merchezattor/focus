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
			<Card className="h-full">
				<CardHeader className="p-3 pb-0">
					<CardTitle className="text-sm">Projects</CardTitle>
				</CardHeader>
				<CardContent className="p-3 pt-2">
					<div className="flex flex-col items-center justify-center py-2 text-muted-foreground">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-6 w-6 mb-1 opacity-50"
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
						<p className="text-xs font-medium">No active projects</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	const formatCountWithPercent = (
		count: number,
		total: number,
		singularLabel: string,
		pluralLabel?: string,
	) => {
		if (count === 0) return null;
		const percent = total > 0 ? Math.round((count / total) * 100) : 0;
		const label =
			count === 1 ? singularLabel : pluralLabel || `${singularLabel}s`;
		return `${count} ${label} (${percent}%)`;
	};

	return (
		<Card className="h-full">
			<CardHeader className="p-3 pb-0">
				<CardTitle className="text-sm">Projects</CardTitle>
			</CardHeader>
			<CardContent className="p-3 pt-2">
				<div className="max-h-[280px] overflow-y-auto space-y-1">
					{projects.map((project) => (
						<button
							type="button"
							key={project.projectId}
							onClick={() => handleProjectClick(project.projectId)}
							className="w-full text-left px-2 py-1.5 rounded hover:bg-muted/50 transition-colors cursor-pointer"
						>
							<div className="flex items-center gap-1.5 mb-1">
								<span
									className="w-2 h-2 rounded-full flex-shrink-0"
									style={{ backgroundColor: project.color }}
								/>
								<span className="font-medium text-xs truncate">
									{project.name}
								</span>
							</div>

							<SegmentedProgress
								done={project.doneCount}
								inProgress={project.inProgressCount}
								backlog={project.backlogCount}
								className="mb-1"
							/>

							<div className="text-[10px] text-muted-foreground leading-tight">
								{[
									formatCountWithPercent(
										project.doneCount,
										project.totalCount,
										"done",
										"done",
									),
									formatCountWithPercent(
										project.inProgressCount,
										project.totalCount,
										"in progress",
										"in progress",
									),
									formatCountWithPercent(
										project.backlogCount,
										project.totalCount,
										"backlog",
										"backlog",
									),
								]
									.filter(Boolean)
									.join(" • ") || "No tasks"}
							</div>
						</button>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

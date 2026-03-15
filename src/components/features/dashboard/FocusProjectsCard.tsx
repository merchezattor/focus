"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
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
			<CardContent className="p-3">
				<div className="max-h-[280px] overflow-y-auto space-y-2">
					{projects.map((project) => (
						<button
							type="button"
							key={project.projectId}
							onClick={() => handleProjectClick(project.projectId)}
							className="w-full text-left py-1 cursor-pointer block"
						>
							<div className="flex items-center gap-1.5 mb-0.5">
								<span
									className="w-2 h-2 rounded-full flex-shrink-0"
									style={{ backgroundColor: project.color }}
								/>
								<span className="font-medium text-sm">{project.name}</span>
							</div>

							<SegmentedProgress
								done={project.doneCount}
								inProgress={project.inProgressCount}
								backlog={project.backlogCount}
								className="mb-0.5"
							/>

							<div className="text-[11px] text-muted-foreground">
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

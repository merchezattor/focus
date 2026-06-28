"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { SegmentedProgress } from "@/components/ui/segmented-progress";
import type { ProjectStat } from "@/lib/storage";

export interface FocusProjectsCardProps {
	projects: ProjectStat[];
}

const priorityOrder = { p1: 1, p2: 2, p3: 3, p4: 4 };

const priorityConfig = {
	p1: { label: "P1", className: "text-muted-foreground" },
	p2: { label: "P2", className: "text-muted-foreground" },
	p3: { label: "P3", className: "text-muted-foreground" },
	p4: { label: "P4", className: "text-muted-foreground" },
};

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

	const topProjects = projects
		.slice()
		.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
		.slice(0, 3);

	return (
		<Card className="h-full">
			<CardContent className="px-4 py-2">
				<div className="max-h-[280px] overflow-y-auto space-y-1">
					{topProjects.map((project) => {
						const priority = priorityConfig[project.priority];
						return (
							<button
								type="button"
								key={project.projectId}
								onClick={() => handleProjectClick(project.projectId)}
								className="w-full text-left py-1 px-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer block"
							>
								<div className="flex items-center gap-1.5 mb-1">
									<span
										className="w-2 h-2 rounded-full flex-shrink-0"
										style={{ backgroundColor: project.color }}
									/>
									<span className="font-medium text-sm truncate flex-1">
										{project.name}
									</span>
									<span
										className={`text-[9px] px-1 py-0.5 rounded font-semibold ${priority.className}`}
									>
										{priority.label}
									</span>
								</div>

								<SegmentedProgress
									done={project.doneCount}
									inProgress={project.inProgressCount}
									backlog={project.backlogCount}
									className="mb-1"
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
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}

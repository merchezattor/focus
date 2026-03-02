"use client";

import { useSetAtom } from "jotai";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { projectToEditAtom } from "@/lib/atoms";
import { cn } from "@/lib/utils";
import type { Project } from "@/types";

interface ProjectItemProps {
	project: Project;
}

export function ProjectItem({ project }: ProjectItemProps) {
	const setProjectToEdit = useSetAtom(projectToEditAtom);
	const router = useRouter();

	return (
		<div
			className={cn(
				"group flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-all text-left border",
				"hover:bg-accent/50 cursor-pointer",
				project.status === "archived" && "opacity-50",
			)}
			onClick={() => router.push(`/?project=${project.id}`)}
		>
			<div className="flex items-center gap-3">
				<div
					className="w-3 h-3 rounded-full shrink-0"
					style={{ backgroundColor: project.color }}
				/>
				<div className="flex-1 min-w-0 flex flex-col justify-center">
					<div className="flex items-center gap-2">
						<span className={cn("text-sm font-medium line-clamp-1")}>
							{project.name}
						</span>
						{project.isFavorite && (
							<span className="text-yellow-500 text-xs">★</span>
						)}
					</div>
					{project.description && (
						<div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
							{project.description}
						</div>
					)}
				</div>
			</div>

			<div className="flex items-center gap-2 shrink-0">
				<Badge
					variant="secondary"
					className="capitalize text-[10px] h-5 px-1.5 text-muted-foreground"
				>
					{project.viewType}
				</Badge>
				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
					onClick={(e) => {
						e.stopPropagation();
						setProjectToEdit(project);
					}}
				>
					<Pencil className="h-3 w-3 text-muted-foreground" />
					<span className="sr-only">Edit Project</span>
				</Button>
			</div>
		</div>
	);
}

"use client";

import { useAtom, useSetAtom } from "jotai";
import { useRouter, useSearchParams } from "next/navigation";
import { AddTaskDialog } from "@/components/tasks/AddTaskDialog";
import { isAddTaskOpenAtom, tasksAtom } from "@/lib/atoms";
import type { Project } from "@/types";

export function GlobalAddTaskDialog({ projects }: { projects: Project[] }) {
	const [isOpen, setIsOpen] = useAtom(isAddTaskOpenAtom);
	const setTasks = useSetAtom(tasksAtom);
	const router = useRouter();
	const searchParams = useSearchParams();

	// Get project ID from URL if present
	const defaultProjectId = searchParams.get("project") || undefined;

	return (
		<AddTaskDialog
			open={isOpen}
			onOpenChange={setIsOpen}
			projects={projects}
			defaultProjectId={defaultProjectId}
			onOptimisticAdd={(task) => setTasks((prev) => [task, ...prev])}
			onTaskCreated={() => {
				router.refresh();
			}}
			trigger={null}
		/>
	);
}

"use client";

import { useAtom } from "jotai";
import { isAddGoalOpenAtom } from "@/lib/atoms";
import { AddGoalDialog } from "./AddGoalDialog";

export function GlobalAddGoalDialog() {
	const [isOpen, setIsOpen] = useAtom(isAddGoalOpenAtom);

	return <AddGoalDialog open={isOpen} onOpenChange={setIsOpen} />;
}
// Wait, AddGoalDialog is handling its own state internally with trigger.
// We need to change AddGoalDialog to be controlled like AddProjectDialog.
// Let's modify AddGoalDialog first.

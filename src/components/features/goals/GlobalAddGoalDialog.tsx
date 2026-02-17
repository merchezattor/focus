"use client";

import { atom, useAtom } from "jotai";
import { AddGoalDialog } from "@/components/features/goals/AddGoalDialog";

// We need a new atom for Goal Dialog state.
// Ideally this should be in lib/atoms.ts but for now I can define it here or import if I add it to atoms.
// Let's create the atom in lib/atoms.ts first?
// Or I can just put it here if not used elsewhere, but Global implies used elsewhere.
// Let's verify lib/atoms.ts

export const isAddGoalOpenAtom = atom(false);

export function GlobalAddGoalDialog() {
	const [isOpen, setIsOpen] = useAtom(isAddGoalOpenAtom);

	return <AddGoalDialog open={isOpen} onOpenChange={setIsOpen} />;
}
// Wait, AddGoalDialog is handling its own state internally with trigger.
// We need to change AddGoalDialog to be controlled like AddProjectDialog.
// Let's modify AddGoalDialog first.

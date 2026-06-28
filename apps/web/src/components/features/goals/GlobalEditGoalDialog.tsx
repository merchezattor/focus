"use client";

import { useAtom } from "jotai";
import { goalToEditAtom } from "@/lib/atoms";
import { AddGoalDialog } from "./AddGoalDialog";

export function GlobalEditGoalDialog() {
	const [goalToEdit, setGoalToEdit] = useAtom(goalToEditAtom);

	return (
		<AddGoalDialog
			open={!!goalToEdit}
			onOpenChange={(open) => {
				if (!open) setGoalToEdit(null);
			}}
			goalToEdit={goalToEdit}
		/>
	);
}

"use client";

import { useAtom } from "jotai";
import { milestoneToEditAtom } from "@/lib/atoms";
import { AddMilestoneDialog } from "./AddMilestoneDialog";

export function GlobalEditMilestoneDialog() {
	const [milestoneToEdit, setMilestoneToEdit] = useAtom(milestoneToEditAtom);

	return (
		<AddMilestoneDialog
			open={!!milestoneToEdit}
			onOpenChange={(open) => {
				if (!open) setMilestoneToEdit(null);
			}}
			milestoneToEdit={milestoneToEdit}
		/>
	);
}

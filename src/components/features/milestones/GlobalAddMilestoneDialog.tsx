"use client";

import { useAtom } from "jotai";
import { isAddMilestoneOpenAtom } from "@/lib/atoms";
import { AddMilestoneDialog } from "./AddMilestoneDialog";

export function GlobalAddMilestoneDialog() {
	const [isOpen, setIsOpen] = useAtom(isAddMilestoneOpenAtom);

	return <AddMilestoneDialog open={isOpen} onOpenChange={setIsOpen} />;
}

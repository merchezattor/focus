"use client";

import { format } from "date-fns";
import {
	Calendar as CalendarIcon,
	Milestone as MilestoneIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Milestone } from "@/types";

interface AddMilestoneDialogProps {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	trigger?: React.ReactNode;
	milestoneToEdit?: Milestone | null;
}

export function AddMilestoneDialog({
	open: controlledOpen,
	onOpenChange,
	trigger,
	milestoneToEdit,
}: AddMilestoneDialogProps) {
	const router = useRouter();
	const [internalOpen, setInternalOpen] = useState(false);
	const isControlled = controlledOpen !== undefined;
	const open = isControlled ? controlledOpen : internalOpen;
	const setOpen = isControlled ? onOpenChange! : setInternalOpen;

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (!open) return;

		if (milestoneToEdit) {
			setTitle(milestoneToEdit.title);
			setDescription(milestoneToEdit.description || "");
			setTargetDate(new Date(milestoneToEdit.targetDate));
			return;
		}

		setTitle("");
		setDescription("");
		setTargetDate(undefined);
	}, [milestoneToEdit, open]);

	const resetForm = () => {
		setTitle("");
		setDescription("");
		setTargetDate(undefined);
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!targetDate) {
			toast.error("Target date is required");
			return;
		}

		setIsLoading(true);

		try {
			const response = await fetch("/api/milestones", {
				method: milestoneToEdit ? "PUT" : "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...(milestoneToEdit ? { id: milestoneToEdit.id } : {}),
					title,
					description: description || undefined,
					targetDate: targetDate.toISOString(),
				}),
			});

			if (!response.ok) {
				throw new Error(
					milestoneToEdit
						? "Failed to update milestone"
						: "Failed to create milestone",
				);
			}

			toast.success(
				milestoneToEdit ? "Milestone updated" : "Milestone created",
			);
			setOpen(false);
			resetForm();
			router.refresh();
		} catch (error) {
			console.error(error);
			toast.error(
				milestoneToEdit
					? "Failed to update milestone"
					: "Failed to create milestone",
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			{trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
			<DialogContent>
				<DialogTitle>
					{milestoneToEdit ? "Edit Milestone" : "Add Milestone"}
				</DialogTitle>
				<DialogDescription className="sr-only">
					{milestoneToEdit
						? "Update an existing milestone"
						: "Create a new milestone"}
				</DialogDescription>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<label className="text-sm font-medium" htmlFor="milestone-title">
							Title
						</label>
						<Input
							id="milestone-title"
							placeholder="Promotion to Staff Engineer"
							value={title}
							onChange={(event) => setTitle(event.target.value)}
							required
						/>
					</div>

					<div className="space-y-2">
						<label
							className="text-sm font-medium"
							htmlFor="milestone-description"
						>
							Description
						</label>
						<Textarea
							id="milestone-description"
							placeholder="Context for why this milestone matters"
							value={description}
							onChange={(event) => setDescription(event.target.value)}
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Target Date</label>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									type="button"
									variant="outline"
									className={cn(
										"w-full justify-start text-left font-normal",
										!targetDate && "text-muted-foreground",
									)}
								>
									<CalendarIcon className="mr-2 h-4 w-4" />
									{targetDate ? format(targetDate, "PPP") : "Pick a date"}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="start">
								<Calendar
									mode="single"
									selected={targetDate}
									onSelect={setTargetDate}
									initialFocus
								/>
							</PopoverContent>
						</Popover>
					</div>

					<div className="flex justify-end gap-2">
						<Button
							type="button"
							variant="ghost"
							onClick={() => setOpen(false)}
							disabled={isLoading}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isLoading} className="gap-2">
							<MilestoneIcon className="h-4 w-4" />
							{milestoneToEdit ? "Save Changes" : "Create Milestone"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

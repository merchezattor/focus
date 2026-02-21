"use client";

import { format } from "date-fns";
import { Calendar as CalendarIcon, Flag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Goal } from "@/types";

// Usually better to let server handle ID or use a library.
// For Create Project we generated ID on server or client?
// Let's use simple fetch to an API route for creating goal.
// We need to implement API route for goals too.

const priorities = [
	{ value: "p1", label: "Priority 1", color: "#ef4444" }, // Red
	{ value: "p2", label: "Priority 2", color: "#f97316" }, // Orange
	{ value: "p3", label: "Priority 3", color: "#3b82f6" }, // Blue
	{ value: "p4", label: "Priority 4", color: "#6b7280" }, // Grey
];

const colors = [
	{ name: "Berry Red", value: "#b8256f" },
	{ name: "Red", value: "#db4035" },
	{ name: "Orange", value: "#ff9933" },
	{ name: "Yellow", value: "#fad000" },
	{ name: "Olive Green", value: "#afb83b" },
	{ name: "Lime Green", value: "#7ecc49" },
	{ name: "Green", value: "#299438" },
	{ name: "Mint Green", value: "#6accbc" },
	{ name: "Teal", value: "#158fad" },
	{ name: "Sky Blue", value: "#14aaf5" },
	{ name: "Light Blue", value: "#96c3eb" },
	{ name: "Blue", value: "#4073ff" },
	{ name: "Grape", value: "#884dff" },
	{ name: "Violet", value: "#af38eb" },
	{ name: "Lavender", value: "#eb96eb" },
	{ name: "Magenta", value: "#e05194" },
	{ name: "Salmon", value: "#ff8d85" },
	{ name: "Charcoal", value: "#808080" },
	{ name: "Grey", value: "#b8b8b8" },
	{ name: "Taupe", value: "#ccac93" },
];

interface AddGoalDialogProps {
	children?: React.ReactNode;
	trigger?: React.ReactNode; // standardized prop name
	onGoalCreated?: () => void;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

export function AddGoalDialog({
	children,
	trigger,
	onGoalCreated,
	open: controlledOpen,
	onOpenChange,
	goalToEdit,
}: AddGoalDialogProps & { goalToEdit?: Goal | null }) {
	const router = useRouter();
	const [internalOpen, setInternalOpen] = useState(false);

	const isControlled = controlledOpen !== undefined;
	const open = isControlled ? controlledOpen : internalOpen;
	const setOpen = isControlled ? onOpenChange! : setInternalOpen;

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [color, setColor] = useState(colors[0].value);
	const [priority, setPriority] = useState("p1");
	const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
	const [isLoading, setIsLoading] = useState(false);
	const [isPending, startTransition] = useTransition();

	useEffect(() => {
		if (open) {
			if (goalToEdit) {
				setName(goalToEdit.name);
				setDescription(goalToEdit.description || "");
				setColor(goalToEdit.color);
				setPriority(goalToEdit.priority || "p1");
				setDueDate(
					goalToEdit.dueDate ? new Date(goalToEdit.dueDate) : undefined,
				);
			} else {
				setName("");
				setDescription("");
				setColor(colors[0].value);
				setPriority("p1");
				setDueDate(undefined);
			}
		}
	}, [open, goalToEdit]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			if (goalToEdit) {
				const res = await fetch("/api/goals", {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						id: goalToEdit.id,
						name,
						description,
						color,
						priority,
						dueDate: dueDate?.toISOString(),
					}),
				});

				if (!res.ok) throw new Error("Failed to update goal");
				toast.success("Goal updated");
			} else {
				const res = await fetch("/api/goals", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						name,
						description,
						color,
						priority,
						dueDate: dueDate?.toISOString(),
					}),
				});

				if (!res.ok) throw new Error("Failed to create goal");
				toast.success("Goal created");
			}

			setOpen(false);
			setName("");
			setDescription("");
			setDueDate(undefined);
			setPriority("p1");
			setColor(colors[0].value);
			if (!goalToEdit) onGoalCreated?.();
			router.refresh();
		} catch (error) {
			toast.error(
				goalToEdit ? "Failed to update goal" : "Failed to create goal",
			);
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			{(trigger || children) && (
				<DialogTrigger asChild>{trigger || children}</DialogTrigger>
			)}
			<DialogContent>
				<DialogTitle>{goalToEdit ? "Edit Goal" : "Add Goal"}</DialogTitle>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<label className="text-sm font-medium">Name</label>
						<Input
							placeholder="Goal Name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Description</label>
						<Textarea
							placeholder="Description (optional)"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Due Date</label>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									className={cn(
										"w-full pl-3 text-left font-normal",
										!dueDate && "text-muted-foreground",
									)}
								>
									{dueDate ? (
										format(dueDate, "PPP")
									) : (
										<span>Pick a due date</span>
									)}
									<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="start">
								<Calendar
									mode="single"
									selected={dueDate}
									onSelect={setDueDate}
									initialFocus
								/>
							</PopoverContent>
						</Popover>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Priority</label>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									className="w-full justify-start font-normal"
								>
									<Flag
										className="mr-2 h-4 w-4"
										style={{
											color: priorities.find((p) => p.value === priority)
												?.color,
										}}
									/>
									{priorities.find((p) => p.value === priority)?.label}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
								{priorities.map((p) => (
									<DropdownMenuItem
										key={p.value}
										onClick={() => setPriority(p.value)}
									>
										<Flag className="mr-2 h-4 w-4" style={{ color: p.color }} />
										{p.label}
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Color</label>
						<div className="flex flex-wrap gap-2">
							{colors.map((c) => (
								<button
									key={c.value}
									type="button"
									className={cn(
										"w-6 h-6 rounded-full border-2 transition-all",
										color === c.value ? "border-primary" : "border-transparent",
									)}
									style={{ backgroundColor: c.value }}
									onClick={() => setColor(c.value)}
									title={c.name}
								/>
							))}
						</div>
					</div>

					<div className="flex justify-between items-center pt-4">
						{goalToEdit ? (
							<Button
								type="button"
								variant="destructive"
								onClick={async () => {
									if (!confirm("Are you sure you want to delete this goal?"))
										return;

									try {
										setIsLoading(true);
										startTransition(async () => {
											const res = await fetch(
												`/api/goals?id=${goalToEdit.id}`,
												{
													method: "DELETE",
												},
											);
											if (!res.ok) throw new Error("Failed to delete goal");
											toast.success("Goal deleted");
											setOpen(false);
											router.refresh();
											router.push("/");
										});
									} catch (err) {
										toast.error("Failed to delete goal");
										console.error(err);
									} finally {
										setIsLoading(false);
									}
								}}
								disabled={isLoading || isPending}
							>
								Delete
							</Button>
						) : (
							<div />
						)}
						<div className="flex gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => setOpen(false)}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isLoading || isPending || !name}>
								{isLoading || isPending
									? "Saving..."
									: goalToEdit
										? "Save"
										: "Create Goal"}
							</Button>
						</div>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

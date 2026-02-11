"use client";

import { format } from "date-fns";
import {
	AlarmClock,
	Calendar as CalendarIcon,
	Flag,
	Inbox,
	MoreHorizontal,
	Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
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
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
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
import type { Project } from "@/types";

const priorities = [
	{ value: "p1", label: "Priority 1", color: "#ef4444" }, // Red
	{ value: "p2", label: "Priority 2", color: "#f97316" }, // Orange
	{ value: "p3", label: "Priority 3", color: "#3b82f6" }, // Blue
	{ value: "p4", label: "Priority 4", color: "#6b7280" }, // Grey
];

const createTaskSchema = z.object({
	title: z.string().min(1, "Title is required"),
	description: z.string().optional(),
	projectId: z.string().optional(),
	dueDate: z.string().optional(),
	planDate: z.string().optional(),
});

interface AddTaskDialogProps {
	projects: Project[];
	onTaskCreated: () => void;
	onOptimisticAdd?: (task: any) => void;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	trigger?: React.ReactNode;
	defaultProjectId?: string;
}

export function AddTaskDialog({
	projects,
	onTaskCreated,
	onOptimisticAdd,
	open: controlledOpen,
	onOpenChange,
	trigger,
	defaultProjectId,
}: AddTaskDialogProps) {
	const router = useRouter();
	const [internalOpen, setInternalOpen] = useState(false);
	const isControlled = controlledOpen !== undefined;
	const isOpen = isControlled ? controlledOpen : internalOpen;
	const setIsOpen = isControlled ? onOpenChange! : setInternalOpen;
	const open = isOpen;
	const setOpen = setIsOpen;

	// Sync state when opening
	useEffect(() => {
		if (open) {
			setProjectId(defaultProjectId || "");
		}
	}, [open, defaultProjectId]);

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [projectId, setProjectId] = useState(defaultProjectId || "");
	const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
	const [priority, setPriority] = useState("p4");
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const result = createTaskSchema.safeParse({
			title,
			description: description || undefined,
			projectId: projectId || undefined,
			dueDate: dueDate?.toISOString(),
		});

		if (!result.success) {
			toast.error(result.error.issues[0].message);
			return;
		}

		// Optimistic Update
		if (onOptimisticAdd) {
			const tempTask = {
				id: `temp-${Date.now()}`,
				title,
				description: description || undefined,
				projectId: projectId && projectId !== "inbox" ? projectId : null,
				priority,
				dueDate: dueDate?.toISOString(),
				completed: false,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				planDate: null,
				comments: [],
			};
			onOptimisticAdd(tempTask);

			// Close immediately for smooth UX
			setOpen(false);
			resetForm();
			toast.success("Task added");
		} else {
			setIsLoading(true);
		}

		try {
			const res = await fetch("/api/tasks", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title,
					description: description || undefined,
					projectId: projectId && projectId !== "inbox" ? projectId : null,
					dueDate: dueDate?.toISOString(),
					completed: false,
					priority,
				}),
			});

			if (!res.ok) throw new Error("Failed to create task");

			if (!onOptimisticAdd) {
				toast.success("Task created successfully");
				setOpen(false);
				resetForm();
			}

			onTaskCreated();
			router.refresh();
		} catch (error) {
			if (onOptimisticAdd) {
				toast.error("Failed to sync task. Please refresh.");
				//Ideally we revert here, but for MVP just alerting is okay.
			} else {
				toast.error("Failed to create task");
			}
			console.error("Failed to create task:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const resetForm = () => {
		setTitle("");
		setDescription("");
		setProjectId(defaultProjectId || "");
		setDueDate(undefined);
		setPriority("p4");
	};

	const handleOpenChange = (newOpen: boolean) => {
		setOpen(newOpen);
		if (!newOpen) {
			// Optional: reset form on close? Maybe not for better UX if accidentally closed.
		}
	};

	const selectedProject = projects.find((p) => p.id === projectId);

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			{trigger !== null && (
				<DialogTrigger asChild>
					{trigger ? (
						trigger
					) : (
						<Button className="gap-2">
							<Plus className="h-4 w-4" />
							Add task
						</Button>
					)}
				</DialogTrigger>
			)}
			<DialogContent
				showCloseButton={false}
				className="sm:max-w-[550px] p-0 gap-0 overflow-hidden border-none shadow-xl"
			>
				<DialogTitle className="sr-only">Add New Task</DialogTitle>
				<form onSubmit={handleSubmit} className="flex flex-col">
					<div className="p-4 space-y-2">
						<Input
							placeholder="Task name"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							className="border-none shadow-none text-xl font-bold px-0 focus-visible:ring-0 placeholder:font-bold"
							autoFocus
						/>
						<Textarea
							placeholder="Description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							className="min-h-[50px] border-none shadow-none resize-none px-0 focus-visible:ring-0 text-muted-foreground text-sm"
						/>

						<div className="flex items-center gap-2 pt-2">
							{/* Due Date */}
							<Popover>
								<PopoverTrigger asChild>
									<Button
										type="button"
										variant="outline"
										size="sm"
										className={cn(
											"h-8 rounded-md px-2 text-xs font-normal border-dashed border-muted-foreground/30 hover:bg-muted/50",
											dueDate &&
												"text-primary border-primary/30 bg-primary/5 border-solid",
										)}
									>
										<CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
										{dueDate ? format(dueDate, "MMM d") : "Today"}
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

							{/* Priority */}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										type="button"
										variant="outline"
										size="sm"
										className={cn(
											"h-8 rounded-md px-2 text-xs font-normal border-dashed border-muted-foreground/30 hover:bg-muted/50",
											priority !== "p4" && "border-solid",
										)}
									>
										<Flag
											className={cn(
												"mr-1.5 h-3.5 w-3.5",
												priorities.find((p) => p.value === priority)?.color
													? ""
													: "text-muted-foreground",
											)}
											style={{
												color: priorities.find((p) => p.value === priority)
													?.color,
											}}
										/>
										{priority === "p4"
											? "Priority"
											: priorities.find((p) => p.value === priority)?.label}
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="start">
									{priorities.map((p) => (
										<DropdownMenuItem
											key={p.value}
											onClick={() => setPriority(p.value)}
										>
											<Flag
												className="mr-2 h-4 w-4"
												style={{ color: p.color }}
											/>
											{p.label}
										</DropdownMenuItem>
									))}
								</DropdownMenuContent>
							</DropdownMenu>

							{/* Reminders (Visual Only) */}
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="h-8 rounded-md px-2 text-xs font-normal border-dashed border-muted-foreground/30 hover:bg-muted/50 text-muted-foreground"
								disabled
							>
								<AlarmClock className="mr-1.5 h-3.5 w-3.5" />
								Reminders
							</Button>

							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="h-8 w-8 ml-auto text-muted-foreground hover:text-foreground"
							>
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</div>
					</div>

					<div className="border-t p-3 bg-muted/5 flex items-center justify-between">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									className="h-8 gap-2 border-transparent bg-transparent shadow-none hover:bg-muted/50 px-2 text-xs font-medium text-muted-foreground hover:text-foreground focus:ring-0"
								>
									{selectedProject ? (
										<>
											<span
												className="w-2 h-2 rounded-full"
												style={{ backgroundColor: selectedProject.color }}
											/>
											{selectedProject.name}
										</>
									) : (
										<>
											<Inbox className="h-3.5 w-3.5" />
											Inbox
										</>
									)}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="start" className="z-[100]">
								<DropdownMenuItem onClick={() => setProjectId("inbox")}>
									<div className="flex items-center gap-2">
										<Inbox className="h-4 w-4 text-muted-foreground" />
										Inbox
									</div>
								</DropdownMenuItem>

								{projects.some((p) => p.isFavorite) && (
									<DropdownMenuGroup>
										<DropdownMenuLabel>Favorites</DropdownMenuLabel>
										{projects
											.filter((p) => p.isFavorite)
											.map((project) => (
												<DropdownMenuItem
													key={project.id}
													onClick={() => setProjectId(project.id)}
												>
													<div className="flex items-center gap-2">
														<span
															className="w-2 h-2 rounded-full"
															style={{ backgroundColor: project.color }}
														/>
														{project.name}
													</div>
												</DropdownMenuItem>
											))}
									</DropdownMenuGroup>
								)}

								<DropdownMenuGroup>
									<DropdownMenuLabel>My Projects</DropdownMenuLabel>
									{projects
										.filter((p) => !p.isFavorite)
										.map((project) => (
											<DropdownMenuItem
												key={project.id}
												onClick={() => setProjectId(project.id)}
											>
												<div className="flex items-center gap-2">
													<span
														className="w-2 h-2 rounded-full"
														style={{ backgroundColor: project.color }}
													/>
													{project.name}
												</div>
											</DropdownMenuItem>
										))}
								</DropdownMenuGroup>
							</DropdownMenuContent>
						</DropdownMenu>

						<div className="flex items-center gap-2">
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => setOpen(false)}
								className="h-8 font-medium"
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={!title.trim() || isLoading}
								size="sm"
								className="h-8 px-4 font-medium bg-primary hover:bg-primary/90"
							>
								{isLoading ? "Adding..." : "Add task"}
							</Button>
						</div>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

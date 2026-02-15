"use client";

import { format } from "date-fns";
import {
	Calendar as CalendarIcon,
	CheckCircle,
	Flag,
	MoreHorizontal,
	Send,
	Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Comment, Project, Task } from "@/types";

const priorities = [
	{ value: "p1", label: "Priority 1", color: "#ef4444" }, // Red
	{ value: "p2", label: "Priority 2", color: "#f97316" }, // Orange
	{ value: "p3", label: "Priority 3", color: "#3b82f6" }, // Blue
	{ value: "p4", label: "Priority 4", color: "#6b7280" }, // Grey
];

interface EditTaskDialogProps {
	task: Task;
	projects: Project[];
	onTaskUpdated: () => void;
	trigger?: React.ReactNode;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

export function EditTaskDialog({
	task,
	projects,
	onTaskUpdated,
	trigger,
	open: controlledOpen,
	onOpenChange,
}: EditTaskDialogProps) {
	const router = useRouter();
	const [internalOpen, setInternalOpen] = useState(false);

	const isControlled = controlledOpen !== undefined;
	const open = isControlled ? controlledOpen : internalOpen;
	const setOpen = isControlled ? onOpenChange! : setInternalOpen;

	const [title, setTitle] = useState(task.title);
	const [description, setDescription] = useState(task.description || "");
	const [projectId, setProjectId] = useState(task.projectId || "");
	const [dueDate, setDueDate] = useState<Date | undefined>(
		task.dueDate ? new Date(task.dueDate) : undefined,
	);
	const [planDate, setPlanDate] = useState<Date | undefined>(
		task.planDate ? new Date(task.planDate) : undefined,
	);
	const [priority, setPriority] = useState<string>(task.priority || "p4");
	const [comment, setComment] = useState("");

	// Optimistic state for comments
	const [optimisticComments, setOptimisticComments] = useState<Comment[]>(
		task.comments || [],
	);

	useEffect(() => {
		if (open) {
			setTitle(task.title);
			setDescription(task.description || "");
			setProjectId(task.projectId || "");
			setProjectId(task.projectId || "");
			setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
			setPlanDate(task.planDate ? new Date(task.planDate) : undefined);
			setPriority(task.priority || "p4");
			setComment("");
			setOptimisticComments(task.comments || []);
		}
	}, [open, task]);

	const saveChanges = async (
		updates: {
			title?: string;
			description?: string;
			projectId?: string | null;
			dueDate?: string | null;
			planDate?: string | null;
			priority?: string;
		} = {},
	) => {
		try {
			// Filter out unchanged values
			const payload: any = {};
			let hasChanges = false;

			if (updates.title !== undefined && updates.title !== task.title) {
				payload.title = updates.title;
				hasChanges = true;
			}
			if (
				updates.description !== undefined &&
				updates.description !== task.description
			) {
				payload.description = updates.description;
				hasChanges = true;
			}
			if (
				updates.projectId !== undefined &&
				updates.projectId !== task.projectId
			) {
				payload.projectId = updates.projectId;
				hasChanges = true;
			}
			if (
				updates.priority !== undefined &&
				updates.priority !== task.priority
			) {
				payload.priority = updates.priority;
				hasChanges = true;
			}

			// Date handling - compare ISO strings or nulls
			if (updates.dueDate !== undefined) {
				const newDue = updates.dueDate;
				const oldDue = task.dueDate
					? new Date(task.dueDate).toISOString()
					: null;
				if (newDue !== oldDue) {
					payload.dueDate = newDue;
					hasChanges = true;
				}
			}

			if (updates.planDate !== undefined) {
				const newPlan = updates.planDate;
				const oldPlan = task.planDate
					? new Date(task.planDate).toISOString()
					: null;
				if (newPlan !== oldPlan) {
					payload.planDate = newPlan;
					hasChanges = true;
				}
			}

			if (!hasChanges) return;

			const res = await fetch(`/api/tasks/${task.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (!res.ok) throw new Error("Failed to update task");

			onTaskUpdated();
			router.refresh();
		} catch (error) {
			console.error("Failed to update task:", error);
		}
	};

	const handleAddComment = async () => {
		if (!comment.trim()) return;

		const newComment: Comment = {
			id: crypto.randomUUID(),
			content: comment,
			postedAt: new Date(),
		};

		// Update local state immediately
		const updatedComments = [...optimisticComments, newComment];
		setOptimisticComments(updatedComments);
		setComment("");

		try {
			const res = await fetch(`/api/tasks/${task.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					comments: updatedComments,
				}),
			});

			if (!res.ok) {
				// Revert on failure
				setOptimisticComments(task.comments || []);
				throw new Error("Failed to add comment");
			}

			onTaskUpdated();
			router.refresh();
		} catch (error) {
			console.error("Failed to add comment:", error);
			// Revert optimism if needed (already handled above for non-ok response)
			setOptimisticComments(task.comments || []);
		}
	};

	const handleDeleteComment = async (commentId: string) => {
		// Optimistic update
		const previousComments = [...optimisticComments];
		const updatedComments = optimisticComments.filter(
			(c) => c.id !== commentId,
		);
		setOptimisticComments(updatedComments);

		try {
			const res = await fetch(`/api/tasks/${task.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					comments: updatedComments,
				}),
			});

			if (!res.ok) {
				setOptimisticComments(previousComments);
				throw new Error("Failed to delete comment");
			}

			onTaskUpdated();
			router.refresh();
		} catch (error) {
			console.error("Failed to delete comment:", error);
			setOptimisticComments(previousComments);
		}
	};

	const handleDelete = async () => {
		try {
			const res = await fetch(`/api/tasks/${task.id}`, {
				method: "DELETE",
			});

			if (!res.ok) throw new Error("Failed to delete task");

			setOpen(false);
			onTaskUpdated();
			router.refresh();
		} catch (error) {
			console.error("Failed to delete task:", error);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className="sm:max-w-4xl h-[600px] flex flex-col p-0 gap-0">
				<DialogTitle className="sr-only">Edit Task</DialogTitle>
				<div className="flex flex-1 h-full overflow-hidden">
					{/* Left Column: Main Content */}
					<div className="flex-1 flex flex-col p-6 border-r overflow-y-auto">
						<div className="space-y-4 flex-1">
							<Input
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								onBlur={() => saveChanges({ title })}
								className="text-xl font-bold border-none px-0 focus-visible:ring-0 shadow-none"
								placeholder="Task title"
							/>
							<Textarea
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								onBlur={() => saveChanges({ description })}
								className="min-h-[100px] resize-none border-none px-0 focus-visible:ring-0 shadow-none text-muted-foreground"
								placeholder="Description..."
							/>
						</div>

						<div className="mt-8">
							<h3 className="text-sm font-medium mb-4 flex items-center gap-2 text-muted-foreground">
								Comments{" "}
								{optimisticComments.length
									? `(${optimisticComments.length})`
									: ""}
							</h3>

							<div className="space-y-6 mb-8">
								{optimisticComments.map((comment) => (
									<div key={comment.id} className="flex gap-3 text-sm group">
										<div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs shrink-0">
											U
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center justify-between gap-2">
												<div className="flex gap-2 items-center">
													<span className="font-semibold">User</span>
													<span className="text-xs text-muted-foreground">
														{format(new Date(comment.postedAt), "MMM d, p")}
													</span>
												</div>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
														>
															<MoreHorizontal className="h-4 w-4 text-muted-foreground" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem
															className="text-destructive focus:text-destructive"
															onClick={() => handleDeleteComment(comment.id)}
														>
															<Trash2 className="mr-2 h-4 w-4" />
															Delete
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</div>
											<p className="mt-1 break-words">{comment.content}</p>
										</div>
									</div>
								))}
							</div>

							<div className="flex gap-2">
								<div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs shrink-0">
									U
								</div>
								<div className="flex-1 border rounded-lg p-2 focus-within:ring-1 focus-within:ring-ring">
									<Textarea
										placeholder="Comment"
										className="min-h-[40px] border-none p-0 resize-none focus-visible:ring-0 shadow-none text-sm mb-2"
										value={comment}
										onChange={(e) => setComment(e.target.value)}
									/>
									<div className="flex justify-between items-center">
										<div className="flex gap-1">
											{/* Rich text icons placeholders */}
										</div>
										<div className="flex gap-2">
											<Button
												size="sm"
												variant="ghost"
												onClick={() => setComment("")}
											>
												Cancel
											</Button>
											<Button
												size="sm"
												disabled={!comment.trim()}
												onClick={handleAddComment}
											>
												<Send className="h-3 w-3 mr-2" />
												Comment
											</Button>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Right Column: Metadata */}
					<div className="w-[300px] bg-muted/10 p-4 space-y-6 overflow-y-auto">
						<div className="space-y-4">
							<div className="space-y-1">
								<label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
									Project
								</label>
								<Select
									value={projectId}
									onValueChange={(val) => {
										setProjectId(val);
										saveChanges({ projectId: val });
									}}
								>
									<SelectTrigger className="border-none shadow-none hover:bg-muted/50 p-2 h-auto">
										<SelectValue placeholder="Project" />
									</SelectTrigger>
									<SelectContent className="z-[100]" position="popper">
										{projects.map((project) => (
											<SelectItem key={project.id} value={project.id}>
												<div className="flex items-center gap-2">
													<span
														className="w-2 h-2 rounded-full"
														style={{ backgroundColor: project.color }}
													/>
													{project.name}
												</div>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-1">
								<label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
									Due Date
								</label>
								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant="ghost"
											className={`w-full justify-start text-left p-2 h-auto hover:bg-muted/50 font-normal ${!dueDate && "text-muted-foreground"}`}
										>
											<CalendarIcon className="mr-2 h-4 w-4" />
											{dueDate ? format(dueDate, "PPP") : "No due date"}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="start">
										<Calendar
											mode="single"
											selected={dueDate}
											onSelect={(date) => {
												setDueDate(date);
												saveChanges({
													dueDate: date ? date.toISOString() : null,
												});
											}}
											initialFocus
										/>
									</PopoverContent>
								</Popover>
							</div>

							<div className="space-y-1">
								<label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
									Plan Date
								</label>
								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant="ghost"
											className={`w-full justify-start text-left p-2 h-auto hover:bg-muted/50 font-normal ${!planDate && "text-muted-foreground"}`}
										>
											<CalendarIcon className="mr-2 h-4 w-4" />
											{planDate ? format(planDate, "PPP") : "No plan date"}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0 z-[100]" align="start">
										<Calendar
											mode="single"
											selected={planDate}
											onSelect={(date) => {
												setPlanDate(date);
												saveChanges({
													planDate: date ? date.toISOString() : null,
												});
											}}
											initialFocus
										/>
									</PopoverContent>
								</Popover>
							</div>

							<div className="space-y-1">
								<label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
									Priority
								</label>
								<Select
									value={priority}
									onValueChange={(val) => {
										setPriority(val);
										saveChanges({ priority: val });
									}}
								>
									<SelectTrigger className="border-none shadow-none hover:bg-muted/50 p-2 h-auto">
										<div className="flex items-center gap-2">
											<Flag
												className="h-4 w-4"
												style={{
													color: priorities.find((p) => p.value === priority)
														?.color,
												}}
											/>
											{priorities.find((p) => p.value === priority)?.label}
										</div>
									</SelectTrigger>
									<SelectContent className="z-[100]" position="popper">
										{priorities.map((p) => (
											<SelectItem key={p.value} value={p.value}>
												<div className="flex items-center gap-2">
													<Flag
														className="h-4 w-4"
														style={{ color: p.color }}
													/>
													{p.label}
												</div>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="pt-4 border-t space-y-4">
							<Button
								variant="ghost"
								size="lg"
								className="w-full justify-start bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 font-medium h-12 rounded-xl"
								onClick={async () => {
									try {
										const res = await fetch(`/api/tasks/${task.id}`, {
											method: "PATCH",
											headers: { "Content-Type": "application/json" },
											body: JSON.stringify({ completed: true }),
										});
										if (!res.ok) throw new Error("Failed to complete task");
										setOpen(false);
										onTaskUpdated();
										router.refresh();
									} catch (error) {
										console.error("Failed to complete task:", error);
									}
								}}
							>
								<CheckCircle className="h-5 w-5 mr-3" />
								Complete
							</Button>

							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button
										variant="ghost"
										size="sm"
										className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
									>
										<Trash2 className="h-4 w-4 mr-2" />
										Delete task
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Delete Task</AlertDialogTitle>
										<AlertDialogDescription>
											Are you sure you want to delete this task? This action
											cannot be undone.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Cancel</AlertDialogCancel>
										<AlertDialogAction onClick={handleDelete}>
											Delete
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

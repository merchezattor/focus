"use client";

import { format } from "date-fns";
import { Calendar, CheckCircle2, Flag, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	KanbanBoard,
	KanbanBoardCard,
	KanbanBoardCardDescription,
	type KanbanBoardCircleColor,
	KanbanBoardColumn,
	KanbanBoardColumnHeader,
	KanbanBoardColumnList,
	KanbanBoardColumnListItem,
	KanbanBoardColumnTitle,
	KanbanBoardExtraMargin,
	KanbanBoardProvider,
	KanbanColorCircle,
} from "@/components/features/kanban";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

interface LinkKanbanProps {
	tasks: Task[];
	onTaskUpdate?: (
		taskId: string,
		updates: Partial<Task>,
	) => Promise<void> | void;
	onTaskClick?: (task: Task) => void;
}

type ColumnType = {
	id: string; // 'todo' | 'in_progress' | 'done'
	title: string;
	color: KanbanBoardCircleColor;
	items: Task[];
};

const INITIAL_COLUMNS: Omit<ColumnType, "items">[] = [
	{ id: "todo", title: "To Do", color: "blue" },
	{ id: "in_progress", title: "In Progress", color: "yellow" },
	{ id: "review", title: "Review", color: "purple" },
	{ id: "done", title: "Done", color: "green" },
];

const DONE_VISIBILITY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function getDoneReferenceDate(task: Task): Date {
	return new Date(task.completedAt ?? task.updatedAt ?? task.createdAt);
}

function shouldShowRecentDone(task: Task): boolean {
	return (
		Date.now() - getDoneReferenceDate(task).getTime() <=
		DONE_VISIBILITY_WINDOW_MS
	);
}

function buildColumns(tasks: Task[]): ColumnType[] {
	return INITIAL_COLUMNS.map((col) => ({
		...col,
		items: tasks.filter((task) => {
			const status = task.status || "todo";
			if (status !== col.id) {
				return false;
			}

			if (col.id !== "done") {
				return true;
			}

			return shouldShowRecentDone(task);
		}),
	}));
}

export function LinkKanban({
	tasks,
	onTaskUpdate,
	onTaskClick,
}: LinkKanbanProps) {
	const [columns, setColumns] = useState<ColumnType[]>(() =>
		buildColumns(tasks),
	);

	useEffect(() => {
		setColumns(buildColumns(tasks));
	}, [tasks]);

	const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
		// Optimistic update handled by local state, but we also notify parent
		if (onTaskUpdate) {
			onTaskUpdate(taskId, updates);
		} else {
			// Fallback if no parent handler (though currently required for sync)
			try {
				await fetch(`/api/tasks/${taskId}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(updates),
				});
			} catch {
				toast.error("Failed to update task");
			}
		}
	};

	return (
		<div className="h-full w-full overflow-x-auto p-4">
			<KanbanBoardProvider>
				<KanbanBoardContainer
					columns={columns}
					setColumns={setColumns}
					onTaskUpdate={handleTaskUpdate}
					onTaskClick={onTaskClick}
				/>
			</KanbanBoardProvider>
		</div>
	);
}

function KanbanBoardContainer({
	columns,
	setColumns,
	onTaskUpdate,
	onTaskClick,
}: {
	columns: ColumnType[];
	setColumns: React.Dispatch<React.SetStateAction<ColumnType[]>>;
	onTaskUpdate: (id: string, updates: Partial<Task>) => Promise<void> | void;
	onTaskClick?: (task: Task) => void;
}) {
	function handleMoveCardToColumn(columnId: string, index: number, card: Task) {
		const nextStatus = columnId as Task["status"];
		const statusChanged = card.status !== nextStatus;
		const nextCompletedAt =
			statusChanged && nextStatus === "done"
				? new Date()
				: nextStatus !== "done"
					? null
					: (card.completedAt ?? null);

		// 1. Update local state for immediate feedback
		setColumns((previousColumns) =>
			previousColumns.map((column) => {
				if (column.id === columnId) {
					const updatedItems = column.items.filter(({ id }) => id !== card.id);
					return {
						...column,
						items: [
							...updatedItems.slice(0, index),
							{
								...card,
								status: nextStatus,
								completedAt: nextCompletedAt,
							},
							...updatedItems.slice(index),
						],
					};
				} else {
					return {
						...column,
						items: column.items.filter(({ id }) => id !== card.id),
					};
				}
			}),
		);

		// 2. Trigger API update
		if (statusChanged) {
			onTaskUpdate(card.id, { status: nextStatus });
		}
	}

	return (
		<KanbanBoard>
			{columns.map((col) => (
				<KanbanBoardColumn
					key={col.id}
					columnId={col.id}
					onDropOverColumn={(data) => {
						try {
							const card = JSON.parse(data) as Task;
							handleMoveCardToColumn(col.id, col.items.length, card);
						} catch {} // Ignore JSON parse errors
					}}
				>
					<KanbanBoardColumnHeader>
						<KanbanBoardColumnTitle columnId={col.id}>
							<KanbanColorCircle color={col.color} />
							{col.title} ({col.items.length})
						</KanbanBoardColumnTitle>
					</KanbanBoardColumnHeader>
					<KanbanBoardColumnList>
						{col.items.map((task) => (
							<KanbanBoardColumnListItem
								key={task.id}
								cardId={task.id}
								onDropOverListItem={(data, direction) => {
									try {
										const card = JSON.parse(data) as Task;
										const cardIndex = col.items.findIndex(
											({ id }) => id === task.id,
										);
										const baseIndex =
											direction === "top" ? cardIndex : cardIndex + 1;
										const targetIndex = baseIndex;

										handleMoveCardToColumn(col.id, targetIndex, card);
									} catch {}
								}}
							>
								<KanbanBoardCard
									data={task}
									onClick={() => onTaskClick?.(task)}
									className="gap-2"
								>
									<KanbanBoardCardDescription className="text-sm font-medium">
										{task.title}
									</KanbanBoardCardDescription>

									<div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
										{/* Priority */}
										<div
											className={cn("flex items-center gap-1", {
												"text-red-500": task.priority === "p1",
												"text-orange-500": task.priority === "p2",
												"text-blue-500": task.priority === "p3",
											})}
										>
											<Flag className="w-3 h-3 fill-current" />
											<span>{task.priority.toUpperCase()}</span>
										</div>

										{/* Due Date */}
										{task.dueDate && (
											<div className="flex items-center gap-1">
												<Calendar className="w-3 h-3" />
												<span>{format(new Date(task.dueDate), "MMM d")}</span>
											</div>
										)}

										{/* Plan Date (if different from due date or explicitly requested) */}
										{task.planDate && (
											<div className="flex items-center gap-1 text-purple-500">
												<Calendar className="w-3 h-3" />
												<span>
													Plan: {format(new Date(task.planDate), "MMM d")}
												</span>
											</div>
										)}

										{/* Comments */}
										{task.comments && task.comments.length > 0 && (
											<div className="flex items-center gap-1">
												<MessageSquare className="w-3 h-3" />
												<span>{task.comments.length}</span>
											</div>
										)}

										{task.status === "done" && (
											<div className="flex items-center gap-1 text-emerald-600">
												<CheckCircle2 className="w-3 h-3" />
												<span>
													{format(getDoneReferenceDate(task), "MMM d")}
												</span>
											</div>
										)}
									</div>
								</KanbanBoardCard>
							</KanbanBoardColumnListItem>
						))}
					</KanbanBoardColumnList>
				</KanbanBoardColumn>
			))}
			<KanbanBoardExtraMargin />
		</KanbanBoard>
	);
}

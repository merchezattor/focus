"use client";

import { format } from "date-fns";
import { Calendar, Flag, MessageSquare } from "lucide-react";
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
	onTaskUpdate?: (taskId: string, newStatus: string) => void;
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

export function LinkKanban({
	tasks,
	onTaskUpdate,
	onTaskClick,
}: LinkKanbanProps) {
	const [columns, setColumns] = useState<ColumnType[]>(() => {
		return INITIAL_COLUMNS.map((col) => ({
			...col,
			items: tasks.filter((t) => (t.status || "todo") === col.id),
		}));
	});

	useEffect(() => {
		const newColumns = INITIAL_COLUMNS.map((col) => ({
			...col,
			items: tasks.filter((t) => (t.status || "todo") === col.id),
		}));
		setColumns(newColumns);
	}, [tasks]);

	const handleTaskUpdate = async (taskId: string, newStatus: string) => {
		// Optimistic update handled by local state, but we also notify parent
		if (onTaskUpdate) {
			onTaskUpdate(taskId, newStatus);
		} else {
			// Fallback if no parent handler (though currently required for sync)
			try {
				await fetch(`/api/tasks`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ id: taskId, status: newStatus }),
				});
			} catch {
				toast.error("Failed to update task status");
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
	onTaskUpdate: (id: string, status: string) => void;
	onTaskClick?: (task: Task) => void;
}) {
	function handleMoveCardToColumn(columnId: string, index: number, card: Task) {
		// 1. Update local state for immediate feedback
		setColumns((previousColumns) =>
			previousColumns.map((column) => {
				if (column.id === columnId) {
					const updatedItems = column.items.filter(({ id }) => id !== card.id);
					return {
						...column,
						items: [
							...updatedItems.slice(0, index),
							{ ...card, status: columnId as Task["status"] }, // Update status locally
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
		if (card.status !== columnId) {
			onTaskUpdate(card.id, columnId);
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
							{col.title}
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

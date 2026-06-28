"use client";

import { format, startOfDay } from "date-fns";
import {
	Archive,
	Calendar,
	ChevronDown,
	ChevronRight,
	MoreHorizontal,
	Pencil,
	Play,
	Trash2,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { DataTableColumnHeader } from "@/components/niko-table/components/data-table-column-header";
import { DataTableColumnSortMenu } from "@/components/niko-table/components/data-table-column-sort";
import { DataTableColumnTitle } from "@/components/niko-table/components/data-table-column-title";
import { DataTableFacetedFilter } from "@/components/niko-table/components/data-table-faceted-filter";
import { DataTableFilterMenu } from "@/components/niko-table/components/data-table-filter-menu";
import { DataTablePagination } from "@/components/niko-table/components/data-table-pagination";
import { DataTableSearchFilter } from "@/components/niko-table/components/data-table-search-filter";
import { DataTableSortMenu } from "@/components/niko-table/components/data-table-sort-menu";
import { DataTableToolbarSection } from "@/components/niko-table/components/data-table-toolbar-section";
import { DataTableViewMenu } from "@/components/niko-table/components/data-table-view-menu";
import { DataTable } from "@/components/niko-table/core/data-table";
import { DataTableRoot } from "@/components/niko-table/core/data-table-root";
import {
	DataTableBody,
	DataTableEmptyBody,
	DataTableHeader,
} from "@/components/niko-table/core/data-table-structure";
import { SYSTEM_COLUMN_IDS } from "@/components/niko-table/lib/constants";
import type { DataTableColumnDef } from "@/components/niko-table/types";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Project, Task } from "@/types";

interface BacklogTableProps {
	tasks: Task[];
	projects: Map<string, Project>;
	onEdit: (task: Task) => void;
	onTaskUpdated?: () => void;
}

const priorityOptions = [
	{ label: "Priority 1", value: "p1" },
	{ label: "Priority 2", value: "p2" },
	{ label: "Priority 3", value: "p3" },
	{ label: "Priority 4", value: "p4" },
];

const priorityStyles: Record<string, { label: string; color: string }> = {
	p1: { label: "P1", color: "bg-red-500/20 text-red-500" },
	p2: { label: "P2", color: "bg-orange-500/20 text-orange-500" },
	p3: { label: "P3", color: "bg-blue-500/20 text-blue-500" },
	p4: { label: "P4", color: "bg-gray-500/20 text-gray-500" },
};

export function BacklogTable({
	tasks,
	projects,
	onEdit,
	onTaskUpdated,
}: BacklogTableProps) {
	const [deleteTask, setDeleteTask] = useState<Task | null>(null);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	const projectOptions = useMemo(() => {
		const taskProjectIds = new Set(
			tasks.map((t) => t.projectId).filter(Boolean),
		);
		const options = Array.from(projects.values())
			.filter((p) => taskProjectIds.has(p.id))
			.map((p) => ({
				label: p.name,
				value: p.id,
			}));
		// Add "No project" option for filtering tasks without a project
		if (tasks.some((t) => !t.projectId)) {
			options.unshift({ label: "No project", value: "__no_project__" });
		}
		return options;
	}, [projects, tasks]);

	const handleStartWork = useCallback(
		async (task: Task) => {
			try {
				const res = await fetch(`/api/tasks/${task.id}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ status: "todo" }),
				});
				if (!res.ok) throw new Error("Failed to start work");
				onTaskUpdated?.();
			} catch (error) {
				console.error("Failed to start work:", error);
			}
		},
		[onTaskUpdated],
	);

	const handlePlanForToday = useCallback(
		async (task: Task) => {
			try {
				const today = startOfDay(new Date()).toISOString();
				const res = await fetch(`/api/tasks/${task.id}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ planDate: today }),
				});
				if (!res.ok) throw new Error("Failed to plan for today");
				onTaskUpdated?.();
			} catch (error) {
				console.error("Failed to plan for today:", error);
			}
		},
		[onTaskUpdated],
	);

	const handleArchive = useCallback(
		async (task: Task) => {
			try {
				const res = await fetch(`/api/tasks/${task.id}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ status: "archived" }),
				});
				if (!res.ok) throw new Error("Failed to archive task");
				onTaskUpdated?.();
			} catch (error) {
				console.error("Failed to archive task:", error);
			}
		},
		[onTaskUpdated],
	);

	const handleDelete = useCallback(async () => {
		if (!deleteTask) return;
		try {
			const res = await fetch(`/api/tasks/${deleteTask.id}`, {
				method: "DELETE",
			});
			if (!res.ok) throw new Error("Failed to delete task");
			setDeleteDialogOpen(false);
			setDeleteTask(null);
			onTaskUpdated?.();
		} catch (error) {
			console.error("Failed to delete task:", error);
		}
	}, [deleteTask, onTaskUpdated]);

	const openDeleteDialog = useCallback((task: Task) => {
		setDeleteTask(task);
		setDeleteDialogOpen(true);
	}, []);

	type BacklogRow = Task;

	const columns: DataTableColumnDef<BacklogRow>[] = useMemo(
		() => [
			{
				id: SYSTEM_COLUMN_IDS.EXPAND,
				header: () => null,
				cell: ({ row }) => {
					if (!row.getCanExpand()) return null;
					return (
						<Button
							variant="ghost"
							size="sm"
							className="h-6 w-6 p-0"
							onClick={row.getToggleExpandedHandler()}
						>
							{row.getIsExpanded() ? (
								<ChevronDown className="h-4 w-4" />
							) : (
								<ChevronRight className="h-4 w-4" />
							)}
						</Button>
					);
				},
				size: 40,
				enableSorting: false,
				enableHiding: false,
				meta: {
					expandedContent: (task: Task) => (
						<div className="bg-muted/30 px-4 py-3">
							{task.description ? (
								<p className="text-sm text-muted-foreground">
									{task.description}
								</p>
							) : (
								<p className="text-sm text-muted-foreground italic">
									No description
								</p>
							)}
						</div>
					),
				},
			},
			{
				accessorKey: "title",
				header: () => (
					<DataTableColumnHeader>
						<DataTableColumnTitle />
						<DataTableColumnSortMenu />
					</DataTableColumnHeader>
				),
				meta: {
					label: "Title",
					variant: "text",
				},
				enableColumnFilter: true,
				enableHiding: true,
				cell: ({ row }) => (
					<button
						type="button"
						className="text-left cursor-pointer hover:underline text-sm font-medium w-full"
						onClick={() => onEdit(row.original)}
					>
						{row.original.title}
					</button>
				),
			},
			{
				accessorKey: "projectId",
				header: () => (
					<DataTableColumnHeader>
						<DataTableColumnTitle />
						<DataTableColumnSortMenu />
					</DataTableColumnHeader>
				),
				meta: {
					label: "Project",
					variant: "select",
					options: projectOptions,
					mergeStrategy: "augment",
					dynamicCounts: true,
					showCounts: true,
				},
				enableColumnFilter: true,
				enableHiding: true,
				filterFn: (row, columnId, filterValue) => {
					const value = row.getValue(columnId) as string | null;

					if (
						typeof filterValue === "object" &&
						filterValue !== null &&
						"value" in filterValue &&
						"operator" in filterValue
					) {
						const filter = filterValue as { value: string; operator: string };
						if (filter.value === "__no_project__") {
							return value === null || value === undefined;
						}
						return value === filter.value;
					}

					if (filterValue === "__no_project__") {
						return value === null || value === undefined;
					}
					return value === filterValue;
				},
				cell: ({ row }) => {
					const projectId = row.original.projectId;
					if (!projectId)
						return <span className="text-xs text-muted-foreground">—</span>;
					const project = projects.get(projectId);
					if (!project) return null;
					return (
						<div className="flex items-center gap-2">
							<span
								className="w-2 h-2 rounded-full shrink-0"
								style={{ backgroundColor: project.color || "#ccc" }}
							/>
							<span className="text-xs truncate max-w-[120px]">
								{project.name}
							</span>
						</div>
					);
				},
			},
			{
				accessorKey: "priority",
				header: () => (
					<DataTableColumnHeader>
						<DataTableColumnTitle />
						<DataTableColumnSortMenu />
					</DataTableColumnHeader>
				),
				meta: {
					label: "Priority",
					variant: "select",
					options: priorityOptions,
					dynamicCounts: true,
					showCounts: true,
				},
				enableColumnFilter: true,
				enableHiding: true,
				cell: ({ row }) => {
					const p = priorityStyles[row.original.priority] || priorityStyles.p4;
					return (
						<Badge variant="outline" className={`border-none ${p.color}`}>
							{p.label}
						</Badge>
					);
				},
			},
			{
				accessorKey: "dueDate",
				header: () => (
					<DataTableColumnHeader>
						<DataTableColumnTitle />
						<DataTableColumnSortMenu />
					</DataTableColumnHeader>
				),
				meta: {
					label: "Due date",
					variant: "date",
				},
				enableColumnFilter: true,
				enableHiding: true,
				cell: ({ row }) => {
					const dueDate = row.original.dueDate;
					if (!dueDate)
						return <span className="text-xs text-muted-foreground">—</span>;
					return (
						<span className="text-xs text-muted-foreground">
							{format(new Date(dueDate), "MMM d, yyyy")}
						</span>
					);
				},
			},
			{
				accessorKey: "createdAt",
				header: () => (
					<DataTableColumnHeader>
						<DataTableColumnTitle />
						<DataTableColumnSortMenu />
					</DataTableColumnHeader>
				),
				meta: {
					label: "Created",
					variant: "date",
				},
				enableColumnFilter: true,
				enableHiding: true,
				cell: ({ row }) => (
					<span className="text-xs text-muted-foreground">
						{format(new Date(row.original.createdAt), "MMM d, yyyy")}
					</span>
				),
			},
			{
				id: "actions",
				header: () => <div className="text-right">Actions</div>,
				cell: ({ row }) => {
					const task = row.original;
					return (
						<div className="flex justify-end">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" className="h-8 w-8 p-0">
										<MoreHorizontal className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem
										onClick={() => onEdit(task)}
										className="hover:bg-accent hover:text-accent-foreground cursor-pointer"
									>
										<Pencil className="mr-2 h-4 w-4" />
										Edit
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => handleStartWork(task)}
										disabled={!task.projectId}
										className="hover:bg-accent hover:text-accent-foreground cursor-pointer"
									>
										<Play className="mr-2 h-4 w-4" />
										To work
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => handlePlanForToday(task)}
										className="hover:bg-accent hover:text-accent-foreground cursor-pointer"
									>
										<Calendar className="mr-2 h-4 w-4" />
										For Today
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => handleArchive(task)}
										className="hover:bg-accent hover:text-accent-foreground cursor-pointer"
									>
										<Archive className="mr-2 h-4 w-4" />
										Archive
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={() => openDeleteDialog(task)}
										className="text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
									>
										<Trash2 className="mr-2 h-4 w-4" />
										Delete
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					);
				},
				enableSorting: false,
				enableHiding: false,
				size: 80,
			},
		],
		[
			onEdit,
			projectOptions,
			projects,
			handleStartWork,
			handlePlanForToday,
			handleArchive,
			openDeleteDialog,
		],
	);

	return (
		<>
			<DataTableRoot
				data={tasks}
				columns={columns}
				config={{
					enablePagination: true,
					enableSorting: true,
					enableMultiSort: true,
					enableFilters: true,
					enableExpanding: true,
				}}
				getRowCanExpand={() => true}
			>
				<DataTableToolbarSection>
					<DataTableToolbarSection className="px-0">
						<DataTableSearchFilter placeholder="Search backlog..." />
						<DataTableViewMenu />
					</DataTableToolbarSection>
					<DataTableToolbarSection className="px-0">
						<DataTableFacetedFilter
							accessorKey="projectId"
							title="Project"
							options={projectOptions}
							limitToFilteredRows={false}
						/>
						<DataTableFacetedFilter
							accessorKey="priority"
							title="Priority"
							options={priorityOptions}
						/>
						<DataTableSortMenu className="ml-auto" />
						<DataTableFilterMenu
							autoOptions
							dynamicCounts
							showCounts
							mergeStrategy="augment"
						/>
					</DataTableToolbarSection>
				</DataTableToolbarSection>

				<DataTable>
					<DataTableHeader />
					<DataTableBody>
						<DataTableEmptyBody />
					</DataTableBody>
				</DataTable>

				<DataTablePagination />
			</DataTableRoot>

			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Task</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete &quot;{deleteTask?.title}&quot;?
							This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setDeleteTask(null)}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

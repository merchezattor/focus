"use client";

import { format } from "date-fns";
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
import type { DataTableColumnDef } from "@/components/niko-table/types";
import { Badge } from "@/components/ui/badge";
import type { Project, Task } from "@/types";

interface BacklogTableProps {
	tasks: Task[];
	projects: Map<string, Project>;
	onEdit: (task: Task) => void;
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

export function BacklogTable({ tasks, projects, onEdit }: BacklogTableProps) {
	// Build project options for filter from current data
	const projectOptions = Array.from(projects.values()).map((p) => ({
		label: p.name,
		value: p.id,
	}));

	// Flatten tasks so projectId is filterable and augment with projectName for display
	const data = tasks.map((t) => ({
		...t,
		projectName: t.projectId
			? (projects.get(t.projectId)?.name ?? "Unknown")
			: "Inbox",
	}));

	type BacklogRow = (typeof data)[number];

	const columns: DataTableColumnDef<BacklogRow>[] = [
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
			cell: ({ row }) => {
				const projectId = row.original.projectId;
				if (!projectId)
					return <span className="text-muted-foreground text-xs">Inbox</span>;
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
			accessorKey: "createdAt",
			header: () => (
				<DataTableColumnHeader>
					<DataTableColumnTitle />
					<DataTableColumnSortMenu />
				</DataTableColumnHeader>
			),
			meta: {
				label: "Added",
				variant: "date",
			},
			enableColumnFilter: true,
			cell: ({ row }) => (
				<span className="text-xs text-muted-foreground">
					{format(new Date(row.original.createdAt), "MMM d, yyyy")}
				</span>
			),
		},
	];

	return (
		<DataTableRoot
			data={data}
			columns={columns}
			config={{
				enablePagination: true,
				enableSorting: true,
				enableMultiSort: true,
				enableFilters: true,
			}}
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
	);
}

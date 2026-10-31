"use client";

import { useSetAtom } from "jotai";
import {
	ChevronDown,
	ChevronRight,
	ExternalLink,
	MoreHorizontal,
	Pencil,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { projectToEditAtom } from "@/lib/atoms";
import type { Project } from "@/types";

interface ProjectsTableProps {
	projects: Project[];
}

const kindOptions = [
	{ label: "Project", value: "project" },
	{ label: "Group", value: "group" },
];

// Rank order is the display order. Alphabetical would put Archived first.
const STATUS_RANK: Record<string, number> = {
	working: 0,
	frozen: 1,
	complete: 2,
	archived: 3,
};

const statusOptions = [
	{ label: "Working", value: "working" },
	{ label: "Frozen", value: "frozen" },
	{ label: "Complete", value: "complete" },
	{ label: "Archived", value: "archived" },
];

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

const DEFAULT_SORTING = [
	{ id: "status", desc: false },
	{ id: "name", desc: false },
];

function sortableHeader() {
	return (
		<DataTableColumnHeader>
			<DataTableColumnTitle />
			<DataTableColumnSortMenu />
		</DataTableColumnHeader>
	);
}

export function ProjectsTable({ projects }: ProjectsTableProps) {
	const setProjectToEdit = useSetAtom(projectToEditAtom);
	const router = useRouter();

	const columns: DataTableColumnDef<Project>[] = useMemo(
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
							<span className="sr-only">Toggle description</span>
						</Button>
					);
				},
				size: 40,
				enableSorting: false,
				enableHiding: false,
				meta: {
					expandedContent: (project: Project) => (
						<div className="bg-muted/30 px-4 py-3">
							{project.description ? (
								<p className="text-sm text-muted-foreground">
									{project.description}
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
				accessorKey: "name",
				header: sortableHeader,
				meta: { label: "Name", variant: "text" },
				enableColumnFilter: true,
				enableHiding: false,
				cell: ({ row }) => (
					<button
						type="button"
						className="flex items-center gap-2 text-left cursor-pointer hover:underline text-sm font-medium w-full"
						onClick={() => router.push(`/?project=${row.original.id}`)}
					>
						<span
							className="w-3 h-3 rounded-full shrink-0"
							style={{ backgroundColor: row.original.color }}
						/>
						<span className="line-clamp-1">{row.original.name}</span>
					</button>
				),
			},
			{
				accessorKey: "kind",
				enableGlobalFilter: false,
				header: sortableHeader,
				meta: {
					label: "Kind",
					variant: "select",
					options: kindOptions,
					dynamicCounts: true,
					showCounts: true,
				},
				enableColumnFilter: true,
				enableHiding: true,
				cell: ({ row }) => (
					<Badge variant="secondary" className="capitalize">
						{row.original.kind}
					</Badge>
				),
			},
			{
				accessorKey: "status",
				enableGlobalFilter: false,
				header: sortableHeader,
				meta: {
					label: "Status",
					variant: "select",
					options: statusOptions,
					dynamicCounts: true,
					showCounts: true,
				},
				enableColumnFilter: true,
				enableHiding: true,
				sortingFn: (a, b) =>
					(STATUS_RANK[a.original.status ?? "working"] ?? 0) -
					(STATUS_RANK[b.original.status ?? "working"] ?? 0),
				cell: ({ row }) => (
					<span className="text-sm capitalize">{row.original.status}</span>
				),
			},
			{
				accessorKey: "priority",
				enableGlobalFilter: false,
				header: sortableHeader,
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
				accessorKey: "isFavorite",
				enableGlobalFilter: false,
				header: sortableHeader,
				meta: { label: "Favorite" },
				enableHiding: true,
				cell: ({ row }) =>
					row.original.isFavorite ? (
						<span className="text-yellow-500 text-sm">
							<span aria-hidden>★</span>
							<span className="sr-only">Favorite</span>
						</span>
					) : null,
			},
			{
				accessorKey: "viewType",
				enableGlobalFilter: false,
				header: sortableHeader,
				meta: { label: "View type" },
				enableHiding: true,
				cell: ({ row }) => (
					<Badge
						variant="secondary"
						className="capitalize text-[10px] h-5 px-1.5 text-muted-foreground"
					>
						{row.original.viewType}
					</Badge>
				),
			},
			{
				id: "actions",
				header: () => <div className="text-right">Actions</div>,
				cell: ({ row }) => (
					<div className="flex justify-end">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" className="h-8 w-8 p-0">
									<MoreHorizontal className="h-4 w-4" />
									<span className="sr-only">Project actions</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem
									onClick={() => router.push(`/?project=${row.original.id}`)}
									className="cursor-pointer"
								>
									<ExternalLink className="mr-2 h-4 w-4" />
									Open
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => setProjectToEdit(row.original)}
									className="cursor-pointer"
								>
									<Pencil className="mr-2 h-4 w-4" />
									Edit
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				),
				enableSorting: false,
				enableHiding: false,
				size: 80,
			},
		],
		[router, setProjectToEdit],
	);

	return (
		<DataTableRoot
			data={projects}
			columns={columns}
			initialState={{ sorting: DEFAULT_SORTING }}
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
					<DataTableSearchFilter placeholder="Search projects..." />
					<DataTableViewMenu />
				</DataTableToolbarSection>
				<DataTableToolbarSection className="px-0">
					<DataTableFacetedFilter
						accessorKey="status"
						title="Status"
						options={statusOptions}
					/>
					<DataTableFacetedFilter
						accessorKey="kind"
						title="Kind"
						options={kindOptions}
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

"use client";

import {
	Background,
	Controls,
	Handle,
	type NodeProps,
	Position,
	ReactFlow,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";
import { Flag, Snowflake } from "lucide-react";
import { useMemo } from "react";

const PRIORITY_COLORS: Record<string, string> = {
	p1: "#ef4444", // Red
	p2: "#f97316", // Orange
	p3: "#3b82f6", // Blue
	p4: "#6b7280", // Grey
};

// Using require() instead of import because @dagrejs/dagre's ESM bundle
// contains a dynamic require shim that Turbopack rejects.
// require() resolves to the CJS build which works correctly.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const dagre = require("@dagrejs/dagre");
import "@xyflow/react/dist/style.css";
import type { Goal, Project, Task } from "@/types";

interface MapClientProps {
	initialProjects: Project[];
	initialTasks: Task[];
	initialGoals: Goal[];
}

const nodeWidth = 200;
const nodeHeight = 50;
const summaryNodeWidth = 180;
const summaryNodeHeight = 120;

const TaskSummaryNode = ({ data }: NodeProps) => {
	const counts = data.counts as Record<string, number>;

	return (
		<div
			className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-md flex flex-col gap-1 text-xs"
			style={{ width: summaryNodeWidth }}
		>
			<Handle
				type="target"
				position={Position.Top}
				style={{ visibility: "hidden" }}
			/>

			<div className="font-semibold border-b border-gray-100 dark:border-zinc-800 pb-1 mb-1 text-zinc-900 dark:text-zinc-100">
				Tasks Summary
			</div>

			<div className="flex justify-between text-red-500 dark:text-red-400">
				<span>High (P1)</span>
				<span className="font-bold">{counts.p1 || 0}</span>
			</div>
			<div className="flex justify-between text-orange-500 dark:text-orange-400">
				<span>Medium (P2)</span>
				<span className="font-bold">{counts.p2 || 0}</span>
			</div>
			<div className="flex justify-between text-blue-500 dark:text-blue-400">
				<span>Low (P3)</span>
				<span className="font-bold">{counts.p3 || 0}</span>
			</div>
			<div className="flex justify-between text-gray-500 dark:text-gray-400">
				<span>None (P4)</span>
				<span className="font-bold">{counts.p4 || 0}</span>
			</div>
		</div>
	);
};

const GoalNode = ({ data }: NodeProps) => {
	return (
		<div
			className="bg-white dark:bg-zinc-900 border-2 rounded-lg p-3 font-bold text-base text-center text-zinc-900 dark:text-zinc-100"
			style={{ borderColor: data.color as string, width: nodeWidth }}
		>
			{data.label as React.ReactNode}
			<Handle
				type="source"
				position={Position.Bottom}
				style={{ visibility: "hidden" }}
			/>
		</div>
	);
};

const ProjectNode = ({ data }: NodeProps) => {
	const priority = data.priority as string | undefined;
	const isFrozen = data.isFrozen as boolean;

	return (
		<div
			className={data.className as string}
			style={{
				borderColor: data.borderColor as string | undefined,
				opacity: data.opacity as number,
				width: nodeWidth,
			}}
		>
			<Handle
				type="target"
				position={Position.Top}
				style={{ visibility: "hidden" }}
			/>

			<div className="flex items-center justify-between w-full min-w-0">
				<div className="flex items-center justify-center gap-1.5 flex-1 min-w-0 truncate">
					{isFrozen && <Snowflake className="w-4 h-4 text-sky-500 shrink-0" />}
					<span className="truncate">{data.label as React.ReactNode}</span>
				</div>
				{priority && priority !== "p4" && (
					<Flag
						className="w-4 h-4 shrink-0 ml-1.5"
						style={{ color: PRIORITY_COLORS[priority] }}
					/>
				)}
			</div>

			<Handle
				type="source"
				position={Position.Bottom}
				style={{ visibility: "hidden" }}
			/>
		</div>
	);
};

const nodeTypes = {
	"task-summary": TaskSummaryNode,
	"goal-node": GoalNode,
	"project-node": ProjectNode,
};

function getLayoutedElements(nodes: any[], edges: any[], direction = "TB") {
	const dagreGraph = new dagre.graphlib.Graph();
	dagreGraph.setDefaultEdgeLabel(() => ({}));

	const isHorizontal = direction === "LR";
	dagreGraph.setGraph({
		rankdir: direction,
		nodesep: 150,
		ranksep: 100,
	});

	nodes.forEach((node) => {
		const width = node.type === "task-summary" ? summaryNodeWidth : nodeWidth;
		const height =
			node.type === "task-summary" ? summaryNodeHeight : nodeHeight;
		dagreGraph.setNode(node.id, { width, height });
	});

	edges.forEach((edge) => {
		dagreGraph.setEdge(edge.source, edge.target);
	});

	dagre.layout(dagreGraph);

	const newNodes = nodes.map((node) => {
		const nodeWithPosition = dagreGraph.node(node.id);
		const width = node.type === "task-summary" ? summaryNodeWidth : nodeWidth;
		const height =
			node.type === "task-summary" ? summaryNodeHeight : nodeHeight;

		return {
			...node,
			targetPosition: isHorizontal ? Position.Left : Position.Top,
			sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
			position: {
				x: nodeWithPosition.x - width / 2,
				y: nodeWithPosition.y - height / 2,
			},
		};
	});

	return { nodes: newNodes, edges };
}

export function MapClient({
	initialProjects,
	initialTasks,
	initialGoals,
}: MapClientProps) {
	const { nodes: initialLayoutNodes, edges: initialLayoutEdges } =
		useMemo(() => {
			const nodes = [];
			const edges = [];

			for (const goal of initialGoals) {
				nodes.push({
					id: `goal-${goal.id}`,
					type: "goal-node",
					data: { label: goal.name, color: goal.color },
				});
			}

			const allProjects = initialProjects.filter(
				(p) => p.status !== "archived" && p.status !== "complete",
			);

			for (const project of allProjects) {
				const nodeId = `proj-${project.id}`;
				const isWorking = project.status === "working";
				const isFrozen = project.status === "frozen";

				const label = project.name;

				let className = "border rounded-md p-2.5 font-bold text-center";
				if (isWorking) {
					className +=
						" bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100";
				} else if (isFrozen) {
					className +=
						" bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800";
				} else {
					className +=
						" bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-zinc-700";
				}

				nodes.push({
					id: nodeId,
					type: "project-node",
					data: {
						label,
						className,
						priority: project.priority,
						isFrozen,
						borderColor: isWorking ? project.color || "#777" : undefined,
						opacity: isWorking ? 1 : isFrozen ? 0.9 : 0.6,
					},
				});

				if (project.goalId) {
					edges.push({
						id: `e-goal-${project.goalId}-proj-${project.id}`,
						source: `goal-${project.goalId}`,
						target: nodeId,
						animated: true,
						style: { stroke: "#999", strokeWidth: 2 },
					});
				} else if (project.parentProjectId) {
					edges.push({
						id: `e-parent-${project.parentProjectId}-proj-${project.id}`,
						source: `proj-${project.parentProjectId}`,
						target: nodeId,
						animated: true,
						style: { stroke: "#999", strokeWidth: 2 },
					});
				}
			}

			const tasksByProject: Record<string, Record<string, number>> = {};

			for (const task of initialTasks) {
				if (!task.projectId) continue;

				if (!tasksByProject[task.projectId]) {
					tasksByProject[task.projectId] = { p1: 0, p2: 0, p3: 0, p4: 0 };
				}

				const p = task.priority || "p4";
				if (tasksByProject[task.projectId][p] !== undefined) {
					tasksByProject[task.projectId][p]++;
				} else {
					tasksByProject[task.projectId].p4++;
				}
			}

			for (const [projectId, counts] of Object.entries(tasksByProject)) {
				const associatedProject = allProjects.find((p) => p.id === projectId);
				if (!associatedProject || associatedProject.status !== "working") {
					continue;
				}

				const nodeId = `summary-${projectId}`;
				const totalTasks = Object.values(counts).reduce((a, b) => a + b, 0);
				if (totalTasks === 0) continue;

				nodes.push({
					id: nodeId,
					type: "task-summary",
					data: { counts },
				});

				edges.push({
					id: `e-proj-${projectId}-summary`,
					source: `proj-${projectId}`,
					target: nodeId,
					animated: true,
					style: { stroke: "#e5e7eb", strokeWidth: 1, strokeDasharray: "5,5" },
				});
			}

			return getLayoutedElements(nodes, edges, "TB");
		}, [initialProjects, initialTasks, initialGoals]);

	const [nodes, _setNodes, onNodesChange] = useNodesState(initialLayoutNodes);
	const [edges, _setEdges, onEdgesChange] = useEdgesState(initialLayoutEdges);

	return (
		<div style={{ width: "100%", height: "calc(100vh - 100px)" }}>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				nodeTypes={nodeTypes}
				fitView
			>
				<Background />
				<Controls />
			</ReactFlow>
		</div>
	);
}

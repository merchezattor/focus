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
import { useMemo } from "react";

// import dagre from '@dagrejs/dagre';
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
const summaryNodeHeight = 120; // Estimated height for 4 lines

// Custom Task Summary Node Component
const TaskSummaryNode = ({ data }: NodeProps) => {
	const counts = data.counts as Record<string, number>;

	return (
		<div
			style={{
				width: summaryNodeWidth,
				padding: "10px",
				borderRadius: "8px",
				background: "#fff",
				border: "1px solid #e5e7eb",
				boxShadow:
					"0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
				display: "flex",
				flexDirection: "column",
				gap: "4px",
				fontSize: "12px",
			}}
		>
			<Handle
				type="target"
				position={Position.Top}
				style={{ visibility: "hidden" }}
			/>

			<div
				style={{
					fontWeight: 600,
					borderBottom: "1px solid #f3f4f6",
					paddingBottom: "4px",
					marginBottom: "4px",
				}}
			>
				Tasks Summary
			</div>

			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					color: "#ef4444",
				}}
			>
				<span>High (P1)</span>
				<span style={{ fontWeight: "bold" }}>{counts.p1 || 0}</span>
			</div>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					color: "#f97316",
				}}
			>
				<span>Medium (P2)</span>
				<span style={{ fontWeight: "bold" }}>{counts.p2 || 0}</span>
			</div>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					color: "#3b82f6",
				}}
			>
				<span>Low (P3)</span>
				<span style={{ fontWeight: "bold" }}>{counts.p3 || 0}</span>
			</div>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					color: "#6b7280",
				}}
			>
				<span>None (P4)</span>
				<span style={{ fontWeight: "bold" }}>{counts.p4 || 0}</span>
			</div>
		</div>
	);
};

const nodeTypes = {
	"task-summary": TaskSummaryNode,
};

const getLayoutedElements = (nodes: any[], edges: any[], direction = "TB") => {
	const dagreGraph = new dagre.graphlib.Graph();
	dagreGraph.setDefaultEdgeLabel(() => ({}));

	const isHorizontal = direction === "LR";
	dagreGraph.setGraph({ rankdir: direction });

	nodes.forEach((node) => {
		// Dynamic size based on node type
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
			// We are shifting the dagre node position (anchor=center center) to the top left
			// so it matches the React Flow node anchor point (top left).
			position: {
				x: nodeWithPosition.x - width / 2,
				y: nodeWithPosition.y - height / 2,
			},
		};
	});

	return { nodes: newNodes, edges };
};

export function MapClient({
	initialProjects,
	initialTasks,
	initialGoals,
}: MapClientProps) {
	const { nodes: initialLayoutNodes, edges: initialLayoutEdges } =
		useMemo(() => {
			const nodes = [];
			const edges = [];

			// 1. Create Nodes for Goals
			for (const goal of initialGoals) {
				nodes.push({
					id: `goal-${goal.id}`,
					type: "input",
					data: { label: goal.name },
					style: {
						background: "#fff",
						border: "2px solid",
						borderColor: goal.color,
						borderRadius: "8px",
						padding: "12px",
						fontWeight: "bold",
						fontSize: "16px",
						width: nodeWidth,
						textAlign: "center",
					},
				});
			}

			// 2. Create Nodes for Projects and Edges from Goals
			const allProjects = [...initialProjects];

			for (const project of allProjects) {
				const nodeId = `proj-${project.id}`;
				nodes.push({
					id: nodeId,
					data: { label: project.name },
					style: {
						background: "#fff",
						border: "1px solid #777",
						borderRadius: "5px",
						padding: "10px",
						fontWeight: "bold",
						borderColor: project.color || "#777",
						width: nodeWidth,
					},
				});

				if (project.parentId && project.parentType) {
					const sourceId =
						project.parentType === "goal"
							? `goal-${project.parentId}`
							: `proj-${project.parentId}`;
					edges.push({
						id: `e-parent-${project.parentId}-proj-${project.id}`,
						source: sourceId,
						target: nodeId,
						animated: true,
						style: { stroke: "#999", strokeWidth: 2 },
					});
				}
			}

			// 3. Aggregate Tasks by Project and Create Summary Nodes
			const tasksByProject: Record<string, Record<string, number>> = {};

			for (const task of initialTasks) {
				if (!task.projectId) continue; // Skip inbox tasks

				if (!tasksByProject[task.projectId]) {
					tasksByProject[task.projectId] = { p1: 0, p2: 0, p3: 0, p4: 0 };
				}

				const p = task.priority || "p4"; // Default to p4 if undefined
				if (tasksByProject[task.projectId][p] !== undefined) {
					tasksByProject[task.projectId][p]++;
				} else {
					// handle unexpected priority values just in case
					tasksByProject[task.projectId].p4++;
				}
			}

			for (const [projectId, counts] of Object.entries(tasksByProject)) {
				// Only create if associated project exists (it should, but safety check)
				if (!allProjects.find((p) => p.id === projectId)) continue;

				const nodeId = `summary-${projectId}`;

				// Check if there are any tasks at all
				const totalTasks = Object.values(counts).reduce((a, b) => a + b, 0);
				if (totalTasks === 0) continue;

				nodes.push({
					id: nodeId,
					type: "task-summary",
					data: { counts },
					// style handled in component
				});

				edges.push({
					id: `e-proj-${projectId}-summary`,
					source: `proj-${projectId}`,
					target: nodeId,
					animated: true,
					style: { stroke: "#e5e7eb", strokeWidth: 1, strokeDasharray: "5,5" }, // Dashed line for summary
				});
			}

			return getLayoutedElements(nodes, edges, "TB"); // Top to Bottom layout
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

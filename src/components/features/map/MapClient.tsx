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
import { useEffect, useMemo, useState } from "react";
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

function getLayoutedElements(
	dagreMod: typeof import("@dagrejs/dagre"),
	nodes: any[],
	edges: any[],
	direction = "TB",
) {
	const dagreGraph = new dagreMod.graphlib.Graph();
	dagreGraph.setDefaultEdgeLabel(() => ({}));

	const isHorizontal = direction === "LR";
	dagreGraph.setGraph({ rankdir: direction });

	nodes.forEach((node) => {
		const width = node.type === "task-summary" ? summaryNodeWidth : nodeWidth;
		const height =
			node.type === "task-summary" ? summaryNodeHeight : nodeHeight;
		dagreGraph.setNode(node.id, { width, height });
	});

	edges.forEach((edge) => {
		dagreGraph.setEdge(edge.source, edge.target);
	});

	dagreMod.layout(dagreGraph);

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
	const [dagreMod, setDagreMod] = useState<
		typeof import("@dagrejs/dagre") | null
	>(null);

	useEffect(() => {
		import("@dagrejs/dagre").then((mod) => setDagreMod(mod));
	}, []);

	const { nodes: initialLayoutNodes, edges: initialLayoutEdges } =
		useMemo(() => {
			if (!dagreMod) return { nodes: [], edges: [] };

			const nodes = [];
			const edges = [];

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
				if (!allProjects.find((p) => p.id === projectId)) continue;

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

			return getLayoutedElements(dagreMod, nodes, edges, "TB");
		}, [initialProjects, initialTasks, initialGoals, dagreMod]);

	const [nodes, _setNodes, onNodesChange] = useNodesState(initialLayoutNodes);
	const [edges, _setEdges, onEdgesChange] = useEdgesState(initialLayoutEdges);

	if (!dagreMod) {
		return (
			<div
				style={{
					width: "100%",
					height: "calc(100vh - 100px)",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				Loading map...
			</div>
		);
	}

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

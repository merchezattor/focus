"use client";

import { useMemo } from 'react';
import { ReactFlow, Background, Controls, useNodesState, useEdgesState, Position } from '@xyflow/react';
// import dagre from '@dagrejs/dagre';
const dagre = require('@dagrejs/dagre');
import '@xyflow/react/dist/style.css';
import { Task, Project, Goal } from '@/types';

interface MapClientProps {
    initialProjects: Project[];
    initialTasks: Task[];
    initialGoals: Goal[];
}

const nodeWidth = 200;
const nodeHeight = 50;

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const newNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
            ...node,
            targetPosition: isHorizontal ? Position.Left : Position.Top,
            sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
            // We are shifting the dagre node position (anchor=center center) to the top left
            // so it matches the React Flow node anchor point (top left).
            position: {
                x: nodeWithPosition.x - nodeWidth / 2,
                y: nodeWithPosition.y - nodeHeight / 2,
            },
        };
    });

    return { nodes: newNodes, edges };
};

export function MapClient({ initialProjects, initialTasks, initialGoals }: MapClientProps) {
    const { nodes: initialLayoutNodes, edges: initialLayoutEdges } = useMemo(() => {
        const nodes = [];
        const edges = [];

        // 1. Create Nodes for Goals
        for (const goal of initialGoals) {
            nodes.push({
                id: `goal-${goal.id}`,
                type: 'input',
                data: { label: goal.name },
                style: {
                    background: '#fff',
                    border: '2px solid',
                    borderColor: goal.color,
                    borderRadius: '8px',
                    padding: '12px',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    width: nodeWidth,
                    textAlign: 'center',
                }
            });
        }

        // 2. Create Nodes for Projects and Edges from Goals
        // 2. Create Nodes for Projects and Edges from Goals
        // "Inbox" virtual project removed as per request
        const allProjects = [...initialProjects];

        for (const project of allProjects) {
            const nodeId = `proj-${project.id}`;
            nodes.push({
                id: nodeId,
                // type: project.goalId ? 'default' : 'input', // If it has a parent (goal), it's default, else input (root)
                // Actually React Flow handles types loosely, 'default' is fine for intermediate. 
                data: { label: project.name },
                style: {
                    background: '#fff',
                    border: '1px solid #777',
                    borderRadius: '5px',
                    padding: '10px',
                    fontWeight: 'bold',
                    borderColor: project.color || '#777',
                    width: nodeWidth,
                }
            });

            if (project.goalId) {
                edges.push({
                    id: `e-goal-${project.goalId}-proj-${project.id}`,
                    source: `goal-${project.goalId}`,
                    target: nodeId,
                    animated: true,
                    style: { stroke: '#999', strokeWidth: 2 },
                });
            }
        }

        // 3. Create Nodes for Tasks and Edges from Projects
        for (const task of initialTasks) {
            if (!task.projectId) continue; // Skip inbox tasks
            const projectId = task.projectId;
            const nodeId = `task-${task.id}`;

            nodes.push({
                id: nodeId,
                data: { label: task.title },
                style: {
                    background: '#f9f9f9',
                    border: '1px solid #ddd',
                    padding: '5px 10px',
                    fontSize: '12px',
                    width: nodeWidth,
                }
            });

            edges.push({
                id: `e-proj-${projectId}-${task.id}`,
                source: `proj-${projectId}`,
                target: nodeId,
                animated: true,
            });
        }

        return getLayoutedElements(nodes, edges, 'TB'); // Top to Bottom layout
    }, [initialProjects, initialTasks, initialGoals]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialLayoutNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialLayoutEdges);

    return (
        <div style={{ width: '100%', height: 'calc(100vh - 100px)' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
            >
                <Background />
                <Controls />
            </ReactFlow>
        </div>
    );
}

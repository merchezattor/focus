"use client";

import { useMemo } from 'react';
import { ReactFlow, Background, Controls, useNodesState, useEdgesState, Position } from '@xyflow/react';
// import dagre from '@dagrejs/dagre';
const dagre = require('@dagrejs/dagre');
import '@xyflow/react/dist/style.css';
import { Task, Project } from '@/types';

interface MapClientProps {
    initialProjects: Project[];
    initialTasks: Task[];
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

export function MapClient({ initialProjects, initialTasks }: MapClientProps) {
    const { nodes: initialLayoutNodes, edges: initialLayoutEdges } = useMemo(() => {
        const nodes = [];
        const edges = [];

        // 1. Create Nodes for Projects
        // We treat "Inbox" as a virtual project for tasks with no projectId
        const allProjects = [...initialProjects, { id: 'inbox', name: 'Inbox', color: '#808080' }];

        // Track which projects actually have content to maybe filter empty ones? 
        // For now, let's show all user created projects.

        for (const project of allProjects) {
            nodes.push({
                id: `proj-${project.id}`,
                type: 'input', // Input type for roots usually
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
        }

        // 2. Create Nodes for Tasks and Edges
        for (const task of initialTasks) {
            const projectId = task.projectId || 'inbox';
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
                id: `e-${projectId}-${task.id}`,
                source: `proj-${projectId}`,
                target: nodeId,
                animated: true,
            });
        }

        return getLayoutedElements(nodes, edges, 'TB'); // Top to Bottom layout
    }, [initialProjects, initialTasks]);

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

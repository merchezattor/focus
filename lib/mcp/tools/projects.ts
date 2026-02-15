import { randomUUID } from "node:crypto";
import { z } from "zod";
import type {
	MCPResponse,
	MCPServerContext,
	MCPToolHandler,
} from "@/lib/mcp/types";
import {
	createProject,
	deleteProject,
	readProjects,
	updateProject,
} from "@/lib/storage";
import type { Project } from "@/types/project";

// Input validation schemas
const _emptyInputSchema = z.object({});

const createProjectInputSchema = z.object({
	name: z.string().min(1).max(100),
	color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
	description: z.string().optional(),
	isFavorite: z.boolean().optional(),
	parentId: z.string().uuid().optional(),
	parentType: z.enum(["goal", "project"]).optional(),
	viewType: z.enum(["list", "board"]).optional(),
});

const updateProjectInputSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1).max(100).optional(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.optional(),
	description: z.string().optional(),
	isFavorite: z.boolean().optional(),
	viewType: z.enum(["list", "board"]).optional(),
});

const deleteProjectInputSchema = z.object({
	id: z.string().uuid(),
});

// Tool definitions
export const focusListProjects: MCPToolHandler<Record<string, never>> = async (
	_args: Record<string, never>,
	context: MCPServerContext,
): Promise<MCPResponse> => {
	try {
		const projects = await readProjects(context.user.id);

		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify(projects, null, 2),
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text" as const,
					text: `Error listing projects: ${
						error instanceof Error ? error.message : "Unknown error"
					}`,
				},
			],
			isError: true,
		};
	}
};

export const focusCreateProject: MCPToolHandler<
	z.infer<typeof createProjectInputSchema>
> = async (
	args: z.infer<typeof createProjectInputSchema>,
	context: MCPServerContext,
): Promise<MCPResponse> => {
	try {
		const now = new Date();
		const project: Project = {
			id: randomUUID(),
			name: args.name,
			color: args.color,
			description: args.description,
			isFavorite: args.isFavorite ?? false,
			parentId: args.parentId,
			parentType: args.parentType,
			viewType: args.viewType ?? "list",
			createdAt: now,
			updatedAt: now,
		};

		await createProject(project, context.user.id, context.actorType);

		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify(project, null, 2),
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text" as const,
					text: `Error creating project: ${
						error instanceof Error ? error.message : "Unknown error"
					}`,
				},
			],
			isError: true,
		};
	}
};

export const focusUpdateProject: MCPToolHandler<
	z.infer<typeof updateProjectInputSchema>
> = async (
	args: z.infer<typeof updateProjectInputSchema>,
	context: MCPServerContext,
): Promise<MCPResponse> => {
	try {
		const updates: Partial<Project> & { parentType?: "goal" | "project" } = {};
		if (args.name !== undefined) updates.name = args.name;
		if (args.color !== undefined) updates.color = args.color;
		if (args.description !== undefined) updates.description = args.description;
		if (args.isFavorite !== undefined) updates.isFavorite = args.isFavorite;
		if (args.viewType !== undefined) updates.viewType = args.viewType;

		await updateProject(args.id, updates, context.user.id, context.actorType);

		return {
			content: [
				{
					type: "text" as const,
					text: `Project ${args.id} updated successfully`,
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text" as const,
					text: `Error updating project: ${
						error instanceof Error ? error.message : "Unknown error"
					}`,
				},
			],
			isError: true,
		};
	}
};

export const focusDeleteProject: MCPToolHandler<
	z.infer<typeof deleteProjectInputSchema>
> = async (
	args: z.infer<typeof deleteProjectInputSchema>,
	context: MCPServerContext,
): Promise<MCPResponse> => {
	try {
		await deleteProject(args.id, context.user.id, context.actorType);

		return {
			content: [
				{
					type: "text" as const,
					text: `Project ${args.id} deleted successfully`,
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text" as const,
					text: `Error deleting project: ${
						error instanceof Error ? error.message : "Unknown error"
					}`,
				},
			],
			isError: true,
		};
	}
};

// Export tools array
export const projectTools = [
	{
		name: "focus_list_projects",
		description: "List all projects",
		inputSchema: {
			type: "object" as const,
			properties: {},
		},
		handler: focusListProjects,
	},
	{
		name: "focus_create_project",
		description: "Create a new project",
		inputSchema: {
			type: "object" as const,
			properties: {
				name: {
					type: "string" as const,
					description: "Project name (1-100 characters)",
				},
				color: {
					type: "string" as const,
					description: "Project color in hex format (e.g., #FF5733)",
				},
				description: {
					type: "string" as const,
					description: "Optional project description",
				},
				isFavorite: {
					type: "boolean" as const,
					description: "Whether the project is a favorite",
				},
				parentId: {
					type: "string" as const,
					description: "Optional parent ID (goal or project)",
				},
				parentType: {
					type: "string" as const,
					enum: ["goal", "project"] as const,
					description: "Type of parent entity",
				},
				viewType: {
					type: "string" as const,
					enum: ["list", "board"] as const,
					description: "View type for the project",
				},
			},
			required: ["name", "color"],
		},
		handler: focusCreateProject,
	},
	{
		name: "focus_update_project",
		description: "Update a project",
		inputSchema: {
			type: "object" as const,
			properties: {
				id: {
					type: "string" as const,
					description: "Project ID (UUID)",
				},
				name: {
					type: "string" as const,
					description: "Project name (1-100 characters)",
				},
				color: {
					type: "string" as const,
					description: "Project color in hex format (e.g., #FF5733)",
				},
				description: {
					type: "string" as const,
					description: "Optional project description",
				},
				isFavorite: {
					type: "boolean" as const,
					description: "Whether the project is a favorite",
				},
				viewType: {
					type: "string" as const,
					enum: ["list", "board"] as const,
					description: "View type for the project",
				},
			},
			required: ["id"],
		},
		handler: focusUpdateProject,
	},
	{
		name: "focus_delete_project",
		description: "Delete a project",
		inputSchema: {
			type: "object" as const,
			properties: {
				id: {
					type: "string" as const,
					description: "Project ID (UUID)",
				},
			},
			required: ["id"],
		},
		handler: focusDeleteProject,
	},
];

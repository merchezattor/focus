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
	name: z.string().min(1).max(100).describe("Project name. 1–100 characters."),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.describe('Hex color code in #RRGGBB format, e.g. "#E44332".'),
	description: z.string().optional().describe("Project description."),
	isFavorite: z
		.boolean()
		.optional()
		.describe("Pin as favorite. Defaults to false."),
	parentId: z
		.string()
		.uuid()
		.optional()
		.describe(
			"UUID of a parent goal or project. Must set parentType if provided.",
		),
	parentType: z
		.enum(["goal", "project"])
		.optional()
		.describe(
			'Type of the parent entity. Required when parentId is set. "goal" or "project".',
		),
	viewType: z
		.enum(["list", "board"])
		.optional()
		.describe('Display mode for the project. Defaults to "list".'),
});

const updateProjectInputSchema = z.object({
	id: z.string().uuid().describe("UUID of the project to update."),
	name: z
		.string()
		.min(1)
		.max(100)
		.optional()
		.describe("New project name. 1–100 characters."),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.optional()
		.describe('New hex color code in #RRGGBB format, e.g. "#10B981".'),
	description: z.string().optional().describe("New project description."),
	isFavorite: z.boolean().optional().describe("Pin/unpin as favorite."),
	viewType: z
		.enum(["list", "board"])
		.optional()
		.describe('Change display mode. "list" or "board".'),
});

const deleteProjectInputSchema = z.object({
	id: z.string().uuid().describe("UUID of the project to delete."),
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
		schema: _emptyInputSchema,
		handler: focusListProjects,
	},
	{
		name: "focus_create_project",
		description: "Create a new project",
		schema: createProjectInputSchema,
		handler: focusCreateProject,
	},
	{
		name: "focus_update_project",
		description: "Update a project",
		schema: updateProjectInputSchema,
		handler: focusUpdateProject,
	},
	{
		name: "focus_delete_project",
		description: "Delete a project",
		schema: deleteProjectInputSchema,
		handler: focusDeleteProject,
	},
];

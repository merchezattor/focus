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
const listProjectsInputSchema = z.object({
	kind: z
		.array(z.enum(["project", "group"]))
		.optional()
		.describe(
			"Optional project kind filter. Omit to list all projects, or pass one or both kinds to narrow results.",
		),
});

const createProjectInputSchema = z.object({
	name: z.string().min(1).max(100).describe("Project name. 1–100 characters."),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.describe('Hex color code in #RRGGBB format, e.g. "#E44332".'),
	description: z.string().optional().describe("Project description."),
	kind: z
		.enum(["project", "group"])
		.optional()
		.describe(
			"Project kind. Use 'project' for actionable work, 'group' for structural graph nodes.",
		),
	status: z
		.enum(["working", "archived", "complete", "frozen"])
		.optional()
		.describe('Project status. Defaults to "working".'),
	priority: z
		.enum(["p1", "p2", "p3", "p4"])
		.optional()
		.describe("Project priority. Defaults to 'p4'."),
	isFavorite: z
		.boolean()
		.optional()
		.describe("Pin as favorite. Defaults to false."),
	goalId: z
		.string()
		.uuid()
		.optional()
		.describe("UUID of a parent goal. Use focus_list_goals to find valid IDs."),
	parentProjectId: z
		.string()
		.uuid()
		.optional()
		.describe(
			"UUID of a parent project. Use focus_list_projects to find valid IDs.",
		),
	viewType: z
		.enum(["list", "board", "roadmap"])
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
	kind: z
		.enum(["project", "group"])
		.optional()
		.describe("Change project kind to 'project' or 'group'."),
	status: z
		.enum(["working", "archived", "complete", "frozen"])
		.optional()
		.describe("Change project status."),
	priority: z
		.enum(["p1", "p2", "p3", "p4"])
		.optional()
		.describe("Change project priority. 'p1', 'p2', 'p3', or 'p4'."),
	isFavorite: z.boolean().optional().describe("Pin/unpin as favorite."),
	viewType: z
		.enum(["list", "board", "roadmap"])
		.optional()
		.describe('Change display mode. "list", "board", or "roadmap".'),
});

const deleteProjectInputSchema = z.object({
	id: z.string().uuid().describe("UUID of the project to delete."),
});

// Tool definitions
export const focusListProjects: MCPToolHandler<
	z.infer<typeof listProjectsInputSchema>
> = async (
	args: z.infer<typeof listProjectsInputSchema>,
	context: MCPServerContext,
): Promise<MCPResponse> => {
	try {
		const projects = await readProjects(context.user.id);
		const filteredProjects = args.kind?.length
			? projects.filter((project) => args.kind?.includes(project.kind))
			: projects;

		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify({ success: true, data: filteredProjects }),
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
			kind: args.kind ?? "project",
			description: args.description,
			status: args.status ?? "working",
			priority: args.priority ?? "p4",
			isFavorite: args.isFavorite ?? false,
			goalId: args.goalId,
			parentProjectId: args.parentProjectId,
			viewType: args.viewType ?? "list",
			createdAt: now,
			updatedAt: now,
		};

		await createProject(
			project,
			context.user.id,
			context.actorType,
			context.tokenName,
		);

		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify({ success: true, data: project }),
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
		if (args.kind !== undefined) updates.kind = args.kind;
		if (args.status !== undefined) updates.status = args.status;
		if (args.priority !== undefined) updates.priority = args.priority;
		if (args.isFavorite !== undefined) updates.isFavorite = args.isFavorite;
		if (args.viewType !== undefined) updates.viewType = args.viewType;

		await updateProject(
			args.id,
			updates,
			context.user.id,
			context.actorType,
			context.tokenName,
		);

		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify({
						success: true,
						data: { id: args.id, ...updates },
					}),
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
		await deleteProject(
			args.id,
			context.user.id,
			context.actorType,
			context.tokenName,
		);

		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify({ success: true, id: args.id }),
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
		description:
			"List projects. By default returns all projects, including structural groups. Use the optional kind filter to narrow results.",
		schema: listProjectsInputSchema,
		handler: focusListProjects,
	},
	{
		name: "focus_create_project",
		description:
			"Create a new project. Returns: Complete Project with generated id. viewType defaults to 'list'. parentId requires parentType.",
		schema: createProjectInputSchema,
		handler: focusCreateProject,
	},
	{
		name: "focus_update_project",
		description:
			"Update a project by ID. Partial update: only include changed fields. No fields can be cleared (no nullable params).",
		schema: updateProjectInputSchema,
		handler: focusUpdateProject,
	},
	{
		name: "focus_delete_project",
		description: "Delete a project by ID. Returns: { success, id }.",
		schema: deleteProjectInputSchema,
		handler: focusDeleteProject,
	},
];

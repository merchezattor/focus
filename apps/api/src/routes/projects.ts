import {
	createProject,
	deleteProject,
	getWorkingActionableProjectStats,
	getWorkingProjectStats,
	readActionableProjects,
	readProjects,
	updateProject,
} from "@focus/core/storage";
import { type Project, projectSchema } from "@focus/core/types";
import { Hono } from "hono";
import { z } from "zod";
import { type AppEnv, requireAuth } from "../auth-context";

const createProjectSchema = projectSchema.omit({ id: true });
const updateProjectSchema = projectSchema.partial().omit({ id: true }).extend({
	parentId: z.string().uuid().nullable().optional(),
	parentType: z.enum(["goal", "project", "none"]).nullable().optional(),
});

export const projectsRouter = new Hono<AppEnv>();

projectsRouter.use("*", requireAuth);

// GET /api/projects/stats?scope=actionable|working - per-project task stats
projectsRouter.get("/stats", async (c) => {
	try {
		const { user } = c.get("auth");
		const scope = c.req.query("scope");
		const stats =
			scope === "working"
				? await getWorkingProjectStats(user.id)
				: await getWorkingActionableProjectStats(user.id);
		return c.json({ stats });
	} catch (error) {
		console.error("Failed to get project stats:", error);
		return c.json({ error: "Failed to get project stats" }, 500);
	}
});

projectsRouter.get("/", async (c) => {
	try {
		const { user } = c.get("auth");
		// `?all=true` returns every project (incl. groups) for parent pickers;
		// default returns only actionable projects (sidebar/dashboard).
		const all = c.req.query("all") === "true";
		const projects = all
			? await readProjects(user.id)
			: await readActionableProjects(user.id);
		return c.json({ projects });
	} catch (error) {
		console.error("Failed to read projects:", error);
		return c.json({ error: "Failed to read projects" }, 500);
	}
});

projectsRouter.post("/", async (c) => {
	try {
		const { user, actorType, tokenName } = c.get("auth");
		const body = await c.req.json();

		const result = createProjectSchema.safeParse(body);
		if (!result.success) {
			return c.json(
				{ error: "Invalid project data", details: result.error.format() },
				400,
			);
		}

		const newProject: Project = {
			...result.data,
			id: crypto.randomUUID(),
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		await createProject(newProject, user.id, actorType, tokenName);
		return c.json({ project: newProject }, 201);
	} catch (error) {
		console.error("Failed to create project:", error);
		return c.json({ error: "Failed to create project" }, 500);
	}
});

projectsRouter.put("/", async (c) => {
	try {
		const { user, actorType, tokenName } = c.get("auth");
		const body = await c.req.json();
		const { id, ...data } = body;

		if (!id) {
			return c.json({ error: "Project ID is required" }, 400);
		}

		const result = updateProjectSchema.safeParse(data);
		if (!result.success) {
			console.error("Validation error:", result.error.format());
			return c.json(
				{ error: "Invalid project data", details: result.error.format() },
				400,
			);
		}

		// Map parentId/parentType from client to goalId/parentProjectId
		const cleanData: Record<string, unknown> = { ...result.data };
		if ("parentId" in cleanData && "parentType" in cleanData) {
			if (cleanData.parentType === "goal") {
				cleanData.goalId = cleanData.parentId;
				cleanData.parentProjectId = null;
			} else if (cleanData.parentType === "project") {
				cleanData.parentProjectId = cleanData.parentId;
				cleanData.goalId = null;
			} else {
				cleanData.goalId = null;
				cleanData.parentProjectId = null;
			}
			delete cleanData.parentId;
			delete cleanData.parentType;
		}

		await updateProject(id, cleanData, user.id, actorType, tokenName);
		return c.json({ success: true });
	} catch (error) {
		console.error("Failed to update project:", error);
		const message = error instanceof Error ? error.message : "Server error";
		return c.json({ error: message }, 500);
	}
});

projectsRouter.delete("/", async (c) => {
	try {
		const { user, actorType, tokenName } = c.get("auth");
		const id = c.req.query("id");

		if (!id) {
			return c.json({ error: "Project ID is required" }, 400);
		}

		await deleteProject(id, user.id, actorType, tokenName);
		return c.json({ success: true });
	} catch (error) {
		console.error("Failed to delete project:", error);
		return c.json({ error: "Server error" }, 500);
	}
});

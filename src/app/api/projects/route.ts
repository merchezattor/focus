import { type NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import {
	createProject,
	deleteProject,
	readProjects,
	updateProject,
} from "@/lib/storage";
import { type Project, projectSchema } from "@/types";

// Schema for creating a project (id is generated server-side)
const createProjectSchema = projectSchema.omit({ id: true });
const updateProjectSchema = projectSchema.partial().omit({ id: true });

// GET /api/projects - Get all projects
export async function GET(request: NextRequest) {
	try {
		const auth = await getAuthenticatedUser(request);

		if (!auth) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		const { user } = auth;

		const projects = await readProjects(user.id);
		return NextResponse.json({ projects });
	} catch (error) {
		console.error("Failed to read projects:", error);
		return NextResponse.json(
			{ error: "Failed to read projects" },
			{ status: 500 },
		);
	}
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
	try {
		const auth = await getAuthenticatedUser(request);

		if (!auth) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		const { user, actorType } = auth;

		const body = await request.json();

		// Validate request body
		const result = createProjectSchema.safeParse(body);
		if (!result.success) {
			return NextResponse.json(
				{ error: "Invalid project data", details: result.error.format() },
				{ status: 400 },
			);
		}

		// Add new project with generated id
		// DB will handle createdAt/updatedAt defaults if not provided,
		// but better to be explicit.
		const newProject: Project = {
			...result.data,
			id: crypto.randomUUID(),
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		await createProject(newProject, user.id, actorType);

		return NextResponse.json({ project: newProject }, { status: 201 });
	} catch (error) {
		console.error("Failed to create project:", error);
		return NextResponse.json(
			{ error: "Failed to create project" },
			{ status: 500 },
		);
	}
}

// PUT /api/projects - Update project
export async function PUT(request: NextRequest) {
	try {
		const auth = await getAuthenticatedUser(request);

		if (!auth) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		const { user, actorType } = auth;

		const body = await request.json();
		const { id, ...data } = body;

		if (!id) {
			return NextResponse.json(
				{ error: "Project ID is required" },
				{ status: 400 },
			);
		}

		const result = updateProjectSchema.safeParse(data);
		if (!result.success) {
			console.error("Validation error:", result.error.format());
			return NextResponse.json(
				{ error: "Invalid project data", details: result.error.format() },
				{ status: 400 },
			);
		}

		// result.data.parentType can be null, which is not compatible with string literal type in updateProject
		// We need to cast it or ensure it matches.
		// updateProject expects { parentType?: "goal" | "project" }
		// result.data has { parentType?: "goal" | "project" | null }
		// We need to strip null or convert to undefined if null
		const cleanData = {
			...result.data,
			parentType:
				result.data.parentType === null ? undefined : result.data.parentType,
		};

		await updateProject(id, cleanData, user.id, actorType);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to update project:", error);
		// Return the actual error message if safe (for dev/mvp)
		const message = error instanceof Error ? error.message : "Server error";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

// DELETE /api/projects - Delete project
export async function DELETE(request: NextRequest) {
	try {
		const auth = await getAuthenticatedUser(request);

		if (!auth) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		const { user, actorType } = auth;

		const { searchParams } = new URL(request.url);
		const id = searchParams.get("id");

		if (!id) {
			return NextResponse.json(
				{ error: "Project ID is required" },
				{ status: 400 },
			);
		}

		await deleteProject(id, user.id, actorType);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to delete project:", error);
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	}
}

import { NextRequest, NextResponse } from 'next/server';
import { readProjects, createProject } from '@/lib/storage';
import { projectSchema, type Project } from '@/types';
import { z } from 'zod';

// Schema for creating a project (id is generated server-side)
const createProjectSchema = projectSchema.omit({ id: true });

// GET /api/projects - Get all projects
export async function GET() {
  try {
    const projects = await readProjects();
    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Failed to read projects:', error);
    return NextResponse.json(
      { error: 'Failed to read projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const result = createProjectSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid project data', details: result.error.format() },
        { status: 400 }
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

    await createProject(newProject);

    return NextResponse.json({ project: newProject }, { status: 201 });
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

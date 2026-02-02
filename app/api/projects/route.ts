import { NextRequest, NextResponse } from 'next/server';
import { readProjects, writeProjects } from '@/lib/storage';
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
    
    // Read existing projects
    const projects = await readProjects();
    
    // Add new project with generated id
    const newProject: Project = {
      ...result.data,
      id: crypto.randomUUID(),
    };
    
    projects.push(newProject);
    
    // Write back to file
    await writeProjects(projects);
    
    return NextResponse.json({ project: newProject }, { status: 201 });
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

import { promises as fs } from 'fs';
import { join } from 'path';
import { z } from 'zod';
import { taskSchema, projectSchema, type Task, type Project } from '@/types';

const DATA_DIR = join(process.cwd(), 'data');
const TASKS_FILE = join(DATA_DIR, 'tasks.json');
const PROJECTS_FILE = join(DATA_DIR, 'projects.json');

const tasksArraySchema = z.array(taskSchema);
const projectsArraySchema = z.array(projectSchema);

const defaultTasks: Task[] = [];

const defaultProjects: Project[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Inbox',
    color: '#808080',
    isFavorite: true,
  },
];

async function ensureDataDir(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function atomicWriteFile(filePath: string, data: string): Promise<void> {
  const tempPath = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).slice(2)}`;

  try {
    await fs.writeFile(tempPath, data, 'utf-8');
    await fs.rename(tempPath, filePath);
  } catch (error) {
    try {
      await fs.unlink(tempPath);
    } catch { }
    throw error;
  }
}

export async function readTasks(): Promise<Task[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(TASKS_FILE, 'utf-8');
    const parsed = JSON.parse(data, (key, value) => {
      const dateFields = ['dueDate', 'planDate', 'createdAt', 'updatedAt', 'postedAt'];
      if (dateFields.includes(key) && value) {
        return new Date(value);
      }
      return value;
    });

    const result = tasksArraySchema.safeParse(parsed);

    if (!result.success) {
      console.error('Tasks validation failed:', result.error.format());
      throw new Error(`Invalid tasks data: ${result.error.message}`);
    }

    return result.data;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [...defaultTasks];
    }
    throw error;
  }
}

export async function writeTasks(tasks: Task[]): Promise<void> {
  const result = tasksArraySchema.safeParse(tasks);

  if (!result.success) {
    console.error('Tasks validation failed:', result.error.format());
    throw new Error(`Cannot write invalid tasks: ${result.error.message}`);
  }

  await ensureDataDir();
  const data = JSON.stringify(tasks, null, 2);
  await atomicWriteFile(TASKS_FILE, data);
}

export async function readProjects(): Promise<Project[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(PROJECTS_FILE, 'utf-8');
    const parsed = JSON.parse(data, (key, value) => {
      const dateFields = ['dueDate', 'createdAt', 'updatedAt'];
      if (dateFields.includes(key) && value) {
        return new Date(value);
      }
      return value;
    });

    const result = projectsArraySchema.safeParse(parsed);

    if (!result.success) {
      console.error('Projects validation failed:', result.error.format());
      throw new Error(`Invalid projects data: ${result.error.message}`);
    }

    return result.data;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [...defaultProjects];
    }
    throw error;
  }
}

export async function writeProjects(projects: Project[]): Promise<void> {
  const result = projectsArraySchema.safeParse(projects);

  if (!result.success) {
    console.error('Projects validation failed:', result.error.format());
    throw new Error(`Cannot write invalid projects: ${result.error.message}`);
  }

  await ensureDataDir();
  const data = JSON.stringify(projects, null, 2);
  await atomicWriteFile(PROJECTS_FILE, data);
}

export async function initializeStorage(): Promise<void> {
  await ensureDataDir();

  try {
    await fs.access(TASKS_FILE);
  } catch {
    await writeTasks(defaultTasks);
  }

  try {
    await fs.access(PROJECTS_FILE);
  } catch {
    await writeProjects(defaultProjects);
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { readTasks, writeTasks } from '@/lib/storage';
import { taskSchema, type Task } from '@/types';
import { z } from 'zod';

// PATCH /api/tasks/[id] - Update task
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Read existing tasks
    const tasks = await readTasks();
    const taskIndex = tasks.findIndex((t) => t.id === id);

    if (taskIndex === -1) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Partial validation for update - all fields are optional
    const updateSchema = taskSchema.partial().extend({
      dueDate: z.union([z.string(), z.date(), z.null()]).optional().transform((val: string | Date | null | undefined) => {
        if (typeof val === 'string') return new Date(val);
        return val;
      }),
      planDate: z.union([z.string(), z.date(), z.null()]).optional().transform((val: string | Date | null | undefined) => {
        if (typeof val === 'string') return new Date(val);
        return val;
      }),
      comments: z.array(z.object({
        id: z.string().uuid(),
        content: z.string(),
        postedAt: z.union([z.string(), z.date()]).transform((val) => new Date(val)),
      })).optional(),
    });
    const result = updateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid update data', details: result.error.format() },
        { status: 400 }
      );
    }

    const updatedTask = {
      ...tasks[taskIndex],
      ...result.data,
      id,
      createdAt: tasks[taskIndex].createdAt,
      updatedAt: new Date(),
    } as Task;

    tasks[taskIndex] = updatedTask;

    // Write back to file
    await writeTasks(tasks);

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error('Failed to update task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Delete task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Read existing tasks
    const tasks = await readTasks();
    const taskIndex = tasks.findIndex((t) => t.id === id);

    if (taskIndex === -1) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Remove task
    tasks.splice(taskIndex, 1);

    // Write back to file
    await writeTasks(tasks);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}

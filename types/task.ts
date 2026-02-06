import { z } from "zod";

export const commentSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  postedAt: z.date(),
});

export type Comment = z.infer<typeof commentSchema>;

export const taskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  completed: z.boolean(),
  projectId: z.string().uuid().nullable(),
  dueDate: z.date().nullable(),
  planDate: z.date().nullable().optional(),
  priority: z.enum(["p1", "p2", "p3", "p4"]),
  status: z.enum(["todo", "in_progress", "review", "done"]).optional().default("todo"),
  comments: z.array(commentSchema).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Task = z.infer<typeof taskSchema>;

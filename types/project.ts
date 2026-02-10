import { z } from "zod";

export const projectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
  parentType: z.enum(['goal', 'project']).nullable().optional(),
  viewType: z.enum(['list', 'board']).default('list').optional(),
  isFavorite: z.boolean(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Project = z.infer<typeof projectSchema>;

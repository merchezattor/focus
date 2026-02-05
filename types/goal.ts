import { z } from "zod";

export const goalSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    priority: z.enum(['p1', 'p2', 'p3', 'p4']),
    dueDate: z.date().optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});

export type Goal = z.infer<typeof goalSchema>;

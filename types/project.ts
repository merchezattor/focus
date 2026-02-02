import { z } from "zod";

export const projectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  isFavorite: z.boolean(),
});

export type Project = z.infer<typeof projectSchema>;

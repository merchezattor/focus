import { z } from "zod";

export const milestoneSchema = z.object({
	id: z.string().uuid(),
	title: z.string().min(1).max(200),
	description: z.string().max(1000).optional(),
	targetDate: z.date(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export type Milestone = z.infer<typeof milestoneSchema>;

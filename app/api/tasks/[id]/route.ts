import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { deleteTask, syncComments, updateTask } from "@/lib/storage";
import { taskSchema } from "@/types";

// PATCH /api/tasks/[id] - Update task
export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const auth = await getAuthenticatedUser(request);
		if (!auth) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		const { user, actorType } = auth;

		const { id } = await params;
		const body = await request.json();

		// Partial validation for update - all fields are optional
		const updateSchema = taskSchema.partial().extend({
			dueDate: z
				.union([z.string(), z.date(), z.null()])
				.optional()
				.transform((val: string | Date | null | undefined) => {
					if (typeof val === "string") return new Date(val);
					return val;
				}),
			planDate: z
				.union([z.string(), z.date(), z.null()])
				.optional()
				.transform((val: string | Date | null | undefined) => {
					if (typeof val === "string") return new Date(val);
					return val;
				}),
			comments: z
				.array(
					z.object({
						id: z.string().uuid(),
						content: z.string(),
						postedAt: z
							.union([z.string(), z.date()])
							.transform((val) => new Date(val)),
					}),
				)
				.optional(),
		});
		const result = updateSchema.safeParse(body);

		if (!result.success) {
			return NextResponse.json(
				{ error: "Invalid update data", details: result.error.format() },
				{ status: 400 },
			);
		}

		// Perform Update
		await updateTask(id, result.data, user.id, actorType);

		// Sync comments if provided
		if (result.data.comments) {
			await syncComments(id, result.data.comments);
		}

		// Creating a mock response
		const updatedResponse = {
			...result.data,
			id,
			updatedAt: new Date(),
		};

		return NextResponse.json({ task: updatedResponse });
	} catch (error) {
		console.error("Failed to update task:", error);
		return NextResponse.json(
			{ error: "Failed to update task" },
			{ status: 500 },
		);
	}
}

// DELETE /api/tasks/[id] - Delete task
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const auth = await getAuthenticatedUser(request);
		if (!auth) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		const { user, actorType } = auth;

		const { id } = await params;

		await deleteTask(id, user.id, actorType);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to delete task:", error);
		return NextResponse.json(
			{ error: "Failed to delete task" },
			{ status: 500 },
		);
	}
}

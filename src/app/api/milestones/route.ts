import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/api-auth";
import {
	createMilestone,
	deleteMilestone,
	readMilestones,
	updateMilestone,
} from "@/lib/storage";
import { type Milestone, milestoneSchema } from "@/types";

const createMilestoneSchema = milestoneSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
	targetDate: true,
});

const milestoneDateSchema = z.object({
	targetDate: z
		.string()
		.datetime()
		.transform((value) => new Date(value)),
});

const updateMilestoneSchema = z.object({
	title: z.string().min(1).max(200).optional(),
	description: z.string().max(1000).optional(),
	targetDate: z
		.string()
		.datetime()
		.optional()
		.transform((value) => (value ? new Date(value) : undefined)),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
});

export async function GET(request: NextRequest) {
	try {
		const auth = await getAuthenticatedUser(request);

		if (!auth) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const milestones = await readMilestones(auth.user.id);
		return NextResponse.json({ milestones });
	} catch (error) {
		console.error("Failed to read milestones:", error);
		return NextResponse.json(
			{ error: "Failed to read milestones" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const auth = await getAuthenticatedUser(request);

		if (!auth) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const fieldsResult = createMilestoneSchema.safeParse(body);
		const dateResult = milestoneDateSchema.safeParse(body);

		if (!fieldsResult.success || !dateResult.success) {
			return NextResponse.json(
				{
					error: "Invalid milestone data",
					details: {
						fields: fieldsResult.success
							? undefined
							: fieldsResult.error.format(),
						targetDate: dateResult.success
							? undefined
							: dateResult.error.format(),
					},
				},
				{ status: 400 },
			);
		}

		const newMilestone: Milestone = {
			...fieldsResult.data,
			id: crypto.randomUUID(),
			targetDate: dateResult.data.targetDate,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		await createMilestone(
			newMilestone,
			auth.user.id,
			auth.actorType,
			auth.tokenName,
		);

		return NextResponse.json({ milestone: newMilestone }, { status: 201 });
	} catch (error) {
		console.error("Failed to create milestone:", error);
		return NextResponse.json(
			{ error: "Failed to create milestone" },
			{ status: 500 },
		);
	}
}

export async function PUT(request: NextRequest) {
	try {
		const auth = await getAuthenticatedUser(request);

		if (!auth) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { id, ...data } = body;

		if (!id) {
			return NextResponse.json(
				{ error: "Milestone ID is required" },
				{ status: 400 },
			);
		}

		const result = updateMilestoneSchema.safeParse(data);
		if (!result.success) {
			return NextResponse.json(
				{
					error: "Invalid milestone data",
					details: result.error.format(),
				},
				{ status: 400 },
			);
		}

		await updateMilestone(
			id,
			result.data,
			auth.user.id,
			auth.actorType,
			auth.tokenName,
		);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to update milestone:", error);
		return NextResponse.json(
			{ error: "Failed to update milestone" },
			{ status: 500 },
		);
	}
}

export async function DELETE(request: NextRequest) {
	try {
		const auth = await getAuthenticatedUser(request);

		if (!auth) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const id = searchParams.get("id");

		if (!id) {
			return NextResponse.json(
				{ error: "Milestone ID is required" },
				{ status: 400 },
			);
		}

		await deleteMilestone(id, auth.user.id, auth.actorType, auth.tokenName);
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to delete milestone:", error);
		return NextResponse.json(
			{ error: "Failed to delete milestone" },
			{ status: 500 },
		);
	}
}

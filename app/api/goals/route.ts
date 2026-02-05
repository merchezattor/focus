import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createGoal } from "@/lib/storage";
import { goalSchema } from "@/types/goal";
import { z } from "zod";

export async function POST(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const json = await req.json();

        // Server-side validation/defaults
        const body = {
            ...json,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
            // Parse dates if they are strings
            dueDate: json.dueDate ? new Date(json.dueDate) : undefined,
        };

        const result = goalSchema.safeParse(body);

        if (!result.success) {
            return new NextResponse(JSON.stringify(result.error), { status: 400 });
        }

        await createGoal(result.data, session.user.id);

        return NextResponse.json({ goal: result.data }, { status: 201 });
    } catch (error) {
        console.error('[GOALS_POST]', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

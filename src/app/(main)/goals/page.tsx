import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GoalsPageClient } from "@/components/features/goals/GoalsPageClient";
import { auth } from "@/lib/auth";
import { readGoals } from "@/lib/storage";

export default async function GoalsPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/login");
	}

	const goals = await readGoals(session.user.id);

	return (
		<Suspense fallback={<div className="flex-1 p-6">Loading goals...</div>}>
			<GoalsPageClient initialGoals={goals} />
		</Suspense>
	);
}

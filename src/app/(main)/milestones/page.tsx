import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { MilestonesPageClient } from "@/components/features/milestones/MilestonesPageClient";
import { auth } from "@/lib/auth";
import { readMilestones } from "@/lib/storage";

export default async function MilestonesPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/login");
	}

	const milestones = await readMilestones(session.user.id);

	return (
		<Suspense
			fallback={<div className="flex-1 p-6">Loading milestones...</div>}
		>
			<MilestonesPageClient initialMilestones={milestones} />
		</Suspense>
	);
}

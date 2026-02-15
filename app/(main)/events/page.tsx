import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ActionList } from "@/components/actions/ActionList";
import { type EntityType, getActions } from "@/lib/actions";
import { auth } from "@/lib/auth";

interface PageProps {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function EventsPage(props: PageProps) {
	// 1. Auth Check
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/login");
	}

	// 2. Parse Params
	const searchParams = await props.searchParams;
	const limit =
		typeof searchParams.limit === "string"
			? parseInt(searchParams.limit, 10)
			: 50;
	const entityType =
		typeof searchParams.entityType === "string"
			? (searchParams.entityType as EntityType)
			: undefined;

	// 3. Fetch Data
	// Fetch actions for the current user.
	// getActions returns { actorId, ... }
	// We want to see actions RELEVANT to the user.
	// getActions implements logic: excluded own actions?
	// Let's check getActions logic again. It currently excludes own actions (ne(actorId, userId)).
	// That means I see what OTHERS (Agents) did.
	const actions = await getActions({
		userId: session.user.id,
		limit,
		entityType,
		includeOwn: true,
	});

	return (
		<div className="flex-1 overflow-auto p-6">
			<Suspense fallback={<div>Loading activity...</div>}>
				<ActionList actions={actions} />
			</Suspense>
		</div>
	);
}

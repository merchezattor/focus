import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ActionList } from "@/components/features/actions/ActionList";
import { actionsQuery, unreadCountQuery } from "@/lib/queries";

type EventsSearch = { limit?: number; entityType?: string };

export const Route = createFileRoute("/_main/events")({
	validateSearch: (search: Record<string, unknown>): EventsSearch => ({
		limit: search.limit ? Number(search.limit) : undefined,
		entityType:
			typeof search.entityType === "string" ? search.entityType : undefined,
	}),
	component: Events,
});

function Events() {
	const { limit, entityType } = Route.useSearch();
	const actions = useQuery(actionsQuery({ limit: limit ?? 50, entityType }));
	const unread = useQuery(unreadCountQuery());

	return (
		<div className="flex-1 overflow-auto p-6">
			{!actions.data ? (
				<div>Loading activity...</div>
			) : (
				<ActionList
					// biome-ignore lint/suspicious/noExplicitAny: API returns ISO date strings; ActionList tolerates them at runtime
					actions={actions.data as any}
					unreadCount={unread.data ?? 0}
				/>
			)}
		</div>
	);
}

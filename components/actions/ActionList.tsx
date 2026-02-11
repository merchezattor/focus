"use client";

import { format } from "date-fns";
import { CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
// Import types from a shared location if possible, or define interface matching the data
import type { ActionType, ActorType, EntityType } from "@/lib/actions";
import { ActionItem } from "./ActionItem";

interface Action {
	id: string;
	entityId: string;
	entityType: EntityType;
	actorId: string;
	actorType: ActorType;
	actionType: ActionType;
	changes: any;
	metadata: any;
	createdAt: Date;
	isRead: boolean;
}

interface ActionListProps {
	actions: Action[];
}

export function ActionList({ actions }: ActionListProps) {
	const router = useRouter();
	const [isMarking, setIsMarking] = useState(false);

	const groupedActions = useMemo(() => {
		const groups: Record<string, Action[]> = {};

		actions.forEach((action) => {
			const dateKey = format(new Date(action.createdAt), "yyyy-MM-dd");
			if (!groups[dateKey]) {
				groups[dateKey] = [];
			}
			groups[dateKey].push(action);
		});

		const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a)); // Newest first

		return { dates: sortedDates, groups };
	}, [actions]);

	const handleMarkAllRead = async () => {
		const unreadIds = actions.filter((a) => !a.isRead).map((a) => a.id);
		if (unreadIds.length === 0) {
			toast.info("No unread actions");
			return;
		}

		setIsMarking(true);
		try {
			const res = await fetch("/api/actions/read", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ids: unreadIds }),
			});

			if (!res.ok) throw new Error("Failed to mark as read");

			toast.success("All marked as read");
			router.refresh();
		} catch (error) {
			console.error(error);
			toast.error("Failed to mark actions as read");
		} finally {
			setIsMarking(false);
		}
	};

	if (actions.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
				<p>No activity recorded yet.</p>
			</div>
		);
	}

	const unreadCount = actions.filter((a) => !a.isRead).length;

	return (
		<div className="space-y-8 max-w-3xl mx-auto py-6">
			<div className="flex items-center justify-between px-1">
				<h1 className="text-2xl font-bold">Activity Log</h1>
				{unreadCount > 0 && (
					<Button
						variant="outline"
						size="sm"
						onClick={handleMarkAllRead}
						disabled={isMarking}
						className="gap-2"
					>
						<CheckCheck className="h-4 w-4" />
						Mark all as read
					</Button>
				)}
			</div>

			{groupedActions.dates.map((date) => (
				<section key={date}>
					<h2 className="text-sm font-bold border-b pb-2 mb-4 px-1 sticky top-0 bg-background z-10">
						{format(new Date(date), "d MMM")}{" "}
						<span className="text-muted-foreground font-normal">
							· {format(new Date(date), "EEEE")}
						</span>
					</h2>
					<div className="space-y-1">
						{groupedActions.groups[date].map((action) => (
							<ActionItem key={action.id} action={action} />
						))}
					</div>
				</section>
			))}
		</div>
	);
}

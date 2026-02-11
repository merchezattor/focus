"use client";

import { format } from "date-fns";
import {
	Activity,
	CheckCircle2,
	Circle,
	Edit,
	FilePlus,
	Trash2,
	User,
} from "lucide-react";
import type { ActionType, ActorType, EntityType } from "@/lib/actions";

interface ActionItemProps {
	action: {
		id: string;
		entityId: string;
		entityType: EntityType;
		actorId: string;
		actorType: ActorType;
		actionType: ActionType;
		changes: any;
		createdAt: Date;
		isRead: boolean;
	};
}

export function ActionItem({ action }: ActionItemProps) {
	const getIcon = () => {
		switch (action.actionType) {
			case "create":
				return <FilePlus className="h-4 w-4 text-green-500" />;
			case "update":
				return <Edit className="h-4 w-4 text-blue-500" />;
			case "delete":
				return <Trash2 className="h-4 w-4 text-red-500" />;
			case "complete":
				return <CheckCircle2 className="h-4 w-4 text-green-600" />;
			case "uncomplete":
				return <Circle className="h-4 w-4 text-gray-500" />;
			default:
				return <Activity className="h-4 w-4 text-gray-400" />;
		}
	};

	const getActorLabel = () => {
		return action.actorType === "agent" ? "AI Agent" : "User";
		// Ideally fetch user name if possible, but for mvp actorType is enough distinction
	};

	const getDescription = () => {
		const entity =
			action.entityType.charAt(0).toUpperCase() + action.entityType.slice(1);
		switch (action.actionType) {
			case "create":
				return `Created ${entity}`;
			case "update": {
				const keys = action.changes
					? Object.keys(action.changes).join(", ")
					: "properties";
				return `Updated ${entity} (${keys})`;
			}
			case "delete":
				return `Deleted ${entity}`;
			case "complete":
				return `Completed ${entity}`;
			case "uncomplete":
				return `Uncompleted ${entity}`;
			default:
				return `Acted on ${entity}`;
		}
	};

	return (
		<div
			className={`group flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-accent/50 transition-colors ${!action.isRead ? "bg-accent/10" : ""}`}
		>
			<div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<span className="font-medium text-sm">{getActorLabel()}</span>
					<span className="text-muted-foreground text-xs">•</span>
					<span className="text-sm text-foreground/90">{getDescription()}</span>
				</div>
				{action.actionType === "update" && action.changes && (
					<div className="text-xs text-muted-foreground mt-0.5 truncate">
						{JSON.stringify(action.changes)}
					</div>
				)}
			</div>
			<div className="text-xs text-muted-foreground whitespace-nowrap">
				{format(new Date(action.createdAt), "MMM d, h:mm a")}
			</div>
		</div>
	);
}
